op = optparser3
var parser = new op.Parser(
    "mashape FIELD API OPTIONS",
    {
        FIELD: ["The name of the field to be filled in by stdin", op.filters.position("field")],
        API: ["The name of the API", op.filters.position("api")],
        OPTIONS: op.filters.options([
            op.options.string("key", "k", "Mashape API key"),
            op.options.string("data", "d", "query string encoded other data"),
        ]),
    },
    {
        data: "",
    }
)
man.mashape = parser.doc;
process.mashape = function(args, io){
    try{
        opts = parser.parse(args);
    }catch(e){
        io.errln(e.message);
        throw new WrongUsage(e.message);
    }
    if(opts.key){
        environment.MASHAPEKEY = opts.key,
    }
    if(!environment.MASHAPEKEY){
        throw new WrongUsage("No API key provided");
    }
    if(opts.help){
        io.writeln(parser.doc);
        throw new Success();
    }
    function mashape(query, callback){
        $.ajax({
            url: 'https://'+opts.api+'.p.mashape.com/'+opts.data, // The URL to the API. You can get this in the API page of the API you intend to consume
            type: 'GET', // The HTTP Method, can be GET POST PUT DELETE etc
            data: {
                opts.field: query
            }, // Additional parameters here
            datatype: 'json',
            success: function(data) {
                io.writeln(JSON.stringify(data));
                callback()
            },
            error: function(err) {
                io.errln(err);
                console.log(arguments);
                io.kill(new Failure(err));
            },
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Mashape-Authorization", environment.MASHAPEKEY);
            }
        });
    }
    function read(line){
        mashape(line, function(){
            io.readln(read);
        });
    }
    io.readln(read);
}
