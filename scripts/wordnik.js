/*var script = document.createElement("script");
script.src = "scripts/wordnik/swagger-client.js"
document.getElementsByTagName("head")[0].appendChild(script);*/

var baseUrl = "http://api.wordnik.com/v4/word.json/";
var apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5"; //demo key from developer.wordnik.com
var opt = [
    ["-e", "--examples", "Returns examples for a word"],
    ["-d", "--definitions", "Return definitions for a word"],
    ["-t", "--topExample", "Returns a top example for a word"],
    ["-r", "--relatedWords [relationship]", "Given a word as a string, returns relationships from the Word Graph"],
    ["-p", "--pronunciations", "Returns text pronunciations for a given word"],
    ["-H", "--hyphenation", "Returns syllable information for a word"],
    ["-f", "--frequency", "Returns word usage over time"],
    ["-P", "--phrases", "Fetches bi-gram phrases for a word"],
    //["-E", "--etymologies", "Fetches etymology data"],//Doesn't seem to be implemented yet
    ["-a", "--audio", "Fetches audio metadata for a word."],
    ["-h", "--help", "Displays this help message"],
    ["-c", "--canonical", "Will try to return the correct word root ('cats' -> 'cat'). Otherwise returns exactly what was requested."]
];
var parser = new window.optparse.OptionParser(opt);
parser.banner = "Usage: wordnik [WORD] [OPTIONS]";
window.process.wordnik = function(args, io){
    var message = "",
        type = "",
        help = false,
        relationshipTypes = "",
        canonical = false,
        n = null;
    for(var use in {"examples":n,"definitions":n, "topExample":n,
                    "pronunciations":n,"hyphenation":n,"frequency":n,
                    "phrases":n,"etymologies":n,"audio":n}){
        parser.on(use, function(name){
            type = name;
        });
    }
    parser.on("help", function(){
        io.writeln(parser.toString());
        throw new Success();
    });
    parser.on("canonical", function(){
        canonical = true;
    })
    parser.on("relatedWords", function(name, value){
        type = name;
        relationshipTypes = value;
    })
    parser.on(0, function(value){
        message = value;
    })
    try{
        parser.parse(args.slice(1))
    }catch(e){
        io.errln(e);
        throw new WrongUsage(e.message);
    }
    if(!help){
        if(message){
            fetch(type, message, function(value){
                console.log(value, type);
                resolve(value, type);
                io.kill(new Success())
            })
        }
        else{
            function wordnik(line){
                fetch(type, line, function(value){
                    console.log(value, type);
                    resolve(value, type);
                })
                io.readln(wordnik)
            }
            io.readln(wordnik)
        }
    }
    function fetch(type, message, callback) {
    	var url = baseUrl + message + "/" + type + "?useCanonical=" + canonical + "&api_key=" + apiKey;
    	if (relationshipTypes){
    	    url += "&relationshipTypes="+relationshipTypes;
    	}
        var jxhr = $.ajax ({
            url: url,
            dataType: "text",
            timeout: 30000,
            })
        .success (function (data, status) {
            var array = JSON.parse (data);
            callback(array)
            })
        .error (function (status) {
            io.errln(type + ": url == " + url + ",\nerror == " + JSON.stringify (status, undefined, 4));
            io.kill(new IOError())
            });
     }
     function resolve(obj, type){
         switch(type){
            case "frequency":
                freq = obj.frequency;
                for(var i = 0; i < freq.length; i++){
                    io.writeln(freq[i].year + ":" + freq[i].count);
                }
                break;
            case "relatedWords":
                for(var i = 0; i < obj.length; i++){
                    console.log(obj[i])
                    relation = obj[i].relationshipType;
                    for(var j = 0; j < obj[i].words.length; j++){
                        console.log(obj[i].words[j]);
                        io.writeln((relationshipTypes? "" : relation + ":") + obj[i].words[j]);
                    }
                }
                break;
            case "audio":
                for(var i = 0; i < obj.length; i++){
                    io.writeln(obj[i].fileUrl);
                }
                break;
            case "pronunciations":
                for(var i = 0; i < obj.length; i++){
                    io.writeln(obj[i].rawType + ":" + obj[i].raw)
                };
                break;
            case "examples":
                for(var i = 0; i < obj.examples.length; i++){
                    io.writeln(obj.examples[i].text)
                }
                break;
            case "phrases":
                for(var i = 0; i < obj.length; i++){
                    io.writeln(obj[i].gram1);
                }
                break;
            case "hyphenation":
            case "definitions":
                for(var i = 0; i < obj.length; i++){
                    io.writeln(obj[i].text)
                };
                break;
            default:
                for(var item in obj){
                    io.writeln(item+":"+JSON.stringify(obj[item], undefined, 4))
                }
                break;
         }
     }
}