window.process.download = function(args, io){
    var file = window.dirs.getFile(args[1]),
        url = URL.createObjectURL(new Blob([file.read()])),
        link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = args[1];
    document.body.appendChild(link);
    link.click();
    setTimeout(function(){
        body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100)
    throw new Success("Yusshhhhh");
}
