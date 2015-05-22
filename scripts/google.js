function pick(value, other){
	if(value === undefined){
		return other;
	}
	return value;
}
function results(query, amount, sort){
	return new Promise(function(resolve, reject){
		var newQuery = encodeURI(query.replace(" ", "+"));
		$.ajax({
                    url: "https://www.googleapis.com/customsearch/v1element?" + ["key=AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY",
                        "rsz=filtered_cse",
                        "num=" + pick(amount, 10),
                        "hl=en",
                        "prettyPrint=false",
                        "source=gcsc",
                        "gss=.ca",
                        "sig=cb6ef4de1f03dde8c26c6d526f8a1f35",
                        "cx=009520198101815594489:e-3xa5rpink",
                        "q="+newQuery,
                        "&sort=" + pick(sort, ""),
                        "googlehost=www.google.com",
                        "oq=" + newQuery,
                        "gs_l=partner.3...1869.3159.0.3553.5.5.0.0.0.0.60.276.5.5.0.gsnos%2Cn%3D13...0.1288j583398j5..1ac.1.25.partner..5.0.0.e4jJxFj5VpE"
                        ].join("&"),
                    method: "GET",
                    dataType: "jsonp",
		})
                    .done(function(json){
                        resolve(json)
                    })
                    .fail(function(error){
                        reject(error)
                    })
	});
}
var op = optparse;
var parser = new op.Parser(
    "google [QUERY] OPTIONS",{
        QUERY: ["a string to search with.", op.filters.position("query", op.coercers.nonOption)],
        OPTIONS: op.filters.options([
            op.options.set("help", "h", "display this help message"),
            op.options.enum("output", "link", "link", "l"),
            op.options.enum("output", "content", "content", "c"),
            op.options.enum("output", "title", "title", "t"),
            op.options.data(op.coercers.identity, "sort", "s", "the order to sort results by. For example: date"),
            op.options.data(op.coercers.int, "amount", "a", "the amount of values wanted to be returned"),
        ])},
        {help: false,
            output: "link",
            sort: "",
            amount: 10,
        }
);
window.process.google = function(args, io){
	alive = true;
        try{
            var options = parser.parse(args);
        }catch(e){
            io.errln(e.message);
            throw new WrongUsage(e.message)
        }
        if(options.help){
            io.writeln(parser.doc);
            throw new Success();
        }
        function deal(query){
            results(query, options.amount, options.sort).then(
                function(json){
                    console.log(json.results)
                    var attribute = {link: "unescapedUrl", 
                        content: "contentNoFormatting", 
                        title: "titleNoFormatting"}[options.output]
                    for(var i = 0; i < json.results.length; i++){
                        io.writeln(json.results[i][attribute]);
                    }
                    if(options.query)
                        io.kill(new Success());
                    else io.readln(deal);
                },
                function(error){
                    io.errln(JSON.stringify(error, 3))
                    io.kill(new Failure(error));
                }
            )
        }
        if(options.query){
            deal(options.query);
        }
        io.readln(deal);
};
