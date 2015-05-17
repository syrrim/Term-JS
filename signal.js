Function.prototype.inherit = function(constr){
    this.prototype  = Object.create(constr.prototype);
    this.prototype.super = function(){
        return constr.apply(this, arguments);
    }
    return this
}

Exit = function(code, message){
    this.code = code;
    this.message = message;
}

Success = (function(){
    return this.super(0, "Success");
}).inherit(Exit)

Failure = (function(arg1, arg2){
    if(arg1 instanceof Number)
        var code = arg1,
            message = arg2;
    else{
        var code = 1,
            message = "Process Failed";
    }
    Exit.call(this, code, message);
}).inherit(Exit)
var fail = function(code, defmessage){
    return (function(message){
            this.super(code, message?message:defmessage);
        }).inherit(Failure);
};
WrongUsage = fail(64, "Improper Usage");
IOError = fail(74, "IO Error");
NoCommand = fail(127, "Command Not Found");
Terminate = fail(130, "Process Terminated");
