window.process.link = function(args, io){
    function read(line){
        io.writeln("<a href='" + line + "'>" + line + "</a>");
        io.readln(read);
    }
    io.readln(read)
}