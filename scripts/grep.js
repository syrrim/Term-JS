window.process.grep = function(args, stdin, stdout, stderr, communicate){
    var search = args[1]
    if(!search){
        stderr.writeln("no search string specified")
        communicate.finish(-1);
        return;
    }
    function grep(line){
        if(communicate.dead){
            communicate.finish(0);
            return;
        }
        if(line.match(search)){
            stdout.writeln(line);
        }
        stdin.readln(grep)
    }
    stdin.readln(grep)
}