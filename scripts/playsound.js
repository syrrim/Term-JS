window.process.playsound = function(args, io){
    function playsound(url){
        sound = new Audio(url);
        sound.oncanplaythrough = function(){
            sound.play()
            io.readln(playsound);
        }
        sound.onerror = function(e){
            io.errln(e)
            throw new Failure(74, e.message);
        }
    }
    io.readln(playsound);
}