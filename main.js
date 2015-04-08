window.process = {};
window.environment = {
    PATH: "scripts/"
};
Communicate = function(finish){
    this.onfinish = [finish];
};
Communicate.prototype = {
    dead: false,
    finish: function(code){
        this.code = code;
        for(var i = 0; i < this.onfinish.length; i++){
            this.onfinish[i](code, this);
        }
    }
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
            this.stream.listener.push(callback);
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
}
function Controller(id){
    this.userin = new UserIn("current");
    self = this;
    term = document.getElementById(id);
    term.focus()
    document.addEventListener("keypress", function(e){
        e = e || window.event;
        if(self.press(e) || self.userin.press(e)){
            e.preventDefault()
        }
    });
    this.get_job()
};
Controller.prototype = {
    press: function(e){
        if(e.ctrlKey && e.charCode == 99){
            self.kill_job();
            return true;
        }
        return false
    },
    kill_job: function(){
        for(var i = 0; i < this.job; i ++){
            this.job[i].death = true;
        }
        this.get_job();
    },
    get_job: function(){
        this.print("~>")
        var self = this
        this.userin.reset_input().reader().readln(function(line){
            self.print(line);
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
        var instream = this.userin.reset_input(),
            outstream = new Stream();
        this.instream = instream.reader()
        this.displayin();
        for(var i = 0; i < args.length; i++){
            this.new_process(args[i], instream.reader(), outstream);
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
                    window.process[args[0]](args, instream, outstream, communicate);
                }
                script.onerror = function(){
                    i ++;
                    if(i<path.lenght){
                        load(path[i])
                    }
                    else{
                        self.print("No p ")
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
            self.print(text)
            self.instream.readln(print)
        }
        this.instream.readln(print)
    },
    displayout: function(){
        var self = this
        function print(text){
            self.print(text)
            self.outstream.readln(print)
        }
        this.outstream.readln(print)
    },
       
    display: function(){
        var self = this
        function print(text){
            self.print(text)
            self.outstream.readln(print)
            self.instream.readln(print)
        }
        this.outstream.readln(print)
        this.instream.readln(print)

    },
    print: function(text){
        document.getElementById("finished").innerHTML += breakify(text)
    },
}

function UserIn(id){
    this.stream = new Stream()
    this.id = id
    var self = this;
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
    },
    text: "",
    pointer: 0,
    finish: function(){
        this.stream.writeln(this.text);
        this.text = "";
        this.pointer = 0;
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
        this.html = breakify(this.text.slice(0, this.pointer));
        if(this.text[this.pointer] === "\n"){
            console.log("line off")
            this.html += "<span id='pointer' style='color:green;background-color:green'>|</span><br/>"
        }
        else if(this.text[this.pointer]){
            this.html += "<span id='pointer' style='color:black;background-color:green'>"+this.text[this.pointer]+"</span>"
        }
        else{
            this.html += "<span id='pointer' style='color:green;background-color:green'>|</span>"
        }
        this.html += breakify (this.text.slice(this.pointer+1));
        document.getElementById(this.id).innerHTML = this.html
        return true
    }
}
function breakify(text){
    return text.replace("\n", "<br/>")
}
setInterval(function(){
    pointer = document.getElementById("pointer");
    pointer.style.backgroundColor = pointer.style.backgroundColor === "black"? "green": "black"
    pointer.style.color = pointer.style.color === "black"? "green": "black"

}, 700);
new Controller("term")
