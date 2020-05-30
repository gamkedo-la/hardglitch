// This file contains debug utilities for working with this game.

export { setText, setCentralText, display };

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";

let text_to_display = "READY";
let central_text = null;

function setText(text){ // TODO: add a text display in the Canvas to display this
    console.log(text); // TEMPORARY: just log for now.
    text_to_display = text;
}

function setCentralText(text){ // TODO: add a text display in the Canvas to display this
    console.log(text); // TEMPORARY: just log for now.
    text_to_display = text;
}

function display_mouse_position(){
    const center = graphics.canvas_center_position();
    graphics.draw_text(`Mouse: X = ${input.mouse.position.x}\tY = ${input.mouse.position.y}`, {x: center.x, y: 20 });
}

function display(){
    const center = graphics.canvas_center_position();
    if(text_to_display){
        graphics.draw_text(text_to_display, {x: center.x, y: center.y + 20 });
    }
    if(central_text){
        graphics.draw_text(central_text, {x: center.x, y: center.y - 20 });
    }


    display_mouse_position();
}