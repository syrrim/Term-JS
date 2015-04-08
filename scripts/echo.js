window.process.echo = function(args, stdin, stdout, communicate){
    message = args[1];
    stdout.writeln(message);
}
