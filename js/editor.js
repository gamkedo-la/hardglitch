// This file contains debug utilities for working with this game.

export {
    DEBUG_TOOLS_ENABLED,
    is_enabled, is_editing,
    set_text, set_central_text,
    update, display, update_debug_keys, display_debug_info,
    begin_edition, end_edition,
    clear,
};

import * as concepts from "./core/concepts.js";
import * as audio from "./system/audio.js";
import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as tiles from "./definitions-tiles.js";
import * as items from "./definitions-items.js";
import * as ui from "./system/ui.js";

import { mouse_grid_position, mouse_game_position, KEY, play_action } from "./game-input.js";
import { Character } from "./core/character.js";
import { random_float } from "./system/utility.js";
import { GameSession } from "./game-session.js";
import { sprite_defs } from "./game-assets.js";
import { Vector2_origin, Vector2 } from "./system/spatial.js";
import { Grid } from "./system/grid.js";
import { all_characters_types } from "./deflinitions-characters.js";
import { grid_ID } from "./definitions-world.js";
import { serialize_world } from "./levels/level-tools.js";

const DEBUG_TOOLS_ENABLED = false; // Change to true to use the keys defined bellow.

let is_enabled = false; // TURN THIS ON TO SEE THE EDITOR, see the update() function below
let is_editing = false; // True if we are doing an edition manipulation and no other input should be handled.

let was_fog_of_war_activated = true;

let display_help_info = false;
let display_mouse_info = false;
let display_character_info = false;

let text_to_display = "";
let central_text = null;

function clear(){
    is_enabled = false;
    is_editing = false;
    was_fog_of_war_activated = true;
    display_help_info = false;
    display_mouse_info = false;
    display_character_info = false;
    text_to_display = "";
    central_text = null;
}

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

const text_x_from_right_border = 400;

function draw_text(text, position){
    if(!reused_text_line)
        reused_text_line = new ui.Text({
            text: "",
            font: "20px Verdana"
        });

    reused_text_line.position = position;
    reused_text_line.text = text;
    reused_text_line.update();
    reused_text_line.draw(graphics.screen_canvas_context);
}

function display_mouse_position(){

    let line = Math.round(graphics.canvas_rect().height / 2);
    function next_line(){
        return line += 30;
    }

    const display_x = graphics.canvas_rect().width - text_x_from_right_border;
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


function make_edit_operation_remove_any_entity_at(){
    return (game_session, position)=>{
        console.assert(game_session instanceof GameSession);
        console.assert(position);

        const removed_entities = game_session.world.remove_entity_at(position);
        if(removed_entities.length > 0){
            console.log(`REMOVED ${removed_entities.length} ENTITIES`);
            return true;
        }
        else
            return false;
    };
}

function make_edit_operation_add_entity_at(entity_type){
    console.assert(entity_type.prototype instanceof concepts.Entity);
    return (game_session, position) => {
        console.assert(game_session instanceof GameSession);
        console.assert(position);

        if(game_session.game.is_walkable(position)){
            const entity = new entity_type();
            entity.position = position;
            game_session.world.add_entity(entity);
            console.log(`ADDED ${entity.name} ENTITY`);
            return true;
        }
        else
            return false;
    };
}


function make_edit_operation_change_tile(tile_id, world_tile_grid_id){
    console.assert(Number.isInteger(tile_id) || tile_id === undefined);
    console.assert(Object.values(grid_ID).includes(world_tile_grid_id));
    return (game_session, position) => {
        console.assert(game_session instanceof GameSession);
        console.assert(position);

        const tile_grid = game_session.world.grids[world_tile_grid_id];
        console.assert(tile_grid instanceof Grid);
        if(tile_grid.get_at(position) != tile_id){
            tile_grid.set_at(tile_id, position);
            console.log(`CHANGE TILE TO ${tile_id} ENTITY`);
            return true;
        }
        else
            return false;
    };
}

let current_edit_action; // Function that will be called when we click on something IFF we selected an action.

class EditPaletteButton extends ui.Button {
    constructor(text, edit_action){
        console.assert(typeof text === "string");
        console.assert(edit_action === undefined || edit_action instanceof Function);

        super({
            position: Vector2_origin,
            sprite_def: sprite_defs.button_select_action,
            action: ()=> { this.on_selected(); },
            sounds:{
                over: 'EditorButtonHover',
                down: 'EditorButtonClick',
            }
        });

        this.helptext = new ui.HelpText({
            text: text,
            area_to_help: this.area,
            delay_ms: 0,
        });

        this._edit_action = edit_action;

    }

    on_selected(){
        edition_palette.unlock_buttons();
        this.enabled = false;
        current_edit_action = this._edit_action;
        console.log(`EDITOR PALETTE BUTTON SELECTED : ${this.text}`);
    }

    get position() { return super.position; }
    set position(new_pos) {
        super.position = new_pos;
        this.helptext.area_to_help = this.area;
    }

    get text() { return this.helptext.text; }

};

class EditionPaletteUI {

    button_no_selection = new EditPaletteButton("No Selection");
    button_remove_surface_tile = new EditPaletteButton("Remove Surface Tile", make_edit_operation_change_tile(undefined, grid_ID.surface));
    button_remove_entity = new EditPaletteButton("Remove Entity", make_edit_operation_remove_any_entity_at());

    constructor(game_session){
        console.assert(game_session instanceof GameSession);

        this.palette_buttons = [];

        // Fill our palette with buttons!
        this.palette_buttons.push( ...tiles.floor_tiles.map(tile_id => {
            return new EditPaletteButton(`Floor Tile: ${tiles.defs[tile_id].description} (${tile_id})`, make_edit_operation_change_tile(tile_id, grid_ID.floor));
        }), null);

        this.palette_buttons.push( ...tiles.surface_tiles.map(tile_id => {
            return new EditPaletteButton(`Surface Tile: ${tiles.defs[tile_id].description} (${tile_id})`, make_edit_operation_change_tile(tile_id, grid_ID.surface));
        }), null);

        this.palette_buttons.push( ...items.all_item_types().map(item_type => {
            return new EditPaletteButton(`Item: ${new item_type().name}`, make_edit_operation_add_entity_at(item_type));
        }), null);

        this.palette_buttons.push( ...all_characters_types().map(character_type => {
            return new EditPaletteButton(`Character: ${new character_type().name}`, make_edit_operation_add_entity_at(character_type));
        }), null);


        // Place all the palette buttons in columns.
        const button_palette_top_left = new Vector2({ x: 20, y: 100 });

        const buttons_per_column = 8;
        const column_width = this.button_no_selection.width /*+ 4*/;
        const row_height = this.button_no_selection.height /*+ 4*/;
        const initial_position = button_palette_top_left.translate({ x: 0, y: 100 });
        let next_button_x = initial_position.x;
        let next_button_y = initial_position.y;
        let buttons_column_count = 0;
        const next_column = ()=> {
            next_button_x += column_width;
            next_button_y = initial_position.y;
            buttons_column_count = 0;
        };
        const next_button_position = ()=>{
            const new_position = { x: next_button_x, y: next_button_y };
            ++buttons_column_count;
            if(buttons_column_count > 1 && buttons_column_count % buttons_per_column === 0){
                next_column();
            } else {
                next_button_y += row_height;
            }
            return new_position;
        };

        this.palette_buttons
            .forEach(palette_button => {
                if(palette_button)
                    palette_button.position = next_button_position();
                else
                    next_column();
            });


        // Make sure these buttons are over all the buttons.
        const vertical_space_between_special_buttons_and_other_buttons = 60;
        const initial_special_buttons_position = button_palette_top_left;
        let x_special_button = 0;
        const next_special_button_position = ()=>{
            const new_position = initial_special_buttons_position.translate({ x: x_special_button, y: 0 });
            x_special_button += this.button_no_selection.width;
            return new_position;
        };
        this.button_remove_surface_tile.position = next_special_button_position();
        this.button_remove_entity.position = next_special_button_position();
        this.button_no_selection.position = next_special_button_position();
        this.palette_buttons.push(this.button_remove_surface_tile, this.button_remove_entity, this.button_no_selection);

        // Place the help text always at the same relative position:
        const help_text_position = initial_special_buttons_position.translate({ x: 0, y: vertical_space_between_special_buttons_and_other_buttons });
        this.palette_buttons
            .filter(button=>button)
            .forEach(palette_button => { palette_button.helptext.position = help_text_position; });

        this.palette_buttons = this.palette_buttons.filter(button=>button);
    }

    update(delta_time){
        this.palette_buttons.forEach(palette_button =>  palette_button.update(delta_time));
    }

    display(canvas_context){
        graphics.camera.begin_in_screen_rendering();
        this.palette_buttons.forEach(palette_button =>  palette_button.draw(canvas_context));
        graphics.camera.end_in_screen_rendering();
    }

    unlock_buttons(){
        this.palette_buttons.forEach(palette_button=> palette_button.enabled = true);
    }

    unselect_edit_action(){
        this.button_no_selection.on_selected();
    }

    get is_mouse_over(){
        return this.palette_buttons.some(button=> button.is_mouse_over)
            || Object.values(this).filter(element => element instanceof ui.UIElement)
                .some(uielement => uielement.is_mouse_over)
            ;
    }

};

let edition_palette;

function update_world_edition(game_session, delta_time){
    console.assert(game_session instanceof GameSession);
    console.assert(typeof delta_time === "number");
    console.assert(edition_palette instanceof EditionPaletteUI);
    // TODO: use a map of input pattern => action

    edition_palette.update(delta_time);

    is_editing = false;

    const mouse_grid_pos = mouse_grid_position();

    if(current_edit_action){
        is_editing = !input.keyboard.is_down(KEY.SPACE); // Allow grabbing the camera if [SPACE] is pressed.

        if(is_editing
        && mouse_grid_pos !== undefined
        && !edition_palette.is_mouse_over
        && input.mouse.buttons.is_down(input.MOUSE_BUTTON.LEFT)){
            const world_was_edited = current_edit_action(game_session, mouse_grid_pos);
            if(world_was_edited)
                game_session.view.notify_edition();
        }

        if(input.keyboard.is_just_down(KEY.TAB)){
            edition_palette.unselect_edit_action();
        }

    }
}

function help_text_top_left(){
    return new Vector2({x: graphics.canvas_rect().width - 600, y: 34 });
}

function display_help(game_session){
    console.assert(game_session instanceof GameSession);

    const display_x = help_text_top_left().x;

    let line = help_text_top_left().y;
    function next_line(){
        const new_value = line;
        line += 30;
        return new_value;
    }


    draw_text("[F1]  - HELP", {x: display_x, y: next_line() });

    if(!display_help_info)
        return;

    const is_selecting_action_target = game_session.view.ui.is_selecting_action_target;
    if(!is_selecting_action_target){
        draw_text("[TAB]  - MENU", {x: display_x, y: next_line() });
    }

    if(is_selecting_action_target){
        draw_text("[TAB] - CANCEL TARGET SELECTION", {x: display_x, y: next_line() });
    } else {
        if(game_session.view.is_time_for_player_to_chose_action
        && !input.mouse.is_dragging
        )
            draw_text("[F2] - EDITOR MODE", {x: display_x, y: next_line() });
    }
    draw_text("[F3]  - ENABLE/DISABLE PARALELL ANIMS", {x: display_x, y: next_line() });
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
    draw_text(`AUTO CAMERA CENTER = ${game_session.view.enable_auto_camera_center ? "enabled" : "disabled"}`, {x: display_x, y: next_line() });
    draw_text(`PARALLEL ANIMATIONS = ${game_session.view.enable_parallel_animations ? "enabled" : "disabled"}`, {x: display_x, y: next_line() });
    next_line();
    draw_text(`TURN: ${game_session.game.turn_info.turn_id}`, {x: display_x, y: next_line() });


}

function display_editor_help(){
    const canvas_rect = graphics.canvas_rect();

    const top_left = help_text_top_left();
    const display_x = top_left.x;

    let line = top_left.y;
    function next_line(){
        const new_value = line;
        line += 30;
        return new_value;
    }


    if(!input.mouse.is_dragging)

    draw_text("[F1]  - HELP", {x: display_x, y: next_line() });

    if(current_edit_action){
        draw_text("[F2] - EXIT EDITOR MODE", {x: display_x, y: next_line() });
        draw_text("[TAB] - DESELECT EDIT ACTION", {x: display_x, y: next_line() });
        draw_text("[SPACE] TO DRAG THE CAMERA", {x: display_x, y: next_line() });
    } else {
        draw_text("[F2] OR [TAB] - EXIT EDITOR MODE", {x: display_x, y: next_line() });
    }

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

function display_stats_of_pointed_character(game_session){
    console.assert(game_session instanceof GameSession);

    const center = graphics.canvas_center_position();
    const stats_x = center.x;
    let line = center.y;
    function next_line(){
        return line += 30;
    }

    draw_text("CHARACTER INFO:", { x: stats_x, y: next_line() });
    const mouse_grid_pos = mouse_grid_position();
    if(!mouse_grid_pos)
        return;

    const character = game_session.world.body_at(mouse_grid_pos);
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
        draw_text(` - ${stat_name} = ${stat.value}${stat.max ? ` / ${stat.max}` : ""} ${stat.accumulated_modifiers !== 0 ? `(real = ${stat.real_value}, mod = ${stat.accumulated_value_modifiers})` : ""}${stat.min? ` [min = ${stat.min}]` : ""}`, { x: stats_x, y: next_line() });
    }

    line = stats_line;
    const inventory_x = 400;
    draw_text(`INVENTORY:`, { x: inventory_x, y: stats_line });
    character.inventory.stored_items.filter(item => item !== undefined)
        .forEach(item => {
            draw_text(` - ${item.name}`, { x: inventory_x, y: next_line() });
        });

}

function display_debug_info(game_session){
    console.assert(game_session instanceof GameSession);
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
        display_stats_of_pointed_character(game_session);

    if(is_enabled){ // Specific to editor mode.
        draw_text("---====::::  EDITOR MODE  ::::====---", {x: center.x - 200, y: 4 });
        display_editor_help();
    } else if(DEBUG_TOOLS_ENABLED === true) {
        display_help(game_session);
    }

    graphics.camera.end_in_screen_rendering();
}

function display(game_session){
    display_debug_info(game_session);

    if(edition_palette){
        edition_palette.display(graphics.screen_canvas_context);
    }
}

function update_debug_keys(game_session){
    console.assert(game_session instanceof GameSession);

    const ongoing_target_selection = game_session.view.ui.is_selecting_action_target;
    if(ongoing_target_selection
    || !game_session.view.is_time_for_player_to_chose_action
    || input.mouse.is_dragging
    )
        return;


    if (input.keyboard.is_just_down(KEY.F4)) { // Log the state of the world (for level edition).
        export_world(game_session.world);
    }

    if(!is_enabled && DEBUG_TOOLS_ENABLED === false) // All the keys bellow are only active if debug tools are enabled.
        return;

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
        game_session.view.tile_grid.enable_grid_lines = !game_session.view.tile_grid.enable_grid_lines;
    }

    if(input.keyboard.is_just_down(KEY.F8)){

        if(game_session.view.enable_fog_of_war) {
            game_session.view.enable_fog_of_war = false;
            game_session.view.enable_tile_rendering_debug = true;
        } else {
            if(game_session.view.enable_tile_rendering_debug)
                game_session.view.enable_tile_rendering_debug = false;
            else {
                game_session.view.enable_fog_of_war = true;
            }
        }

    }

    if(input.keyboard.is_just_down(KEY.RIGHT_BRACKET)){
        game_session.game.turn_info.player_character.stats.view_distance.increase(1);
        game_session.game.turn_info.player_character.update_perception(game_session.world);
        game_session.view.fog_of_war.refresh(game_session.world);
        game_session.view._require_tiles_update = true;
    }

    if(input.keyboard.is_just_down(KEY.LEFT_BRACKET)){
        game_session.game.turn_info.player_character.stats.view_distance.decrease(1);
        game_session.game.turn_info.player_character.update_perception(game_session.world);
        game_session.view.fog_of_war.refresh(game_session.world);
        game_session.view._require_tiles_update = true;
    }

    if (input.keyboard.is_just_down(KEY.DASH)) audio.setVolume('Master', null, -0.05);
    if (input.keyboard.is_just_down(KEY.EQUAL)) audio.setVolume('Master', null, 0.05);

    if (input.keyboard.is_just_down(KEY.O)) {
        audio.playEvent('buffertest', random_float(-1, 1));
    } else if (input.keyboard.is_just_released(KEY.O)) {
        audio.stopEvent('streamtest');
    }

    if (input.keyboard.is_just_down(KEY.F3)) {
        game_session.view.enable_parallel_animations = !game_session.view.enable_parallel_animations;
    }

}

function update(game_session, delta_time){
    update_debug_keys(game_session);
    if(is_enabled)
        update_world_edition(game_session, delta_time);
}

function begin_edition(game_session){
    console.assert(game_session instanceof GameSession);

    game_session.view.enable_edition = true;

    edition_palette = new EditionPaletteUI(game_session);
    edition_palette.unselect_edit_action(); // No palette button selected by default.

    is_enabled = true;

    was_fog_of_war_activated = game_session.view.enable_fog_of_war;
    game_session.view.enable_tile_rendering_debug = false;
    game_session.view.enable_fog_of_war = false;
}

function end_edition(game_session){
    // Make sure the changes are taken into account:
    play_action();
    game_session.view.enable_fog_of_war = was_fog_of_war_activated;
    game_session.view.enable_tile_rendering_debug = false;
    game_session.view.enable_edition = false;
    game_session.view.refresh();
    game_session.view.clear_turn_message();

    current_edit_action = undefined;
    edition_palette = undefined;

    is_enabled = false;
}

function export_world(world){
    console.assert(world instanceof concepts.World);

    console.log("WORLD EXPORT:");
    console.log(serialize_world(world));

}