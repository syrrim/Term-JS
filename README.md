# Term-JS
A terminal emulator that runs from a webpage.

You can try it here: http://rawgit.com/syrrim/Term-JS/master/main.html

It is mostly designed to emulate the functionality of bash, so it has several standard UNIX commands sush as echo and grep, 
and bash shortcuts like ctrl-A or ctrl-U. 

The main purpose was to allow access to web based APIs. As such, there are currently commands for google and wordnik.

The main ability you gain by having APIs in a CLI is the ability to pipe them together. For example, you can currently do

    wordnik cool -a | playsound

Which would play people pronouncing the word 'cool'. In this case it occurs four times, but you might want it to only happen once. In that case it could be

    wordnik cool -a | head 1 | playsound

Which would only play the first result. 
