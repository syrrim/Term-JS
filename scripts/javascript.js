window.process.javascript = function(args, stdin, stdout, stderr, comm){
    function javascript(line){
        if(comm.dead){
            comm.finish(0);
            return;
        }
        try{
            stdout.writeln(eval(line))
        }catch(e){
            stderr.writeln(e);
        }
        stdin.readln(javascript);
    }
    stdin.readln(javascript);

}