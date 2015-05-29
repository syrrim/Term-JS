/*
 * Javascript Terminal Emulator.
 * Use at your own risk.
 */


function Controller(backColor, mainColor, errColor, id){
    this.backColor = backColor;
    this.mainColor = mainColor;
    this.errColor = errColor;
    this.id = id;
    term = document.getElementById(id);
    term.focus();
    term.style = "color:"+mainColor+"; background-color:"+backColor+";";
    term.innerHTML = '<span id="finished"></span><span id="current"><span id="pointer" style="color:'+
                            mainColor+';background-color:'+mainColor+'">|</span></span>';
    this.userin = new UserIn(backColor, mainColor, "current");
    this.prompt = new Stream().reader();
    this.err = new Stream().reader();
    self = this;
    document.addEventListener("keypress", function(e){
        e = e || window.event;
        console.log(e)
        if(self.press(e) || self.userin.press(e) || true){
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    this.errorReport();
    this.get_job();
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
        if(e.ctrlKey && (e.charCode === 99 || e.keyCode === 67)){
            self.kill_job();
            return true;
        }
        return false;
    },
    kill_job: function(){
        this.pipeline.end(new Terminate());
    },
    get_job: function(){
        this.print(window.environment.CWD + "$");
        var self = this;
        this.userin.stream = this.prompt.stream;
        this.prompt.readln(function(line){
            self.println(line);
            self.start_job(line);
        });
    },
    start_job: function(line){
        this.pipeline = new Pipeline(function(){self.get_job()});
        var instream = this.userin.reset_input(),
        	outstream = new Stream();
		this.outstream = outstream.reader();
        this.instream = instream.reader();
        this.displayin();
		this.pipeline.start(line, instream, outstream, this.err.stream);
        this.displayout();
    },
    displayin: function(){
        var self = this;
        function print(text){
            self.print(text);
            self.instream.read(print);
        }
        this.instream.read(print);
    },
    displayout: function(){
        var self = this;
        function print(text){
            self.println(text);
            self.outstream.readln(print);
        }
        this.outstream.readln(print);
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
    this.stream = new Stream();
    this.id = id;
    this.back = 0;
}
UserIn.prototype = {
    reset_input: function(){
        this.stream = new Stream();
        return this.stream;
    },
    special: {
        13: function(userin){
            userin.finish();
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
                    userin.store = userin.text;
                }
                userin.back ++;
                userin.text = userin.stream.lines.readLnAt(userin.stream.lines.length - userin.back - 1);
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
                    text = userin.stream.lines.readLnAt(userin.stream.lines.length - userin.back - 1);
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
        var text = this.text;
        this.text = "";
        this.pointer = 0;
        this.back = -1;
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
            return false;
        }
        else if(e.ctrlKey){
            if(e.charCode){
                if(this.ctrl[e.charCode]){
                    this.ctrl[e.charCode](this);
                }
                else{
                    return false;
                }
            }else{
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
    if(!document.hasFocus())return false;
    pointer = document.getElementById("pointer");
    pointer.style.backgroundColor = pointer.style.backgroundColor === BACK? FORE: BACK
    pointer.style.color = pointer.style.color === BACK? FORE: BACK

}, 700);
window.controller = new Controller(BACK, FORE, "red", "term")
