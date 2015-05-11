window.process.youtubedisplay = function(args, stdin, stdout, stderr, comm){
	function send(link){
		var id = link.match(/[?&]v=(\w*)/)[1]
		iframe = '<iframe width="560" height="315" src="https://www.youtube.com/embed/'+id+'" frameborder="0" allowfullscreen></iframe>'
		stdout.writeln(iframe)
	}
	if(args[1]){
		send(args[1]);
		comm.finish(0);
	}
	else{
		function read(line){
			if(comm.dead){
				comm.finish(0);
				return;
			}
			send(line);
			stdin.readln(read);
		}
	}
}