// This file contains debug utilities for working with this game.

export { setText, setCentralText, display };

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as game_input from "./game-input.js";
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

let lmb_down_frames = 0;

function display_mouse_position(){
    if(!current_game_view)
        return;
    let line = 4;
    function next_line(){
        return line += 30;
    }

    const center = graphics.canvas_center_position();
    const mouse_grid_pos = game_input.mouse_grid_position();
    const mouse_game_pos = game_input.mouse_game_position();
    graphics.draw_text(`MOUSE STATE:`, {x: center.x, y: next_line() });
    graphics.draw_text(`SCREEN X = ${input.mouse.position.x}\tY = ${input.mouse.position.y}`, {x: center.x, y: next_line() });
    graphics.draw_text(`GAME SPACE: X = ${mouse_game_pos.x}\tY = ${mouse_game_pos.y}`, {x: center.x, y: next_line() });
    graphics.draw_text(`GAME GRID: X = ${mouse_grid_pos.x}\tY = ${mouse_grid_pos.y}`, {x: center.x, y: next_line() });

    graphics.draw_text(`Buttons: LEFT: ${input.mouse.buttons.is_down(0)}\t\tRIGHT: ${input.mouse.buttons.is_down(2)}`, {x: center.x, y: next_line() });

    if(input.mouse.is_dragging)
        dragging_display_time = 100;

    if(dragging_display_time > 0){
        --dragging_display_time;
        const drag_pos = input.mouse.dragging_positions;
        if(drag_pos.begin != undefined)
            dragging = drag_pos;
        graphics.draw_text(`Dragging: FROM: ${JSON.stringify(dragging.begin)}\t\tTO: ${JSON.stringify(dragging.end)}`, {x: center.x, y: next_line() });
    }

    if(input.mouse.buttons.is_just_down(input.MOUSE_BUTTON.LEFT)){
        graphics.draw_text(`JUST DOWN: LEFT MOUSE BUTTON`, {x: center.x, y: next_line() });
        lmb_down_frames++;
    }
    if(input.mouse.buttons.is_just_released(input.MOUSE_BUTTON.LEFT)){
        graphics.draw_text(`JUST DOWN: LEFT MOUSE BUTTON`, {x: center.x, y: next_line() });
    }

    graphics.draw_text(`FRAMES LEFT MOUSE BUTTON ${lmb_down_frames}`, {x: center.x, y: next_line() });
}

function display(){
    graphics.camera.begin_in_screen_rendering();

    const center = graphics.canvas_center_position();
    if(text_to_display){
        graphics.draw_text(text_to_display, {x: center.x, y: center.y + 20 });
    }
    if(central_text){
        graphics.draw_text(central_text, {x: center.x, y: center.y - 20 });
    }

    display_mouse_position();

    graphics.camera.end_in_screen_rendering();
}

function update(){

}