window.process.color = function colorize(args, stdin, stdout, stderr, communicate){
    function color(line){
        if(communicate.dead){
            communicate.finish(0);
            return;
        }
        stdout.writeln("<span style='color:"+args[1]+"'>"+line+"</span>");
        stdin.readln(color)
    }
    stdin.readln(color)
}