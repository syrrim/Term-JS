window.process.download = function(args, io){
    var file = dir.getFile(args[1]),
        url = URL.createObjectUrl(Blob(file.read())),
        link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = file;
    document.appendChild(link);
    link.click();
}
