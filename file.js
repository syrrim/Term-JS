File = function(name){
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
dirs = {
    valid: function(path){
        return path[0] === "/" && localStorage.getItem(path) !== null
    },
    validDir: function(path){
        return this.valid(path) && path[path.length-1] === "/"
    },
    validFile: function(path){
        return this.valid(path) && path[path.length-1] !== "/"
    },
    parent: function(path){
        if(path[path.length-1] === "/")
            path = path.slice(0, -1);
        return path.slice(0, path.lastIndexOf("/"))
    },
    get: function(path){
        if(valid(path)){
            return new File(path)
        }else{
            throw new Error("File or Directory at '"+path+"' does not exist");
        }
    },
    _add: function(parent, name){
        if(parent[parent.length-1] === "/" && this.valid(parent)){
            (new File(parent)).append("\n"+name);
            var f = new File(parent + name);
            f.append("");
            return f;
        }else{
            throw new Error("Directory '"+parent+"' does not exist");
        }
    },
    addDir: function(parent, name){
        if(name.indexOf("/") === name.length-1){
            return this._add(parent, name);
        }else{
            throw new Error("Invalid directory name '"+ name + "'");
        }
    },
    addFile: function(parent, name){
        if(name.indexOf("/") === -1){
            return this._add(parent, name);
        }else{
            throw new Error("Invalid file name '"+ name + "'");
        }
    },
    navigate: function(orig, path){
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
            final = this.navigate(this.parent(orig), path.slice(3))
        if(this.valid(final)){
            return final;
        }
        throw Error("invalid path '" + final + "' from '"+orig+"'+'"+path+"'");
    },
}
new File("/").append("");
window.process = window.process?window.process:{};
window.environment = window.environment?window.environment:{};
environment.CWD = "/" // no user folders or other files, no need for home directory.
process.cd = function(args, io){
    var path = "/";
    if(args[1]){
        try{
            path = dirs.navigate(environment.CWD, args[1][args[1].length-1]==="/"?args[1]:args[1]+"/");
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
    var path = args[1]
    if(args[1].indexOf("/") === -1){
        path += "/"
    }else if(args[1].indexOf("/") !== args[1].length-1){
        io.errln("invalid directory name");
    }
    try{dirs.addDir(environment.CWD, path);}
    catch(e){throw new Failure(e.message);}
    throw new Success();
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
        this.lines.append(this.line)
        this.line = "";
    },
    reader: function(end){
        return new In(this, end);
    },
};
function FileStream(filename){
    Stream.call(this);
    this.lines = new File(filename);
}
FileStream.prototype = Object.create(Stream.prototype)
