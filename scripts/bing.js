op = optparse3;
var parser = new op.Parser(
    "bing [QUERY] OPTIONS",
    {
        QUERY: ["Terms to search with. If blank, takes from stdin.", op.filters.position("query", op.coercers.nonOption)],
        OPTIONS: op.filters.options([
            op.options.data(op.coercers.identity, "apikey", "a", "The API key to use"),
            op.options.set("help", "h", "Display this help message"),
            ])
    },
    {
        help: false,
        apikey: window.environment.BINGKEY,
    },
);
window.man.bing = parser.doc;
window.process.bing = function bing(args, io){
    try{
        opts = parser.parse(args);
    }
    catch(e){
        io.errln(e);
        throw new WrongUsage(e.message)
    }
    if(opts.help){
        io.writeln(parser.toString());
        throw new Success();
    }
    if(!opts.apikey){
        io.errln("bing: no apikey provided");
        throw new WrongUsage("No api key");
    }
    function bing(query){
        /*rootUri = 'https://api.datamarket.azure.com/Bing/Search';
        operation = 'Web';
        $market = ($_GET['market']) ? $_GET['market'] : 'en-us';*/
        var query = encodeURIComponent("'"+query+"'"),
            apikey = encodeURIComponent(opts.apikey),
            /*market = urlencode("'en-us'"),
            requestUri = rootUri + "/"+ operation + "?$+format=json&Query=" + query + "&Market=" + market,*/
            var bingurl="http://api.search.live.net/json.aspx?Appid="+apikey+"&query="+query+"&sources=web";
        console.log(bingurl);
        $.ajax({
            jsonp: "jsonp",
            type: "GET",
            url: bingurl,
            data: "{}",
            contentType: "application/json; charset=utf-8",
            dataType: "jsonp",
            success: function(data) {
                console.log(data);
                io.writeln(data);
                if(!opts.query)io.readln(bing);
                else throw new Success();
            },
            error: function(msg) {
                console.log(arguments);
                io.errln(msg);
                io.kill(new Failure())
            }
            });
    }
    if(opts.query){
        bing(opts.query);
    }
    else{
        io.readln(bing);
    }
}
