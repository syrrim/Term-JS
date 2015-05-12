function splitQuotes(string, seperator){
    return string.split(RegExp(seperator+"+(?=(?:(?:[^\"]*\"){2})*[^\"]*$)", "g"))
}
function Or(string, callback){
    this.callback =
    sections
}

Pipeline = function(callback){
    this.callback = callback;
    this.comms = [];

}
Pipeline.prototype = {
    start: function(pipeline){


    },
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
        get_script(args[0]).then(function(script){
                script(args, stdin, stdout, stderr, communicate)
            }, function(err){
                stderr.writeln(args[0] + ": command not found")
                communicate.finish(-1)
            });
        self.comms.push(communicate)

    },
    start: function(line, stdin, stdout, stderr){
        var processes = splitQuotes(line, "|");
        var args = [];
        for(var i = 0; i < processes.length; i++){
            var process = processes[i]
            process = process.replace(/^ | $/g, "")
            args.push(splitQuotes(process, " "));
        }
        var instream = stdin,
        	outstream = new Stream();
        for(var i = 0; i < args.length; i++){
            this.add(args[i], instream.reader(), outstream, stdin);
            instream = outstream;
            if(i < args.length - 2){
                outstream = new Stream();
            }else{
                outstream = stdout;
            }
        }
    }
    }
};
