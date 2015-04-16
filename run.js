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
        /*if(!window.process[args[0]]){
            var path = window.environment.PATH.split(":"),
                i = 0; //convoluted async for loop
            function load(location){
                var script = document.createElement("script");
                script.src = location + args[0] + ".js"
                script.onload = function(){
                    window.process[args[0]](args, stdin, stdout, stderr, communicate);
                }
                script.onerror = function(){
                    i ++;
                    if(i<path.length){
                        load(path[i])
                    }
                    else{
                        stderr.writeln(args[0] + ": command not found")
                        communicate.finish();
                    }
                }
                document.getElementsByTagName("head")[0].appendChild(script);
            }
            if(i<path.length){
                load(path[i])
            }
            else{
                stderr.writeln("You seem to have nothing on your path. Consider runnning: \n        export PATH=scripts/");
                stderr.writeln(args[0] + ": command not found");
                communicate.finish();
            }
       }
        else{
            window.process[args[0]](args, stdin, stdout, stderr, communicate);
        }*/
        self.comms.push(communicate)

    }
};