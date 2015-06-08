var File = function(name){
    this.name = name
}
File.prototype = {
    write: function(text){
        localStorage.setItem(this.name, text);
    },
    append: function(text){
        var old = this.read();
        this.write((old?old:"") + text);
    },
    read: function(){
        return localStorage.getItem(this.name);
    },
    readLnAt: function(indice){
        return this.read().split("\n")[indice];
    },
    readLnFrom: function(indice){
        return this.read().split("\n").slice(indice);
    },
    get length(){
        return (this.read().match(/\n/g) || []).length
    },
};
window.dirs = {
    valid: function(path){
        return path[0] === "/" && new File(path).read() !== null
    },
    validDir: function(path){
        return this.valid(path) && path[path.length-1] === "/"
    },
    validFile: function(path){
        return this.valid(path) && path[path.length-1] !== "/"
    },
    parent: function(path){
        if(path[path.length-1] === "/")
            return path.split("/").slice(0, -2).join("/");
        return path.split("/").slice(0, -1).join("/");
    },
    _get: function(name){
        var fullname = this.navigate(environment.CWD, name, true);
        var file = new File(fullname);
        return file
    },
    getFile: function(filename){
        if(filename.slice(-1)!=="/"){
            return this._get(filename);
        }
        throw new Error("invalid file:"+filename)
    },
    getDir: function(filename){
        if(filename.slice(-1)==="/"){
            return this._get(filename);
        }
        throw new Error("invalid dir:"+filename)
    },
    delFile: function(name){
        if(this.validFile(name)){
            getFile(name).write(null);
        }
    },
    del: function(name){
        if(name.slice(-1) !== "/"){
            this.delFile(name);
        }else{
            var files = getDir(filename).read.split("\n");
            for(var i = 0; i < files.length; i++){
                this.del(name + files[i]);
            }
        }
    },
    navigate: function(orig, path, absent){
        var final;
        if(path[0] === "/")
            final = path;
        else if(path[0] !== ".")
            final = orig + path;
        else if(path === ".")
            final = orig;
        else if(path.slice(0, 2) === "./")
            final = orig + path.slice(2);
        else if(path === "..")
            final = this.parent(orig);
        else if(path.slice(0, 3) === "../")
            final = this.navigate(this.parent(orig) + "/", path.slice(3))
        else
            final = orig;
        if(absent || this.valid(final)){
            return final;
        }
        throw Error("invalid path '" + final);
    },
    toDir: function(name){
        return name? (name[name.length-1] === "/"? name : (name + "/")) :"";
    },
    qualify: function(input){
        return this.navigate(environment.CWD, this.toDir(input));
    }
}
new File("/").append("");
environment.CWD = "/" // no user folders or other files, no need for home directory.
op = optparse;
op.coercers.file = function(text){
    return dirs.getFile(text);
};
op.coercers.dir = function(text){
    return dirs.getDir(text);
}
op.coercers.location = function(text){
    return dirs.navigate(environment.CWD, text);
}
op.coercers.path = function(text){
    return dirs.navigate(environment.CWD, text, true);
}
process.cd = function(args, io){
    var path = "/";
    if(args[1]){
        try{
            path = dirs.qualify(args[1]);
        }catch(e){
            io.errln(e.message);
            throw new Failure(e.message);
        }
    }
    environment.CWD = path;
    throw new Success();
}
process.mkdir = function(args, io){
    if(!args[1]){
        io.errln("No directory specified")
        throw new WrongUsage("No Directory Specified");
    }
    try{dirs.getDir(dirs.toDir(args[1]));}
    catch(e){throw new Failure(e.message);}
    throw new Success();
}
process.ls = function(args, io){
    try{
        var dir = args[1]?dirs.qualify(args[1]):environment.CWD
        if(!dirs.validDir(dir))throw new Failure("invalid directory '"+dir+"'")
        io.write(dirs.getDir(dir).read());
    }catch(e){
        io.errln(e.message);
        throw new Failure(e.message);
    }
    throw new Success();
}
process.rm = function(args, io){
    if(args+"" === ""+["rm", "/", "-rf", "--no-preserve-root"]){
        localStorage.clear();
        new File("/").append("");
        throw new Success();
    }else{
        io.errln("Invalid command");
        throw new WrongUsage("Invalid command '"+args+"'");
    }
}
process.cat = function(args, io){
    if(args.length === 1){
        var await = true; 
    }else{
        var await = false;
        var files = args.slice(1).reduce(function(array, string){
            if(string === "-"){
                await = true
            }
            if(await){
                return array.concat(new FileStream(string))
            }
            io.writeln(dirs.getFile(string).read());
            return array
        }, []);
    }
    if(await){
        function read(line){
            try{
                io.writeln(line);
                io.readln(read);
            }catch(e){
                files.map(function(e){e.read(io.writeln)})
            }
        }
        io.readln(read);
    }else{
        throw new Success();
    }
}
PseudoFile = function(){
    this.arr = [];
}
PseudoFile.prototype = {
    write: function(text){
        this.arr = text.split("\n");
    },
    append: function(line){
        this.arr.push(line);
    },
    read: function(){
        return this.arr.join("\n");
    },
    readLnAt: function(indice){
        return this.arr[indice];
    },
    readLnFrom: function(indice){
        return this.arr.slice(indice)
    },
    get length(){
        return this.arr.length;
    },
};

function In(stream, end){
    this.stream = stream;
    this.index = 0;
    this.depth = 0;
    this.end = end
    this.killer = null;
}
In.prototype = {
    wrap: function(callback){
        var self = this;
        return function(line){
            self.index = self.stream.lines.length;
            self.depth = self.stream.line.length;
            if(self.end){
                try{
                    callback(line);
                }catch(e){
                    self.end(e);
                }
            }else{
                callback(line)
            }
        }
    },
    readln: function(callback){
        if(this.killer){
            throw this.killer
        }
        if(this.index < this.stream.lines.length){
            this.index ++;
            this.wrap(callback)(this.stream.lines.readLnAt(this.index-1));
        }
        else{
            this.index ++;
            this.stream.line_listener.push(this.wrap(callback));
        }
    },
    read: function(callback){
        if(this.killer){
            throw this.killer
        }
        if(this.index < this.stream.lines.length || this.depth < this.stream.line.length ){
            prevind = this.index;
            prevdepth = this.depth;
            this.index = this.stream.lines.length;
            this.depth = this.stream.line.length;
            this.wrap(callback)(this.stream.lines.readLnFrom(prevind).join("\n") + "\n" + this.stream.line.slice(prevdepth));
        }
        else{
            this.index = this.stream.lines.length;
            this.depth = this.stream.line.length;
            this.stream.listener.push(this.wrap(callback));
        }
    },
    kill: function(error){
        this.killer = error;
    },
};
function Stream(){
    this.lines = new PseudoFile();
    this.line = "";
    this.line_listener = [];
    this.listener = [];
    this.triggers = {};
    var self = this
    this.triggers["\b"] = function(){
        console.log(self.line, self.line.slice(0, -1));
        self.line = self.line.slice(0, -1);
        return 1;
    }
    this.triggers["\n"] = function(){
        console.log("line!")
        self.endln()
        return 1;
    }
    this.triggers["\r"] = function(){
        console.log("line!")
        self.endln();
        return 1;
    }
};
Stream.prototype = {
    write: function(text){
        console.log(text)
        var newtext = [],
            distance = 0,
            capture = 0;
        if(Object.keys(this.triggers).length){
            for(var i = 0; i < text.length;){
                if(this.triggers[text[i]] &&  (distance = this.triggers[text[i]](text.slice(i)))  ){
                    i += distance;
                }else{
                    this.line += text[i];
                    i++;
                    capture ++;
                }
            }
        }
        if(this.listener.length){
            var callbacks = this.listener,
                visible = (this.line.length > capture ? 
                            this.lines.read().slice(capture - this.line.length) :
                            "") + 
                        this.line.slice(-capture);
            if(visible){
                this.listener = [];
                for(var i = 0; i < callbacks.length; i++){
                    callbacks[i](visible)
                }
            }
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
        this.lines.append(this.line)
        this.line = "";
    },
    reader: function(end){
        return new In(this, end);
    },
};
function FileStream(filename){
    Stream.call(this);
    this.lines = dirs.getFile(filename)
}
FileStream.prototype = Object.create(Stream.prototype)
