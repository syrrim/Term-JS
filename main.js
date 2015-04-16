/*
 * Javascript Terminal Emulator by the venerable Gerhuyy.
 * Use at your own risk.
 */


//Object for storing possible commands
window.process = {
};
//stores environment variables
window.environment = {
    PATH: "scripts/"
};
//Promise that gives either a command, or an error if it can't find the command
get_script = function(name){
    return new Promise(function(resolve, reject){
        if(!window.process[name]){
            var path = window.environment.PATH.split(":"),
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
File = function(name){
    this.name = name
}
File.prototype = {
    write: function(text){
        localStorage.setItem(this.name, text);
    },
    read: function(){
        return localStorage.getItem(this.name);
    },
    append: function(text){
        this.write(this.read() + text);
    }
};
window.process.export = function(args, stdin, stdout, stderr, communicate){
    var sides = args[1].split("="),
        name = sides[0],
        value = sides[1];
    window.environment[name] = value;
    communicate.finish(0);
}
window.process.reload = function(args, stdin, stdout, stderr, comm){
    for(var i = 1; i < args.length; i++){
        window.process[args[i]] = null;
        get_script(args[i]);
    }
    comm.finish(0);
}
window.man = {
    man: "Usage: man command\n\nDisplays information such as usage and output for 'command'.\nOnly available as provided by 'command'.",
    export: "Usage export VARIABLE=VALUE\n\nSets the environment variable named 'VARIABLE' to the string of 'VALUE'",
};
window.process.man = function(args, stdin, stdout, stderr, communicate){
    var process = args[1];
    if(window.man[process]){
        stdout.writeln(window.man[process]);
        communicate.finish(0);
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
function Communicate(finish){
    this.finish = finish;
};
Communicate.prototype = {
    dead: false,
};
function In(stream){
    this.stream = stream;
    this.index = 0;
    this.depth = 0;
}
In.prototype = {
    readln: function(callback){
        if(this.index < this.stream.lines.length){
            this.index ++;
            callback(this.stream.lines[this.index-1]);
        }
        else{
            this.index ++;
            this.stream.line_listener.push(callback);
        }
    },
    read: function(callback){
        if(this.index < this.stream.lines.length || this.depth < this.stream.line.length ){
            prevind = this.index;
            prevdepth = this.depth;
            this.index = this.stream.lines.length;
            this.depth = this.stream.line.length;
            callback(this.stream.lines.slice(prevind).join("\n") + "\n" + this.stream.line.slice(prevdepth))
        }
        else{
            this.index = this.stream.lines.length;
            this.depth = this.stream.line.length;
            this.stream.listener.push(callback);
        }
    },
};
function Stream(){
    this.lines = [];
    this.line = "";
    this.line_listener = [];
    this.listener = [];

};
Stream.prototype = {
    write: function(text){
        var lines = text.split("\n")
        for(var i = 0; i < lines.length-1; i++){
            this.line += lines[i]
            this.endln()
        }
        this.line += lines[lines.length-1]
        var callbacks = this.listener;
        this.listener = [];
        for(var i = 0; i < callbacks.length; i++){
            callbacks[i](text)
        }
    },
    writeln: function(text){
        this.write(text+"\n")
    },
    endln: function(){
        var line_listener = this.line_listener;
        this.line_listener = [];
        for(var i = 0; i < line_listener.length; i++){
            line_listener[i](this.line);
        }
        this.lines.push(this.line)
        this.line = ""
    },
    reader: function(){
        return new In(this);
    },
};



function Controller(backColor, mainColor, errColor, id){
    this.backColor = backColor;
    this.mainColor = mainColor;
    this.errColor = errColor;
    this.id = id;
    term = document.getElementById(id);
    term.focus()
    term.style = "font-family:courier; color:"+mainColor+"; background-color:"+backColor+";display:inline-block;overflow:scroll;"
    term.innerHTML = '<pre id="text"><span id="finished"></span><span id="current"><span id="pointer" style="color:'+
                            mainColor+';background-color:'+mainColor+'">|</span></span></pre>'
    this.userin = new UserIn(backColor, mainColor, "current");
    this.prompt = new Stream().reader();
    this.err = new Stream().reader()
    self = this;
    document.addEventListener("keypress", function(e){
        e = e || window.event;
        if(self.press(e) || self.userin.press(e)){
            e.preventDefault()
        }
    });
    /*$(document).on('paste','[contenteditable]',function(e) {
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..');
        window.document.execCommand('insertText', false, text);
        console.log(text);
    });*/
    this.errorReport()
    this.get_job()
};
Controller.prototype = {
    errorReport: function(){
        function err(line){
            self.println("<span style='color:"+self.errColor+"'>"+line+"</span>");
            self.err.readln(err);
        }
        this.err.readln(err);
    },
    press: function(e){
        if(e.ctrlKey && e.charCode == 99){
            self.kill_job();
            return true;
        }
        return false
    },
    kill_job: function(){
        this.pipeline.kill();
    },
    get_job: function(){
        this.print("$")
        var self = this
        this.userin.stream = this.prompt.stream
        this.prompt.readln(function(line){
            self.println(line);
            self.start_job(line)
        })
    },
    start_job: function(line){
        var processes = line.split("|");
        var args = [];
        for(var i = 0; i < processes.length; i++){
            var process = processes[i]
            process = process.replace(/[\n 	]+/g, " ")
            process = process.replace(/^ | $/g, "")
            args.push(process.split(" "));
        }
        var self = this;
        this.pipeline = new Pipeline(function(){self.get_job()});
        var instream = this.userin.reset_input(),
            outstream = new Stream();
        this.instream = instream.reader()
        this.displayin();
        for(var i = 0; i < args.length; i++){
            //this.new_process(args[i], instream.reader(), outstream);
            this.pipeline.add(args[i], instream.reader(), outstream, this.err.stream);
            if(i < args.length - 1){
                instream = outstream;
                outstream = new Stream();
            }
        }
        this.outstream = outstream.reader();
        this.displayout()
    },
    new_process: function(args, instream, outstream){
        self = this;
        var communicate = new Communicate(function(){
            self.kill_job();
        })
        if(!window.process[args[0]]){
            path = window.environment.PATH.split(":");
            var i = 0;
            function load(location){
                script = document.createElement("script");
                script.src = location + args[0] + ".js"
                script.onload = function(){
                    window.process[args[0]](args, instream, outstream, self.err.stream, communicate);
                }
                script.onerror = function(){
                    i ++;
                    if(i<path.lenght){
                        load(path[i])
                    }
                    else{
                        self.println(args[0] + ": command not found")
                        communicate.finish();
                    }
                }
                document.getElementsByTagName("head")[0].appendChild(script);
            }
            if(i<path.length){
                load(path[i])
            }
       }
        else{
            window.process[args[0]](args, instream, outstream, communicate);
        }

    },
    displayin: function(){
        var self = this
        function print(text){
            self.println(text)
            self.instream.readln(print)
        }
        this.instream.readln(print)
    },
    displayout: function(){
        var self = this
        function print(text){
            self.println(text)
            self.outstream.readln(print)
        }
        this.outstream.readln(print)
    },
    print: function(text){
        document.getElementById("finished").innerHTML += text.replace("\n", "</br>");
    },
    println: function(line){
        this.print(line + "\n");
    }
};

function UserIn(back, fore, id){
    this.background = back;
    this.foreground = fore;
    this.stream = new Stream()
    this.id = id;
    this.back = 0;
}
UserIn.prototype = {
    reset_input: function(){
        this.stream = new Stream()
        return this.stream;
    },
    special: {
        13: function(userin){
            userin.finish()
        },
        8: function(userin){
            userin.text = userin.text.slice(0, userin.pointer-1) +
                         userin.text.slice(userin.pointer, userin.text.length);
            if(userin.pointer > 0)userin.pointer --;
        },
        39: function(userin){
            if(userin.pointer < userin.text.length){
                userin.pointer ++;
            }
        },
        37: function(userin){
            if(userin.pointer > 0){
                userin.pointer --;
            }
        },
        38: function(userin){
            if(userin.back < userin.stream.lines.length-1){
                if(userin.back === -1){
                    userin.store = userin.text
                }
                userin.back ++;
                userin.text = userin.stream.lines[userin.stream.lines.length - userin.back - 1]
                userin.pointer = userin.text.length;
            }
        },
        40: function(userin){
            if(userin.back > -1){
                userin.back --;
                if(userin.back === -1){
                    userin.text = userin.store;
                }
                else{
                    text = userin.stream.lines[userin.stream.lines.length];
                    if(text)userin.text = text;
                }
                userin.pointer = userin.text.length;
            }
        },
    },
    ctrl: {
        97: function(userin){
            userin.pointer = 0;
        },
        101: function(userin){
            userin.pointer = userin.text.length;
        },
        117: function(userin){
            userin.text = userin.text.slice(userin.pointer);
            userin.pointer = 0;
        },
        118: function(userin){
            paste = prompt("Paste Here");
            userin.pointer = userin.pointer + paste.length;
            userin.text = userin.text.slice(0, userin.pointer) + paste + userin.text.slice(userin.pointer);
        }
        },
    text: "",
    pointer: 0,
    finish: function(){
        var text = this.text
        this.text = "";
        this.pointer = 0;
        this.back = -1
        this.stream.writeln(text);

    },
    add: function(char){
        this.text = this.text.slice(0, this.pointer) +
                        char + this.text.slice(this.pointer, this.text.length);
        this.pointer++;
    },
    press: function(e){
        if(this.special[e.keyCode]){
            this.special[e.keyCode](this);
        }
        else if(e.ctrlKey){
            if(this.ctrl[e.charCode]){
                this.ctrl[e.charCode](this);
            }
            else{
                return false;
            }
        }
        else if(e.metaKey){
            return false;
        }
        else{
            this.add(String.fromCharCode(e.charCode));
        }
        this.html = textify(this.text.slice(0, this.pointer));
        if(this.text[this.pointer] === "\n"){
            this.html += "<span id='pointer' style='color:"+this.foreground+";background-color:"+this.foreground+"'>|</span><br/>"
        }
        else if(this.text[this.pointer]){
            this.html += "<span id='pointer' style='color:"+this.background+";background-color:"+this.foreground+"'>"+textify(this.text[this.pointer])+"</span>"
        }
        else{
            this.html += "<span id='pointer' style='color:"+this.foreground+";background-color:"+this.foreground+"'>|</span>"
        }
        this.html += textify (this.text.slice(this.pointer+1));
        document.getElementById(this.id).innerHTML = this.html
        return true
    }
}
function textify(text){
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n","</br>");
}
var FORE = "black",
    BACK = "white";
setInterval(function(){
    pointer = document.getElementById("pointer");
    pointer.style.backgroundColor = pointer.style.backgroundColor === BACK? FORE: BACK
    pointer.style.color = pointer.style.color === BACK? FORE: BACK

}, 700);
new Controller(BACK, FORE, "red", "term")