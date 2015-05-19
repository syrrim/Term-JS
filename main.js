/*
 * Javascript Terminal Emulator.
 * Use at your own risk.
 */


//Object for storing possible commands
window.process = process?process:{};
//stores environment variables
window.environment = environment?environment:{};
environment.PATH = "scripts/";
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
    throw new Complete();
}
window.man = {
    man: "Usage: man command\n\nDisplays information such as usage and output for 'command'.\nOnly available as provided by 'command'.",
    export: "Usage export VARIABLE=VALUE\n\nSets the environment variable named 'VARIABLE' to the string of 'VALUE'",
    reload: "Usage reload command\n\nDeletes command and reloads it from saved.",
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
    /*document.addEventListener("keydown", function(e){
        e = e || window.event;
        console.log(e)
        if(self.press(e) || self.userin.press(e)){
            e.preventDefault()
        }
    });*/
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
        if(e.ctrlKey || e.charCode == 99){console.log(e)}
        if(e.ctrlKey && (e.charCode === 99 || e.keyCode === 67)){
            self.kill_job();
            return true;
        }
        return false
    },
    kill_job: function(){
        this.pipeline.end(new Terminate());
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
        this.pipeline = new Pipeline(function(){self.get_job()});
        var instream = this.userin.reset_input(),
        	outstream = new Stream();
		this.outstream = outstream.reader();
        this.instream = instream.reader()
        this.displayin();
		this.pipeline.start(line, instream, outstream, this.err.stream);
        this.displayout()
    },
    /*new_process: function(args, instream, outstream){
        self = this;
        var communicate = new Communicate(function(){
            self.kill_job();
        })
        if(!window.process[args[0]]){
            path = window.environment.PATH.split(" "); //spaces are invalid in URIs
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

    },*/
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
                    text = userin.stream.lines[userin.stream.lines.length - userin.back - 1];
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
    ctrlKey: {
        65: function(u){u.ctrl[97](u)},
        69: function(u){u.ctrl[101](u)},
        85: function(u){u.ctrl[117](u)},
        86: function(u){u.ctrl[118](u)},
    },
    text: "",
    pointer: 0,
    finish: function(){
        var text = this.text
        this.text = "";
        this.pointer = 0;
        this.back = -1
        try{
            this.stream.writeln(text);
        }catch(e){
            console.log(e);
        }

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
        else if(!e.charCode){
            return false
        }
        else if(e.ctrlKey){
        	console.log(e.ctrlKey)
            if(e.charCode){
            	console.log(e.charCode)
                if(this.ctrl[e.charCode]){
                    this.ctrl[e.charCode](this);
                }
                else{
                    return false;
                }
            }else{
            	console.log(e.keyCode)
                if(this.ctrlKey[e.keyCode]){
                    this.ctrlKey[e.keyCode](this);
                }
                else{
                    return false;
                }

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
        document.getElementById("term").scrollTop = document.getElementById(this.id).offsetTop;
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
