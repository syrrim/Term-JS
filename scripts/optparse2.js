function Parser(usage, types){
    parts = usage.match(/[^\[\]|\(\) ]+|[\[\]|\(\)]/g);
    this.name = parts.shift();
    this.tree = [];
    var squaredepth = 0,
        parendepth = 0;
    for(var i = 0; i < parts.length; i++){
        if(parts[i] === "[")squaredepth++;
        if(parts[i] === "]")squaredepth--;
        if(parts[i] === "(")parendepth++;
        if(parts[i] === ")")parendepth--;
    }
}
function Parser(usage, types){
    parts = usage.split(" ");
    this.name = parts.shift();
    this.pieces = [];
    for(var i = 0; i < parts.length; i++){
        pieces.push(types[parts[i]]);
    }
}
new Parser("do command1 mod command1",{
    command1: types.string,
    command2: types.string
    mod: types.enum("or", "and", "unless", "if", "whilst"),
});
Parser.pieces

/*Parser("do command [speed] [options]", {
    command: types.string,
    speed: types.number,
    options: types.options,
})*/