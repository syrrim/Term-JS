window.process.echo = function(args, stdin, stdout, stderr, communicate){
    message = args[1];
    stdout.writeln(message);
    communicate.finish()
}