window.process.grep = function(args, io){
    var search = args[1]
    if(!search){
        io.errln("no search string specified")
        throw new Fail(64, "No Search String");
    }
    function grep(line){
        if(line.match(search)){
            io.writeln(line);
        }
        io.readln(grep)
    }
    io.readln(grep)
}
