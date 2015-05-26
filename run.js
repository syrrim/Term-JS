//Promise that gives either a command, or an error if it can't find the command
get_script = function(name){
    return new Promise(function(resolve, reject){
        if(!window.process[name]){
            var path = window.environment.PATH.split(" "), // spaces are invalid in URIs
                i = 0; //begin convoluted async for loop
            function load(location){
                var script = document.createElement("script");
                script.src = location + name + ".js"
                script.onload = function(){
                    resolve(window.process[name])
                }
                script.onerror = function(){
                    i ++;
                    if(i<path.length){
                        load(path[i])
                    }
                    else{
                        reject(Error("File didn't exist anywhere along the PATH"))
                    }
                }
                document.getElementsByTagName("head")[0].appendChild(script);
            }
            if(i<path.length){
                load(path[i])
            }
            else{
                reject(Error("There's nothing in the PATH variable"))
            }
        }
        else{
            resolve(window.process[name])
        }
});
}

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
function bundle(stdin, stdout, stderr, end){
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
        kill: end,
        stdin: stdin,
        stdout: stdout,
        stderr: stderr,
    }
}
Pipeline = function(callback){
    this.callback = callback;
    this.streams = [];
}
Pipeline.prototype = {
    add: function(args, stdin, stdout, stderr){
        var id = this.streams.length;
        function end(err){
            self.end(err, id);
        }
        var self = this,
            stdin = stdin.reader(end);
        self.streams.push(stdin);
        get_script(args[0]).then(function(script){
                try{
                    script(args, bundle(stdin, stdout, stderr, end));
                }catch(e){
                    self.end(e);
                }
            }, function(err){
                stderr.writeln(args[0] + ": command not found");
                self.end(new NoCommand());
            }
        );
    },
    file: function(args, stdin, stdout, stderr){
        var files = [stdin, stdout, stderr],
            parts;
        for(var i = 0; i < args.length; i++){
            if(parts = args[i].match(/^(\d*)(>(>|)|<(<|))$/)){
                var file = parts[1]?parts[1]:(parts[2][0]==="<"?0:1),
                    stream;
                if(args[i+1][0] === "&"){
                    if(!files[args[i+1].slice(1)])throw new WrongUsage("not a valid descriptor: "+args[i+1].slice(1));
                    stream = files[args[i+1].slice(1)];
                }else{
                    stream = new FileStream(args[i+1]);
                }
                if(!(parts[3]||parts[4])){
                    stream.write("");
                }
                files[file] = stream;
                args.splice(i, 2);
                i--;
            }
        }
        this.add(args, files[0], files[1], files[2]);
    }
    start: function(line, stdin, stdout, stderr){
        var processes = splitQuotes(line, "\\|");
        var args = [];
        for(var i = 0; i < processes.length; i++){
            var process = processes[i]
            process = process.replace(/^ | $/g, "")
            args.push(splitQuotes(process, " "));
        }
        var outstream = stdout,
            instream;
        for(var i = args.length-1; i >= 0; i--){
            if(i > 0){
                instream = new Stream();
            }else{
                instream = stdin;
            }
            this.file(formatArgs(args[i]), instream, outstream, stderr);
            outstream = instream;
        }
        /*
        var instream = stdin;
        for(var i = 0; i < args.length; i++){
            if(i < args.length - 1){
                outstream = new Stream();
            }else{
                outstream = stdout;
            }
            this.add(formatArgs(args[i]), instream, outstream, stderr);
            instream = outstream;
        }*/
    },
    end: function(err, id){
        console.log(err.message);
        for(var i = 0; i < this.streams.length; i++){
            this.streams[i].kill();
        }
        this.callback();
    }
};
