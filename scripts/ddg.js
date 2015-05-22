op = optparse;
parser = new op.Parser(
    "ddg [QUERY] OPTIONS",
    {
        QUERY: ["string to search with", op.filters.position("query", op.coercers.nonOption)],
        OPTIONS: op.filters.options([
            op.options.set("disambig", "d", "Show disambiguation results"),
            op.options.set("html", "H", "Show HTML formated results"),
            op.options.set("help", "h", "View this help page"),
        ]),
    },
    {
        html: false,
        help: false,
        disambig: false,
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
        var url = "http://api.duckduckgo.com/? + [
                "format=json",
                "t=TermJS",
                "q="+encodeURI(query),
                "no_html="+(opts.html?0:1),
                "skip_disambig="+(opts.disambig?0:1),
                ].join("&")
        $.ajax({
            url: url,
            dataType: "jsonp",
            success: function(reply){
                console.log(reply);
                var R = reply.RelatedTopics
                for(var i = 0; i < R.length; i++){
                    if(R[i].Result)
                        io.writeln(R[i].Result);
                    else if(R[i].Topic){
                        for(var j = 0; j < R[i].Topics.length; j++){
                            io.writeln(R[i].Topic[j].Result);
                        }
                    }
                }
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
        ddg(opts.query, function(results){
            io.kill(new Success());
        })
    }
    else{
        function read(line){
            ddg(line, function(){
                io.readln(read);
            });
        }
        io.readln(read);
    }
    io.errln("DDG answers provided by <a href='//duckduckgo.com'>DuckDuckGo</a><img src='//duckduckgo.com/favicon.ico'></img>")
}
