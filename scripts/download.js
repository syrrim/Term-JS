window.process.download = function(args, io){
    var file = window.dirs.getFile(args[1]),
        url = URL.createObjectUrl(Blob(file.read())),
        link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = file;
    document.body.appendChild(link);
    link.click();
    createTimeout(function(){
        body.removeChild(link);
        URL.revokeObjectUrl(url);
    }, 100)
}
