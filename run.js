function splitQuotes(string, seperator){
    try{
        return string.split(RegExp(seperator+"+(?=(?:(?:[^\"]*\"){2})*[^\"]*$)", "g"));
    }catch(e){
        return string.split(seperator);
    }
}
function formatArgs(args){
	final = [];
	for(var i = 0; i < args.length; i++){
		var arg = args[i]
		if(arg[0] === '"' && arg[arg.length-1] === '"'){
			var string = arg.slice(1, -1);
			var format = string.replace(/\$(\w+)/, function(whole, string){return window.environment[string]});
			final.push(format);
		}else if(arg[0] === "'" && arg[arg.length-1] === "'"){
			final.push(arg.slice(1, -1));
		}else{
			final.push(arg);
		}
	}
	return final;
}
function bundle(stdin, stdout, stderr){
    return {
        read: function(callback){
            stdin.read(callback);
        },
        readln: function(callback){
            stdin.readln(callback);
        },
        write: function(text){
            stdout.write(text);
        },
        writeln: function(line){
            stdout.writeln(line);
        },
        err: function(text){
            stderr.write(text);
        },
        errln: function(text){
            stderr.writeln(text);
        },
        kill: function(err){
            stdin.kill(err);
        },
    }
}
Pipeline = function(callback){
    this.callback = callback;
    this.streams = [];
}
Pipeline.prototype = {
    add: function(args, stdin, stdout, stderr){
        function end(err){
            self.end(err);
        }
        var self = this,
            stdin = stdin.reader(end);
        self.streams.push(stdin);
        get_script(args[0]).then(function(script){
                try{
                    script(args, bundle(stdin, stdout, stderr));
                }catch(e){
                    self.end(e);
                }
            }, function(err){
                stderr.writeln(args[0] + ": command not found");
                self.end(new NoCommand());
            }
        );
    },
    start: function(line, stdin, stdout, stderr){
        var processes = splitQuotes(line, "\\|");
        var args = [];
        for(var i = 0; i < processes.length; i++){
            var process = processes[i]
            process = process.replace(/^ | $/g, "")
            args.push(splitQuotes(process, " "));
        }
        var instream = stdin;
        for(var i = 0; i < args.length; i++){
            if(i < args.length - 1){
                outstream = new Stream();
            }else{
                outstream = stdout;
            }
            this.add(formatArgs(args[i]), instream, outstream, stderr);
            instream = outstream;
        }
    },
    end: function(err){
        console.log(err.message);
        for(var i = 0; i < this.streams.length; i++){
            this.streams[i].kill();
        }
        this.callback();
    }
};
