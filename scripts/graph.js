process.graph = function(args, stdin, stdout, stderr, comm){
    amount = parseInt(args[1]);
    data = {};
    length = 0;
    max = [0, 0];
    stdin.readln(collect);
    function collect(line){
    	stderr.writeln(line)
        if(comm.dead){comm.finish(0);return}
        values = line.split(":");
        data[values[0]] = values[1];
        max[0] = max[0] > values[0]? max[0] : values[0];
        max[1] = max[1] > values[1]? max[1] : values[1];
        length += 1;
        if(length<amount){
            stdin.readln(collect);
        }else{
            draw();
            comm.finish(0);
        }
    }
    function draw(){
    	stderr.writeln(JSON.stringify(data))
        graph = [["|"]];
        for(var i = 0; i < max[1]; i++){
            for(var j = 0; j < max[0]; j++){
            graph[i].push(" ");
            }
            graph.push(["|"]);
        }
        graph.push(["_"]);
        for(var i = 0; i < max[0]; i++){
            graph[graph.length-1].push("_");
        }
        console.log(graph, data)
        for(x in data){
            console.log(max[1], data[x])
            graph[max[1] - data[x]][x] = ".";
        }
        var print = [];
        for(var i = 0; i < graph.length; i++){
            print.push(graph[i].join(""));
        }
        stdout.writeln(print.join("\n"));
    }
}
