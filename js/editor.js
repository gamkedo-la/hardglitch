// This file contains debug utilities for working with this game.

export {
    is_enabled, is_editing,
    set_text, set_central_text,
    update, display,
};

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as tiles from "./definitions-tiles.js";
import { mouse_grid_position, mouse_game_position, KEY } from "./game-input.js";
import { current_game_view, current_game } from "./main.js";

let is_enabled = false; // TURN THIS ON TO SEE THE EDITOR, see the update() function below
let is_editing = false; // True if we are doing an edition manipulation and no other input should be handled.

let display_mouse_info = false;

let text_to_display = "READY";
let central_text = null;

function set_text(text){ // TODO: add a text display in the Canvas to display this
    console.log(text); // TEMPORARY: just log for now.
    text_to_display = text;
}

function set_central_text(text){ // TODO: add a text display in the Canvas to display this
    console.log(text); // TEMPORARY: just log for now.
    central_text = text;
}

let dragging = undefined;
let dragging_display_time = 0;

let lmb_down_frames = 0;

function display_mouse_position(){
    if(!current_game_view)
        return;
    let line = 100;
    function next_line(){
        return line += 30;
    }

    const display_x = 50;
    const mouse_grid_pos = mouse_grid_position();
    const mouse_game_pos = mouse_game_position();
    graphics.draw_text(`MOUSE STATE:`, {x: display_x, y: next_line() });
    graphics.draw_text(`SCREEN X = ${input.mouse.position.x}\tY = ${input.mouse.position.y}`, {x: display_x, y: next_line() });
    graphics.draw_text(`GAME SPACE: X = ${mouse_game_pos.x}\tY = ${mouse_game_pos.y}`, {x: display_x, y: next_line() });
    graphics.draw_text(`GAME GRID: X = ${mouse_grid_pos.x}\tY = ${mouse_grid_pos.y}`, {x: display_x, y: next_line() });

    graphics.draw_text(`Buttons: LEFT: ${input.mouse.buttons.is_down(0)}\t\tRIGHT: ${input.mouse.buttons.is_down(2)}`, {x: display_x, y: next_line() });

    if(input.mouse.is_dragging)
        dragging_display_time = 100;

    if(dragging_display_time > 0){
        --dragging_display_time;
        const drag_pos = input.mouse.dragging_positions;
        if(drag_pos.begin != undefined)
            dragging = drag_pos;
        graphics.draw_text(`Dragging: FROM: ${JSON.stringify(dragging.begin)}\t\tTO: ${JSON.stringify(dragging.end)}`, {x: display_x, y: next_line() });
    }

    if(input.mouse.buttons.is_just_down(input.MOUSE_BUTTON.LEFT)){
        graphics.draw_text(`JUST DOWN: LEFT MOUSE BUTTON`, {x: display_x, y: next_line() });
        lmb_down_frames++;
    }
    if(input.mouse.buttons.is_just_released(input.MOUSE_BUTTON.LEFT)){
        graphics.draw_text(`JUST DOWN: LEFT MOUSE BUTTON`, {x: display_x, y: next_line() });
    }

    graphics.draw_text(`FRAMES LEFT MOUSE BUTTON ${lmb_down_frames}`, {x: display_x, y: next_line() });
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

const help_text_x_from_right_side = 500;

function display_help(){
    const canvas_rect = graphics.canvas_rect();
    const display_x = canvas_rect.bottom_right.x - help_text_x_from_right_side;

    let line = 100;
    function next_line(){
        return line += 30;
    }

    graphics.draw_text("[ESC] - EDITOR MODE", {x: display_x, y: next_line() });
    graphics.draw_text("[F9]  - MOUSE INFO", {x: display_x, y: next_line() });
    graphics.draw_text("-----------------------", {x: display_x, y: next_line() });
    graphics.draw_text("[M] - SHOW/HIDE GRID LINES", {x: display_x, y: next_line() });
    graphics.draw_text("[P] - REMOVE ALL PLAYER CHARACTERS", {x: display_x, y: next_line() });
    graphics.draw_text("-----------------------", {x: display_x, y: next_line() });
    graphics.draw_text("[Arrow keys] - Move player character", {x: display_x, y: next_line() });
    graphics.draw_text("[WASD] - Move Camera", {x: display_x, y: next_line() });
    graphics.draw_text("-----------------------", {x: display_x, y: next_line() });
    graphics.draw_text("Drag the screen to move the camera", {x: display_x, y: next_line() });
    graphics.draw_text("Click on squares around PC to move or act", {x: display_x, y: next_line() });

}

function display_editor_help(){
    const canvas_rect = graphics.canvas_rect();
    const display_x = canvas_rect.bottom_right.x - help_text_x_from_right_side;

    let line = 100;
    function next_line(){
        return line += 30;
    }

    graphics.draw_text("[ESC] - EXIT EDITOR MODE", {x: display_x, y: next_line() });
    graphics.draw_text("[F9]  - MOUSE INFO", {x: display_x, y: next_line() });
    graphics.draw_text("-----------------------", {x: display_x, y: next_line() });
    graphics.draw_text("[M] - SHOW/HIDE GRID LINES", {x: display_x, y: next_line() });
    graphics.draw_text("[P] - REMOVE ALL PLAYER CHARACTERS", {x: display_x, y: next_line() });
    graphics.draw_text("-----------------------", {x: display_x, y: next_line() });
    graphics.draw_text("[WASD] - Move Camera", {x: display_x, y: next_line() });
    graphics.draw_text("-----------------------", {x: display_x, y: next_line() });
    graphics.draw_text("[Number] + [LMB] - Change the pointed tile", {x: display_x, y: next_line() });
    graphics.draw_text("(0: hole, 1: ground, 2: wall, 3: void", {x: display_x, y: next_line() });

}

function display(){

    graphics.camera.begin_in_screen_rendering();

    const center = graphics.canvas_center_position();
    const canvas_rect = graphics.canvas_rect();

    if(text_to_display){
        graphics.draw_text(text_to_display, {x: center.x - 100, y: canvas_rect.height - 100 });
    }
    if(central_text){
        graphics.draw_text(central_text, {x: center.x - 200, y: center.y - 20 });
    }

    if(display_mouse_info)
        display_mouse_position();

    if(is_enabled){ // Specific to editor mode.
        graphics.draw_text("---====::::  EDITOR MODE  ::::====---", {x: center.x - 200, y: 40 });
        display_editor_help();
    } else {
        display_help();

    }

    graphics.camera.end_in_screen_rendering();
}

// TEMPORARY: This is only useful to text that the Game Over state is detected.
function remove_all_players(){ // THIS IS A HACK, DON'T DO THIS AT HOME
    const world = current_game.world;
    const player_characters = world.player_characters;
    for(const character_body of player_characters){
        world.remove_body(character_body.body_id); // THIS IS A HACK, DON'T DO THIS AT HOME
        current_game_view.remove_view(character_body.body_id); // THIS IS A HACK, DON'T DO THIS AT HOME
    }
}

function update(){

    if(input.keyboard.is_just_down(KEY.N)){
        current_game_view.tile_grid.enable_tile_sprites = !current_game_view.tile_grid.enable_tile_sprites;
    }

    if(input.keyboard.is_just_down(KEY.F9)){
        display_mouse_info = !display_mouse_info;
    }

    if(input.keyboard.is_just_down(KEY.ESCAPE)){
        is_enabled = !is_enabled;
    }

    if(input.keyboard.is_just_down(KEY.P)) {
        remove_all_players();
        return;
    }

    update_world_edition();
}