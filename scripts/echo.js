window.process.echo = function(args, stdin, stdout, stderr, communicate){
    message = args.slice(1);
    stdout.writeln(message);
    communicate.finish(0)
}
