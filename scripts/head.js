window.process.head = function(args, io){
    var amount = isNaN(parseInt(args[1]))? 10 : parseInt(args[1]),
        i = 0;
    function read(line){
        console.log(1, amount)
        if(i<amount){
            io.writeln(line);
            io.readln(read);
            i++;
        }else{
            throw new Success();
        }
    }
    io.readln(read);
}