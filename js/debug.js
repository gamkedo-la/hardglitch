// This file contains debug utilities for working with this game.

export { setText };

let textBox = document.getElementById("debugText");


function setText(text){
    textBox.innerHTML = text;
    console.log(text);
}
