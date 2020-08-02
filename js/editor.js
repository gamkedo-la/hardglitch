// This file contains debug utilities for working with this game.

export {
    is_enabled, is_editing,
    set_text, set_central_text,
    update, display,
};

import * as audio from "./system/audio.js";
import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as tiles from "./definitions-tiles.js";
import { mouse_grid_position, mouse_game_position, KEY, play_action } from "./game-input.js";
import * as items from "./definitions-items.js";
import * as ui from "./system/ui.js";
import { Character } from "./core/character.js";
import { random_float } from "./system/utility.js";

let is_enabled = false; // TURN THIS ON TO SEE THE EDITOR, see the update() function below
let is_editing = false; // True if we are doing an edition manipulation and no other input should be handled.

let was_fog_of_war_activated = true;

let display_help_info = false;
let display_mouse_info = false;
let display_character_info = false;

let text_to_display = "READY";
let central_text = null;

function set_text(text){ // TODO: add a text display in the Canvas to display this
    console.log(text);
    text_to_display = text;
}

function set_central_text(text){ // TODO: add a text display in the Canvas to display this
    console.log(text);
    central_text = text;
}

let dragging = undefined;
let dragging_display_time = 0;

let lmb_down_frames = 0;

let reused_text_line;

function draw_text(text, position){
    if(!reused_text_line)
        reused_text_line = new ui.Text({
            text: "",
            font: "20px arial"
        });

    reused_text_line.position = position;
    reused_text_line.text = text;
    reused_text_line.update();
    reused_text_line.draw(graphics.screen_canvas_context);
}

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
    draw_text(`MOUSE STATE:`, {x: display_x, y: next_line() });
    draw_text(`SCREEN X = ${input.mouse.position.x}\tY = ${input.mouse.position.y}`, {x: display_x, y: next_line() });
    draw_text(`GAME SPACE: X = ${mouse_game_pos.x}\tY = ${mouse_game_pos.y}`, {x: display_x, y: next_line() });
    if(mouse_grid_pos)
        draw_text(`GAME GRID: X = ${mouse_grid_pos.x}\tY = ${mouse_grid_pos.y}`, {x: display_x, y: next_line() });

    draw_text(`Buttons: LEFT: ${input.mouse.buttons.is_down(0)}\t\tRIGHT: ${input.mouse.buttons.is_down(2)}`, {x: display_x, y: next_line() });

    if(input.mouse.is_dragging)
        dragging_display_time = 100;

    if(dragging_display_time > 0){
        --dragging_display_time;
        const drag_pos = input.mouse.dragging_positions;
        if(drag_pos.begin != undefined)
            dragging = drag_pos;
        draw_text(`Dragging: FROM: ${JSON.stringify(dragging.begin)}\t\tTO: ${JSON.stringify(dragging.end)}`, {x: display_x, y: next_line() });
    }

    if(input.mouse.buttons.is_just_down(input.MOUSE_BUTTON.LEFT)){
        draw_text(`JUST DOWN: LEFT MOUSE BUTTON`, {x: display_x, y: next_line() });
        lmb_down_frames++;
    }
    if(input.mouse.buttons.is_just_released(input.MOUSE_BUTTON.LEFT)){
        draw_text(`JUST DOWN: LEFT MOUSE BUTTON`, {x: display_x, y: next_line() });
    }

    draw_text(`FRAMES LEFT MOUSE BUTTON ${lmb_down_frames}`, {x: display_x, y: next_line() });
}

function update_world_edition(){
    // TODO: use a map of input pattern => action

    is_editing = input.keyboard.is_any_key_down();
    if(!is_editing)
        return;

    const mouse_grid_pos = mouse_grid_position();
    if(!mouse_grid_pos)
        return;

    function change_pointed_tile_if_key_down(key_code, tile_id){
        if(input.keyboard.is_down(key_code)
        && current_game.world._floor_tile_grid.get_at(mouse_grid_pos) != tile_id){
            current_game.world._floor_tile_grid.set_at(tile_id, mouse_grid_pos);
            return true;
        }
        return false;
    };

    function add_player_character_if_ctrl_keys(key_code){
        const key_pattern = [
            { key_code: KEY.LEFT_CTRL, states: [input.KEY_STATE.DOWN, input.KEY_STATE.HOLD] },
            { key_code: key_code, states: [input.KEY_STATE.DOWN] },
        ];

        if(input.keyboard.keys_matches_pattern(...key_pattern)){
            if(current_game.is_walkable(mouse_grid_pos)){
                current_game.add_player_character(mouse_grid_pos);
                return true;
            }
        }
        return false;
    }


    function add_cryptofile_if_ctrl_keys(key_code){
        const key_pattern = [
            { key_code: KEY.LEFT_CTRL, states: [input.KEY_STATE.DOWN, input.KEY_STATE.HOLD] },
            { key_code: key_code, states: [input.KEY_STATE.DOWN] },
        ];

        if(input.keyboard.keys_matches_pattern(...key_pattern)){
            if(current_game.is_walkable(mouse_grid_pos)){
                const file = new items.CryptoFile();
                file.position = mouse_grid_pos;
                current_game.world.add(file);
                return true;
            }
        }
        return false;
    }

    let world_was_edited = false;

    // EDIT TILES
    if(input.mouse.buttons.is_down(input.MOUSE_BUTTON.LEFT)){
        world_was_edited = world_was_edited || change_pointed_tile_if_key_down(KEY.NUMBER_0, tiles.ID.HOLE);
        world_was_edited = world_was_edited || change_pointed_tile_if_key_down(KEY.NUMBER_1, tiles.ID.GROUND);
        world_was_edited = world_was_edited || change_pointed_tile_if_key_down(KEY.NUMBER_2, tiles.ID.WALL);
        world_was_edited = world_was_edited || change_pointed_tile_if_key_down(KEY.NUMBER_3, tiles.ID.VOID);
    }

    // EDIT CHARACTERS
    world_was_edited = world_was_edited || add_player_character_if_ctrl_keys(KEY.C);

    // EDIT ITEMS
    world_was_edited = world_was_edited || add_cryptofile_if_ctrl_keys(KEY.X);


    if(world_was_edited)
        current_game_view.notify_edition();
}

const help_text_x_from_right_side = 500;

function display_help(){

    const canvas_rect = graphics.canvas_rect();
    const display_x = canvas_rect.bottom_right.x - help_text_x_from_right_side;

    let line = 10;
    function next_line(){
        return line += 30;
    }

    draw_text("[F1]  - HELP", {x: display_x, y: next_line() });
    if(!display_help_info)
        return;


    if(current_game_view.ui.is_selecting_action_target){
        draw_text("[ESC] - CANCEL TARGET SELECTION", {x: display_x, y: next_line() });
    } else {
        if(current_game_view.is_time_for_player_to_chose_action
        && !input.mouse.is_dragging
        )
            draw_text("[ESC] - EDITOR MODE", {x: display_x, y: next_line() });
    }
    draw_text("[F8]  - SHOW/HIDE FOV", {x: display_x, y: next_line() });
    draw_text("[F9]  - MOUSE INFO", {x: display_x, y: next_line() });
    draw_text("[F10]  - CHARACTER INFO (pointed)", {x: display_x, y: next_line() });
    draw_text("-----------------------", {x: display_x, y: next_line() });
    draw_text("[M] - SHOW/HIDE GRID LINES", {x: display_x, y: next_line() });
    draw_text("-----------------------", {x: display_x, y: next_line() });
    draw_text("[WASD][Arrow keys] - Move player character", {x: display_x, y: next_line() });
    draw_text("[IJKL] - Move Camera", {x: display_x, y: next_line() });
    draw_text(" `[` and `]` keys  - Lower/Increase View distance", {x: display_x, y: next_line() });
    draw_text(" [F] - Focus on current player character", {x: display_x, y: next_line() });
    draw_text("-----------------------", {x: display_x, y: next_line() });
    draw_text("Drag the screen to move the camera", {x: display_x, y: next_line() });
    draw_text("Click on squares around PC to move or act", {x: display_x, y: next_line() });
    next_line();
    draw_text(`AUTO CAMERA CENTER = ${current_game_view.enable_auto_camera_center ? "enabled" : "disabled"}`, {x: display_x, y: next_line() });
    next_line();
    draw_text(`TURN: ${current_game.turn_info.turn_id} PHASE: ${current_game.turn_info.turn_phase_id}`, {x: display_x, y: next_line() });


}

function display_editor_help(){
    const canvas_rect = graphics.canvas_rect();
    const display_x = canvas_rect.bottom_right.x - help_text_x_from_right_side;

    let line = 10;
    function next_line(){
        return line += 30;
    }


    if(!input.mouse.is_dragging)

    draw_text("[F1]  - HELP", {x: display_x, y: next_line() });
    draw_text("[ESC] - EXIT EDITOR MODE", {x: display_x, y: next_line() });
    if(!display_help_info)
        return;

    draw_text("[F8]  - SHOW/HIDE FOV", {x: display_x, y: next_line() });
    draw_text("[F9]  - MOUSE INFO", {x: display_x, y: next_line() });
    draw_text("[F10]  - CHARACTER INFO (pointed)", {x: display_x, y: next_line() });
    draw_text("-----------------------", {x: display_x, y: next_line() });
    draw_text("[M] - SHOW/HIDE GRID LINES", {x: display_x, y: next_line() });
    draw_text("[LCTRL][C] - ADD PLAYER CHARACTER", {x: display_x, y: next_line() });
    draw_text("-----------------------", {x: display_x, y: next_line() });
    draw_text("[IJKL] - Move Camera", {x: display_x, y: next_line() });
    draw_text(" `[` and `]` keys  - Lower/Increase View distance", {x: display_x, y: next_line() });
    draw_text("-----------------------", {x: display_x, y: next_line() });
    draw_text("[Number] + [LMB] - Change the pointed tile", {x: display_x, y: next_line() });
    draw_text("(0: hole, 1: ground, 2: wall, 3: void", {x: display_x, y: next_line() });

}

function display_stats_of_pointed_character(){

    const stats_x = 50;
    let line = graphics.canvas_center_position().y;
    function next_line(){
        return line += 30;
    }

    draw_text("CHARACTER INFO:", { x: stats_x, y: next_line() });
    const mouse_grid_pos = mouse_grid_position();
    if(!mouse_grid_pos)
        return;

    const character = current_game.world.body_at(mouse_grid_pos);
    if(!(character instanceof Character)){
        draw_text("No Character - Point square with character", { x: stats_x, y: next_line() });
        return;
    }

    draw_text(`NAME: ${character.name}`, { x: stats_x, y: next_line() });
    draw_text(`ACTOR: ${character.is_player_actor ? "PLAYER" : "AI"}`, { x: stats_x, y: next_line() });
    next_line();
    const stats_line = next_line();
    draw_text(`STATISTICS:`, { x: stats_x, y: stats_line });
    for(const [stat_name, stat] of Object.entries(character.stats)){
        draw_text(` - ${stat_name} = ${stat.value}${stat.max ? ` / ${stat.max}` : ""} ${stat.accumulated_modifiers !== 0 ? `(real = ${stat.real_value}, mod = ${stat.accumulated_modifiers}")` : ""}${stat.min? ` [min = ${stat.min}]` : ""}`, { x: stats_x, y: next_line() });
    }

    line = stats_line;
    const inventory_x = 400;
    draw_text(`INVENTORY:`, { x: inventory_x, y: stats_line });
    for(const item of character.inventory.stored_items){
        draw_text(` - ${item.name}`, { x: inventory_x, y: next_line() });
    }

}



function display(){

    graphics.camera.begin_in_screen_rendering();

    const center = graphics.canvas_center_position();
    const canvas_rect = graphics.canvas_rect();

    if(text_to_display){
        draw_text(text_to_display, {x: center.x - 100, y: canvas_rect.height - 210 });
    }
    if(central_text){
        draw_text(central_text, {x: center.x - 200, y: center.y - 20 });
    }

    if(display_mouse_info)
        display_mouse_position();

    if(display_character_info)
        display_stats_of_pointed_character();

    if(is_enabled){ // Specific to editor mode.
        draw_text("---====::::  EDITOR MODE  ::::====---", {x: center.x - 200, y: 40 });
        display_editor_help();
    } else {
        display_help();

    }

    graphics.camera.end_in_screen_rendering();
}

function update(){

    if(input.keyboard.is_just_down(KEY.F1)){
        display_help_info = !display_help_info;
    }

    if(input.keyboard.is_just_down(KEY.F9)){
        display_mouse_info = !display_mouse_info;
    }

    if(input.keyboard.is_just_down(KEY.F10)){
        display_character_info = !display_character_info;
    }

    if(input.keyboard.is_just_down(KEY.M)){
        current_game_view.tile_grid.enable_grid_lines = !current_game_view.tile_grid.enable_grid_lines;
    }

    if(input.keyboard.is_just_down(KEY.F8)){

        if(current_game_view.enable_fog_of_war) {
            current_game_view.enable_fog_of_war = false;
            current_game_view.enable_tile_rendering_debug = true;
        } else {
            if(current_game_view.enable_tile_rendering_debug)
                current_game_view.enable_tile_rendering_debug = false;
            else {
                current_game_view.enable_fog_of_war = true;
            }
        }

    }

    if(input.keyboard.is_just_down(KEY.RIGHT_BRACKET)){
        current_game.turn_info.player_character.stats.view_distance.increase(1);
        current_game.turn_info.player_character.update_perception(current_game.world);
        current_game_view.fog_of_war.refresh(current_game.world);
        current_game_view._require_tiles_update = true;
    }

    if(input.keyboard.is_just_down(KEY.LEFT_BRACKET)){
        current_game.turn_info.player_character.stats.view_distance.decrease(1);
        current_game.turn_info.player_character.update_perception(current_game.world);
        current_game_view.fog_of_war.refresh(current_game.world);
        current_game_view._require_tiles_update = true;
    }

    if(input.keyboard.is_just_down(KEY.ESCAPE)){
        is_enabled = !is_enabled;
        if(is_enabled){
            // Just entered the editor!
            was_fog_of_war_activated = current_game_view.enable_fog_of_war;
            current_game_view.enable_tile_rendering_debug = false;
            current_game_view.enable_fog_of_war = false;
        } else {
            // Just exited the editor mode.
            // Make sure the changes are taken into account:
            play_action();
            current_game_view.enable_fog_of_war = was_fog_of_war_activated;
            current_game_view.enable_tile_rendering_debug = false;
        }
    }

    if (input.keyboard.is_just_down(KEY.DASH)) audio.setVolume('Master', null, -0.05);
    if (input.keyboard.is_just_down(KEY.EQUAL)) audio.setVolume('Master', null, 0.05);

    if (input.keyboard.is_just_down(KEY.O)) {
        audio.playEvent('buffertest', random_float(-1, 1));
    } else if (input.keyboard.is_just_released(KEY.O)) {
        audio.stopEvent('streamtest');
    }

    if(is_enabled)
        update_world_edition();
}