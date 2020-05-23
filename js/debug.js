// This file contains debug utilities for working with this game.

export { setText, display };

import * as graphics from "./system/graphics.js";

let text_to_display = "READY";

function setText(text){ // TODO: add a text display in the Canvas to display this
    console.log(text); // TEMPORARY: just log for now.
    text_to_display = text;
}

function display(){
    if(text_to_display){
        const center = graphics.canvas_center_position();
        graphics.draw_text(text_to_display, {x: center.x, y: center.y + 20 });
    }
}