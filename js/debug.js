// This file contains debug utilities for working with this game.

export { setText, setCentralText, display };

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import { current_game_view } from "./main.js";

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

let dragging = undefined;
let dragging_display_time = 0;

function display_mouse_position(){
    if(!current_game_view)
        return;

    const center = graphics.canvas_center_position();
    const mouse_grid_pos = current_game_view.mouse_grid_position;
    graphics.draw_text(`Mouse: X = ${input.mouse.position.x}\tY = ${input.mouse.position.y}\t\tGRID: X = ${mouse_grid_pos.x}\tY = ${mouse_grid_pos.y}`, {x: center.x, y: 20 });

    graphics.draw_text(`Buttons: LEFT: ${input.mouse.buttons.is_down(0)}\t\tRIGHT: ${input.mouse.buttons.is_down(2)}`, {x: center.x, y: 40 });

    if(input.mouse.is_dragging)
        dragging_display_time = 100;

    if(dragging_display_time > 0){
        --dragging_display_time;
        const drag_pos = input.mouse.dragging_positions;
        if(drag_pos.begin != undefined)
            dragging = drag_pos;
        graphics.draw_text(`Dragging: FROM: ${JSON.stringify(dragging.begin)}\t\tTO: ${JSON.stringify(dragging.end)}`, {x: center.x, y: 60 });
    }
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

function update(){

}