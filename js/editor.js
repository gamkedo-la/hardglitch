// This file contains debug utilities for working with this game.

export {
    is_enabled, is_editing,
    setText, setCentralText,
    update, display,
};

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as tiles from "./definitions-tiles.js";
import { mouse_grid_position, mouse_game_position, KEY } from "./game-input.js";
import { current_game_view, current_game } from "./main.js";

let is_enabled = false; // TURN THIS ON TO SEE THE EDITOR, see the update() function below
let is_editing = false; // True if we are doing an edition manipulation and no other input should be handled.

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
    const mouse_grid_pos = mouse_grid_position();
    const mouse_game_pos = mouse_game_position();
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

function update_world_edition(){
    is_editing = input.keyboard.is_any_key_down();
    if(!is_editing)
        return;

    const mouse_grid_pos = mouse_grid_position();

    if(input.mouse.buttons.is_down(input.MOUSE_BUTTON.LEFT)){

        function change_pointed_tile_if_key_down(key_code, tile_id){
            if(input.keyboard.is_down(key_code)
            && current_game.world._floor_tile_grid.get_at(mouse_grid_pos) != tile_id){
                current_game.world._floor_tile_grid.set_at(tile_id, mouse_grid_pos);
                return true;
            }
            return false;
        };

        let tiles_changed = false;
        tiles_changed = tiles_changed || change_pointed_tile_if_key_down(KEY.NUMBER_0, undefined);
        tiles_changed = tiles_changed || change_pointed_tile_if_key_down(KEY.NUMBER_1, tiles.ID.GROUND);
        tiles_changed = tiles_changed || change_pointed_tile_if_key_down(KEY.NUMBER_2, tiles.ID.WALL);
        tiles_changed = tiles_changed || change_pointed_tile_if_key_down(KEY.NUMBER_3, tiles.ID.VOID);
        if(tiles_changed)
            current_game_view.notify_edition();
    }

}


function display(){
    if(!is_enabled)
        return;

    graphics.camera.begin_in_screen_rendering();

    graphics.draw_text("EDITOR MODE", {x: 20, y: 40 });

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

    if(input.keyboard.is_just_down(KEY.N)){
        current_game_view.tile_grid.enable_tile_sprites = !current_game_view.tile_grid.enable_tile_sprites;
    }


    if(!is_enabled){
        if(input.keyboard.is_just_down(KEY.ESCAPE))
            is_enabled = true;
        return; // Skip this frame, whatever the case.
    }

    if(input.keyboard.is_just_down(KEY.ESCAPE)){
        is_enabled = false;
        return;
    }


    update_world_edition();
}