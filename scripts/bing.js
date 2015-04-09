var parser = new optparse.OptionParser([
    ["-a", "--apionce KEY", "specify a bing search api key to use this time"],
    ["-A", "--apialways KEY", "specify the bing search api key to use this session"],
    ["-q", "--query MESSAGE", "specify the string with which to make your query"],
    ["-h", "--help", "display this help message"],
]);

window.process.bing = function bing(args, stdin, stdout, stderr, communicate){
    var apikey = window.environment.BINGKEY,
        query = "",
        help = false;
    parser.on("apionce", function(name, value){
        apikey = value;
    });
    parser.on("apialways", function(name, value){
        apikey = value;
        window.environment.BINGKEY = value;
    });
    parser.on("query", function(name, value){
        query = value;
    });
    parser.on('help', function() {
        stdout.writeln(parser.toString());
        communicate.finish(0);
        help = true;
    });

    parser.parse(args);

    if(help){
        return;
    }
    if(!apikey){
        stderr.writeln("bing: no apikey provided");
        communicate.finish(-1);
        return;
    }
    function bing(query){
        stdout.writeln("you queried"+query)//filler
    }
    if(query){
        bing(query);
        communicate.finish(0);
        return;
    }
    else{
        function read(line){
            bing(line);
            stdin.readln(read);
        }
        stdin.readln(read);
    }
}