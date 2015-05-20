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

Pipeline = function(callback){
    this.callback = callback;
    this.comms = [];
}
Pipeline.prototype = {
    kill: function(){
        for(var i = 0; i < this.comms.length; i ++){
            this.comms[i].dead = true;
        }
        setTimeout(this.callback, 1);
    },
    death: function(id){
        var dead = true;
        for(var i = 0; i < this.comms.length; i ++){
            if(i <= id){
                this.comms[i].dead = true;
            }
            dead = this.comms[i].dead && dead;
        }
        if(dead){
            setTimeout(this.callback, 1);
        }

    },
    add: function(args, stdin, stdout, stderr){
        var self = this,
            id = this.comms.length;
        var communicate = new Communicate(function(){
            self.death(id);
        })
		console.log(args);
        get_script(args[0]).then(function(script){
                script(args, stdin, stdout, stderr, communicate)
            }, function(err){
                stderr.writeln(args[0] + ": command not found")
                communicate.finish(-1)
            });
        self.comms.push(communicate)

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
            this.add(formatArgs(args[i]), instream.reader(), outstream, stdin);
            instream = outstream;
}
    },
};
