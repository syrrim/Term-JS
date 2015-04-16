process.graph = function(args, stdin, stdout, stderr, comm){
    amount = parseInt(args[1]);
    data = {};
    length = 0;
    max = [0, 0]
    function collect(line){
    	stderr.write(line)
	if(comm.dead){comm.finish(0);return}
        values = data.split(":");
        data[values[0]] = values[1]
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
	for(var i = 0; i < max[0]; i++){
	    for(var j = 0; j < max[1]; j++){
		graph[i].push(" ");
	    }
	    graph.push(["|"]);
	}
	graph.push(["_"]);
	for(var i = 0; i < max[1]; i++){
	    graph[max[0]].push("_");
	}
	for(x in data){
	    graph[data[x]][x] = ".";
	}
	var print = [];
	for(var i = 0; i < graph.length; i++){
	    print.push(graph[i].join());
	}
	stdout.writeln(print.join("\n"));
    }
}
