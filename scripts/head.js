window.process.head = function(args, stdin, stdout, stderr, comm){
    var amount = args[1] !== "" ? args[1] : 10,
        i = 0;
    function run(){
        if(i<amount && !comm.dead){
            stdin.readln(function(line){
                stdout.writeln(line);
                run()})
            i++;
        }
        else{
            comm.finish(0);
        }
    }
    run();
}