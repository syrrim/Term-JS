var baseUrl = "http://api.wordnik.com/v4/word.json/";
var apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5"; //demo key from developer.wordnik.com
var op = optparse3;
var relations = ["synonym"]
var parser = new op.Parser(
    "wordnik [QUERY] OPTIONS",
    {
        QUERY: ["The word or phrase to query. If missing, takes from stdin.", op.filters.position("query", op.coercers.nonOption)],
        OPTIONS: op.filters.options([
            op.options.enum("type", "examples", "examples", "e", "Returns examples for a word"),
            op.options.enum("type", "definitions", "definitions", "d", "Return definitions for a word"),
            op.options.enum("type", "topExample", "topExample", "t", "Returns a top example for a word"),
            op.options.enum("type", "relatedWords", "relatedWords", "r", "Given a word as a string, returns relationships from the Word Graph"),
            op.options.enum("type", "pronunciations", "pronunciations", "p", "Returns text pronunciations for a given word"),
            op.options.enum("type", "hyphenation", "hyphenation", "H", "Returns syllable information for a word"),
            op.options.enum("type", "frequency", "frequency", "f", "Returns word usage over time"),
            op.options.enum("type", "phrases", "phrases", "P", "Fetches bi-gram phrases for a word"),
            op.options.enum("type", "audio", "audio", "a", "Fetches audio metadata for a word."),
            op.options.data(op.coercers.choice.apply(window, relations), "relation", "R", "The type of relation to use for relatedWords. one of "+relations),
            op.options.set( "help", "h", "Displays this help message"),
            op.options.set( "canonical", "c", "Will try to return the correct word root ('cats' -> 'cat'). Otherwise returns exactly what was requested."),
            ]),
    },
    {
        type: "definitions",
        query: null,
        help: false,
        canonical: false,
        relation: "synonym",
    });
window.process.wordnik = function(args, io){
    try{
        opts = parser.parse(args)
    }catch(e){
        io.errln(e.message);
        throw new WrongUsage(e.message);
    }
    if(!opts.help){
        if(opts.query){
            fetch(opts.type, opts.query, function(value){
                console.log(value, opts.type);
                resolve(value, opts.type);
                io.kill(new Success())
            })
        }
        else{
            function wordnik(line){
                fetch(opts.type, line, function(value){
                    console.log(value, opts.type);
                    resolve(value, opts.type);
                })
                io.readln(wordnik)
            }
            io.readln(wordnik)
        }
    }
    function fetch(type, message, callback) {
    	var url = baseUrl + message + "/" + type + "?useCanonical=" + opts.canonical + "&api_key=" + apiKey;
    	if (opts.relation){
    	    url += "&relationshipTypes="+opts.relation;
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
