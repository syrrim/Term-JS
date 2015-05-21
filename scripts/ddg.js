$(document).append("DDG answers provided by <a href='//duckduckgo.com'>DuckDuckGo</a><img src='//duckduckgo.com/favicon.ico'></img>");

op = optparse3;
parser = new op.Parser(
    "ddg [QUERY] OPTIONS",
    {
        QUERY: ["string to search with", op.filters.position("query", op.coercers.nonOption)],
        OPTIONS: op.filters.options([
            op.options.set("html", "H", "view HTML formated results"),
            op.options.set("help", "h", "view this help page"),
        ]),
    },
    {
        html: false,
        help: false,
    }
)

process.ddg = function(args, io){
    try{
        opts = parser.parse(args);
    }catch(e){
        io.errln(e.message);
        throw new WrongUsage(e.message);
    }
    if(opts.help){
        io.writeln(parser.doc);
        throw new Success();
    }
    function ddg(query, callback){
        var url = "http://api.duckduckgo.com/?t=TermJS&q="+encodeURI(query);
        $.ajax({
            url: url,
            dataType: "jsonp",
            success: function(reply){
                console.log(reply);
                io.writeln(JSON.stringify(reply, undefined, 4));
                callback();
            },
            error: function(){
                console.log(arguments);
                io.errln("Query for '"+query+"' failed");
                io.kill(new Failure("IOError"));
            },
        })
    }
    if(opts.query){
        ddg(query, function(results){
            io.kill(new Success());
        })
    }
    else{
        function read(line){
            ddg(line, function(){
                io.readln(read);
            };
        }
        io.readln(read);
    }
}
