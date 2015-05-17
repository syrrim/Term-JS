window.process.color = function colorize(args, io){
    function color(line){
        io.writeln("<span style='color:"+args[1]+"'>"+line+"</span>");
        io.readln(color)
    }
    io.readln(color)
}