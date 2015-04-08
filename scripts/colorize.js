window.process.colorize = function colorize(args, stdin, stdout, communicate){
    function colorize(line){
        if(communicate.dead){
            communicate.finish(0);
            return;
        }
        stdout.writeln("<span style='color:"+args[1]+"'>"+line+"</span>");
        stdin.readln(colorize)
    }
    stdin.readln(colorize)
}