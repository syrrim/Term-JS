window.process.playsound = function(args, stdin, stdout, stderr, comm){
    function playsound(url){
        if(comm.dead){
            comm.finish(0)
            return;
        }
        sound = new Audio(url);
        console.log(sound);
        sound.oncanplaythrough = function(){
            sound.play()
            stdin.readln(playsound)
        }
        sound.onerror = function(e){
            sdterr.writeln(e)
            comm.finish(-1)
        }
    }
    stdin.readln(playsound);
}