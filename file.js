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
            this.wrap(callback)(this.stream.lines[this.index-1]);
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
            this.wrap(callback)(this.stream.lines.slice(prevind).join("\n") + "\n" + this.stream.line.slice(prevdepth));

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
    reader: function(end){
        return new In(this, end);
    },
};
