function choose(obj, def){
    if(obj === undefined){
        return def;
    }
    return obj;
}
var options = {
    set: function(name, letter, doc){
        return {word: name, letter: letter, doc: doc,
                func: function(object){
                    object[name] = true;
                }};
    },
    enum: function(tag, position, name, letter, doc){
        return {word: name, letter: letter, doc: doc,
                func: function(object){
                    object[tag] = position;
                }}
    }
},
parsers = {
    position: function(name, coerce){
        var coerce = choose(coerce, function(n){return n});
        return function(array, object){
            if(!array.length)throw new Error("Not enough args for " + name);
            object[name] = coerce(array.shift())
        }
    },
    flags: function(letters, words){
        return function(array, object){
            while(array.length){
                if(array[0].slice(0, 2) === "--" && words[array[0].slice(2)]){
                    words[array[0].slice(2)](object);
                    array.shift();
                }else if(array[0][0] === "-"){
                    var letter = array[0].slice(1);
                    for(var l = 0; l < letter.length; l++){
                        if(letters[letter[l]]){
                            letters[letter[l]](object);
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
            doc += "\n    -" + opt.letter + ", --" + opt.word + ": " + opt.doc;
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
        console.log(choices[i], values)
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
