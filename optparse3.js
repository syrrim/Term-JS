function choose(obj, def){
    if(obj === undefined){
        return def;
    }
    return obj;
}
var coercers = {
    identity: function(anything){
        return anything;
    },
    int: function(string){
        var int = parseInt(string);
        if(isNaN(int))throw new Error(string + " cannot be parsed as an int");
        return int
    },
    float: function(string){
        var float = parseFloat(string);
        if(isNaN(float))throw new Error(string + " cannot be parsed as a float");
        return float
    },
    date: function(string){
        var date = new Date(string);
        if(isNaN(date))throw new Error(string + " cannot be parsed as a date");
        return date 
    },
},
options = {
    set: function(name, letter, doc){
        return {word: name, letter: letter, doc: doc,
                func: function(array, object){
                    object[name] = true;
                }};
    },
    enum: function(tag, position, name, letter, doc){
        return {word: name, letter: letter, doc: doc,
                func: function(array, object){
                    object[tag] = position;
                }}
    },
    data: function(coerce, name, letter, doc){
        return {word: name, letter: letter,
                doc: doc, func: function(array, object){
                       object[name] = coerce(array[1]);
                       array.splice(1, 1);
                   }
               }
    },
    string: function(name, letter, doc){
        return this.data(coercers.identity, name, letter, doc);
    },
},
filters = {
    position: function(name, coerce){
        var coerce = choose(coerce, function(n){return n});
        return function(array, object){
            if(!array.length)throw new Error("Not enough args for " + name);
            object[name] = coerce(array[0])
            array.shift();
        }
    },
    flags: function(letters, words){
        return function(array, object){
            while(array.length){
                if(array[0].slice(0, 2) === "--" && words[array[0].slice(2)]){
                    words[array[0].slice(2)](array, object);
                    array.shift();
                }else if(array[0][0] === "-"){
                    var letter = array[0].slice(1);
                    for(var l = 0; l < letter.length; l++){
                        if(letters[letter[l]]){
                            letters[letter[l]](array, object);
                        }else{
                            throw new Error("Flag '" + letter[l] + "' in -" + letter + " is invalid");
                        }
                    }
                    array.shift();
                }else{
                    break;
                }
            }
        }
    },
    options: function(options){
        var letters = {},
            words = {},
            doc = "";
        for(var i = 0; i < options.length; i ++){
            var opt = options[i]
            letters[opt.letter] = opt.func;
            words[opt.word] = opt.func;
            doc += "\n    "+
                opt.letter.length === 1 ? ("-" + opt.letter + ", "): "" + 
                "--" + opt.word + ": " + opt.doc;
        }
        return [doc, this.flags(letters, words)]; 
    },
    optional: function(func){
        return function(array, object){
            try{
                func(array, object)
            }catch(e){}
        }
    },
},

Parser = function(string, values){
    this.filters = [];
    this.string = string;
    this.doc = "USAGE: " + string + "\n\n";
    var choices = string.match(/[^\s\[\]]+|[\[\]]/g),
        option = false;
    for(var i = 1; i < choices.length; i++){
        if(choices[i] === "["){
            option = true;
            continue;
        }if(choices[i] === "]"){
            option = false;
            continue;
        }
        if(option)
            this.filters.push(parsers.optional(values[choices[i]][1]));
        else
            this.filters.push(values[choices[i]][1]);
        this.doc += choices[i] + ": " + values[choices[i]][0] + "\n";
    }
};
Parser.prototype = {
    parse: function(args){
        var array = args.slice(),
            object = {};
        for(var i = 0; i < this.filters.length; i++){
            this.filters[i](array, object);
        }
        if(array.length)throw new Error("Too many args: " + array)
        return object;
    }
}

window.optparse3 = {
    coercers: coercers,
    options: options,
    filters: filters,
    Parser: Parser,
}
