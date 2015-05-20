var parser = new optparse.OptionParser([
    ["-a", "--apionce KEY", "specify a bing search api key to use this time"],
    ["-A", "--apialways KEY", "specify the bing search api key to use this session"],
    ["-q", "--query MESSAGE", "specify the string with which to make your query"],
    ["-h", "--help", "display this help message"],
]);
parser.banner = 'Usage: bing [options]';
window.man.bing = parser.toString();
window.process.bing = function bing(args, io){
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
        help = true;
    });
    try{
        parser.parse(args);
    }
    catch(e){
        io.errln(e);
        throw new WrongUsage(e.message)
    }
    if(help){
        io.writeln(parser.toString());
        throw new Success();
    }
    if(!apikey){
        io.errln("bing: no apikey provided");
        throw new WrongUsage("No api key");
    }
    function bing(query){
        /*rootUri = 'https://api.datamarket.azure.com/Bing/Search';
        operation = 'Web';
        $market = ($_GET['market']) ? $_GET['market'] : 'en-us';*/
        query = encodeURIComponent("'"+query+"'");
        apikey = encodeURIComponent(apikey)
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
                io.writeln(data);
                if(!query)io.readln(bing);
            },
            error: function(msg) {
                console.log(arguments);
                io.errln(msg);
                io.kill(new Failure())
            }
            });
    }
    if(query){
        bing(query);
        throw new Success();
    }
    else{
        io.readln(bing);
    }
}
