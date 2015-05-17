window.process.echo = function(args, io){
    message = args[1]
    io.writeln(message);
    throw new Success();
}
