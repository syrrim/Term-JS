window.process.link = function(args, stdin, stdout, stderr){
	function read(line){
		stdout.writeln("<a href='" + line + "'>" + line + "</a>");
		stdin.readln(read);
	}
	stdin.readln(read)
}