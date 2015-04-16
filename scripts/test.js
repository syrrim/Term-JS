var parser = new optparse.OptionParser([
    ["-a", "--apple", "Prints apple"],
    ["-b", "--bee", "Prints bee"],
    ["-c", "--care", "Prints care"]
]);
parser.banner = "Usage: test [flags]"
window.process.test = function(args, stdin, stdout, stderr, comm){
    parser.on("apple", function(name, value){stdout.writeln("apple")});
    parser.on("bee", function(){stdout.writeln("bee")});
    parser.on("care", function(){stdout.writeln("care")});
    console.log("not here")
    try{
        parser.parse(args);
    }catch(e){
        stderr.writeln(e);
    }
    console.log("here")
    comm.finish();
}