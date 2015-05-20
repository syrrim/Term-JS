function closed(statement){
    if(/[^+]\+\s*$/.test(statement)){
        return false;
    }
    var starts = "[{(",
        ends  =  "]})",
        dict = {"[":0,"{":0,"(":0};
    for(var i = 0; i < statement.length; i++){
        if(starts.indexOf(statement[i]) !== -1){
            dict[statement[i]] ++;
        }
        else{
            var end = ends.indexOf(statement[i]);
            g = end
            if(end !== -1){
                dict[starts[end]] --;
            }
        }
    }
    for(var s = 0; s < starts.length; s++){
        if(dict[starts[s]])return false;
    }
    return true;
}

window.process.javascript = function(args, io){
    var statement = "";
    function javascript(line){
        statement += "\n" + line;
        if(closed(statement)){
            try{
                io.writeln(eval(statement))
            }catch(e){
                io.errln(e);
            }
            statement = "";
        }
        io.readln(javascript);
    }
    io.readln(javascript);
}