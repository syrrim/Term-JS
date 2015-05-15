var parser = new optparse.OptionParser([
    ["-a", "--apionce KEY", "specify a bing search api key to use this time"],
    ["-A", "--apialways KEY", "specify the bing search api key to use this session"],
    ["-q", "--query MESSAGE", "specify the string with which to make your query"],
    ["-h", "--help", "display this help message"],
]);
parser.banner = 'Usage: bing [options]';
window.man.bing = parser.toString();
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
    try{
        parser.parse(args);
    }
    catch(e){
        stderr.writeln(e);
        communicate.finish(1);
        return;
    }
    if(help){
        return;
    }
    if(!apikey){
        stderr.writeln("bing: no apikey provided");
        communicate.finish(1);
        return;
    }
    function bing(query){
        /*rootUri = 'https://api.datamarket.azure.com/Bing/Search';
        operation = 'Web';
        $market = ($_GET['market']) ? $_GET['market'] : 'en-us';*/
        query = encodeURIComponent("'"+query+"'");
        apikey = ("'"+apikey+"'");
        /*market = urlencode("'en-us'");
        requestUri = rootUri + "/"+ operation + "?$+format=json&Query=" + query + "&Market=" + market;
        $.getJSON(requestUri, )*/
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
                stdout.writeln(data);
            },
            error: function(msg) {
                console.log(arguments);
                stderr.writeln(msg);
            }
            });
    }
    if(query){
        bing(query);
        communicate.finish(0);
        return;
    }
    else{
        function read(line){
            if(communicate.dead){
                communicate.finish(0);
                return;
            }
            bing(line);
            stdin.readln(read);
        }
        stdin.readln(read);
    }
}
