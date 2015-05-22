
//Object for storing possible commands
window.process = {}
//stores environment variables
window.environment = {}
environment.PATH = "scripts/";
window.process.export = function(args, stdin, stdout, stderr, communicate){
    var sides = args[1].split("="),
        name = sides[0],
        value = sides[1];
    window.environment[name] = value;
    communicate.finish(0);
}
window.process.reload = function(args, io){
    for(var i = 1; i < args.length; i++){
        window.process[args[i]] = null;
        get_script(args[i]);
    }
    throw new Success();
}
window.man = {
    man: "Usage: man command\n\nDisplays information such as usage and output for 'command'.\nOnly available as provided by 'command'.",
    export: "Usage export VARIABLE=VALUE\n\nSets the environment variable named 'VARIABLE' to the string of 'VALUE'",
    reload: "Usage reload command\n\nDeletes command and reloads it from saved.",
};
window.process.man = function(args, io){
    var process = args[1];
    if(window.man[process]){
        io.writeln(window.man[process]);
        throw new Success();
    }else{
        get_script(process).then(
            function(){
                if(window.man[process]){
                    stdout.writeln(window.man[process]);
                    communicate.finish(0);
                }else{
                    stderr.writeln("'" + process + "' does not have a man page");
                    communicate.finish(-1);
                }
            },
            function(err){
                console.log(err, "what?")
                stderr.writeln("'" + process + "' does not exist");
                communicate.finish(-1);
            }
        );
    }
}
window.man.alias = [
    'Usage: alias "NAME=COMMAND"',
    "",
    "Sets the command NAME to run the command COMMAND,",
    "as well as whatever is passed at run time."
].join("\n")
var aliases = [];
window.process.alias = function(args, old_io){
    if(args[1]){
        var pieces = args[1].split("="),
            name = pieces[0],
            command = pieces[1];
        window.process[name] = function(args, io){
            var full_command = command;
            for(var i = 0; i < args.length; i++){
                full_command += ' "' + args + '"'
            }
            (new Pipeline(function(err){
                    io.kill(err);
                })).start(full_command, io.stdin.stream, io.stdout, io.stderr)
        };
        throw new Success();
    }else{
        old_io.writeln(aliases.join("\n"));
        throw new Success();
    }
}