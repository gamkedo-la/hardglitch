Development Help
================

Hi, Klaim here.
Here are some notes that might be helpful for coding in this game:

### Directories

You can see that I splitt the sources with sub-directories.

- `./js/system/` will contain code that's designed to solve a problem that's not specific to that game. For example you'll see the sprite system there.
- `./js/core/` this code is mainly where the description of the structure of the world is. Like how the turn system works, how items are owned by bodies or are in the world, etc.
- `./js/rules/` this will contain the code of rules, actions, events, one file each set. For example everything related to movement is in rules-movement.js, etc. If you want to add actions, just create a file there and start banging code.

You can also look at the top of each source file, there should be an indication of the intent of that file.

If you don't know where to put anything, don't worry. Just create a file here (in `./js`) and dump your code in there. Import what you need etc. We'll figure out later where things could go (if we need to). You can also ask or just add code in a file already existing, no need to worry. I'll do refactoring passes regularly anyway, to help with keeping the debugging "sane" ^^


### Modules

You can see that we are using javascript modules (import/export). This is to help us debug the code later by making obvious which file have access to which other files (and therefore cannot have access to the others data). It also help doing stuffs in a file and never make it available to other files, just as an implementation detail.

If you don't have a clue where to put what, just write the code somewhere, no worries at all, focus on what you want to achieve. Maybe someone will come to your code later when they need to change something and refactor as needed.

### `yield` (Generators)

You will see functions with `*functionname` or the keyword `yield`. This is a very useful tool to be able to call a function, then the function stops in the middle and returns, then we obtain a generator object. That generator allows us to "resume" the execution of the function later.

There is a very big use of this in this code to help with the turn-by-turn aspects: the code is written in order of what will hapen, but each yield allow the updating of the graphics etc to also update.
(it's usually called "collaborative scheduling" and it relies on "coroutines", in case you want to research about that)

It's important in a lot of systems, but if you have trouble with that feature of the language, feel free to ask and I will help you use it. Or you can do you thing and we ll update the code later, no problems. Just don't worry too much. It's a very useful feature in general though, so if you can learn about it, it might help with C#/Unity games too later.

