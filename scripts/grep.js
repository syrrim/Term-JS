window.process.grep = function(args, stdin, stdout, communicate){
    var search = args[1]
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