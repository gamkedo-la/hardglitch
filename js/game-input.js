// This file handles input code specific to this game.

export {
    KEY,
    update,
    game_position_from_graphic_position,
    mouse_game_position,
    mouse_grid_position,
    mouse_is_pointing_walkable_position,
    play_action,
}

import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as editor from "./editor.js";
import { current_game, current_game_view } from "./main.js";
import { Vector2_unit_x, Vector2_unit_y, Vector2 } from "./system/spatial.js";
import * as concepts from "./core/concepts.js";

// TODO: add the system that changes the mouse icons here

// keyboard keycode constants, determined by printing out evt.keyCode from a key handler
const KEY = {
    SPACE: 32,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    LEFT_CTRL:17,
    ESCAPE:27,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    P: 80,
    M: 77,
    N: 78,
    C: 67,
    X: 88,
    NUMBER_0: 48,
    NUMBER_1: 49,
    NUMBER_2: 50,
    NUMBER_3: 51,
    NUMBER_4: 52,
    RIGHT_BRACKET: 221,
    LEFT_BRACKET: 219,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
};

// Returns the pixel position inside the game space (taking into acount the camera).
function game_position_from_graphic_position(graphic_position){
    console.assert(graphic_position instanceof Vector2);
    return graphic_position.translate(graphics.camera.position);
}

// Returns the pixel position pointed by the mouse when taking into account the camera.
function mouse_game_position(){
    return game_position_from_graphic_position(input.mouse.position);
}

// Returns the position of the mouse on the grid if pointing it,
// returns undefined if the mouse isn't pointing on the grid.
function mouse_grid_position(){
    if(!current_game_view)
        return undefined;
    return current_game_view.grid_position(mouse_game_position());
}

function mouse_is_pointing_walkable_position(){
    const mouse_grid_pos = mouse_grid_position();
    if(mouse_grid_pos)
        return current_game.is_walkable(mouse_grid_pos);
    else
        return false;
}

let mouse_was_dragging_last_update = true;

function select_player_action(){
    const keyboard = input.keyboard;
    const mouse = input.mouse;
    const possible_actions = current_game.last_turn_info.possible_actions;

    if(keyboard.is_just_down(KEY.SPACE)) return possible_actions.wait;
    if(keyboard.is_down(KEY.UP_ARROW)) return possible_actions.move_north;
    if(keyboard.is_down(KEY.DOWN_ARROW)) return possible_actions.move_south;
    if(keyboard.is_down(KEY.RIGHT_ARROW)) return possible_actions.move_east;
    if(keyboard.is_down(KEY.LEFT_ARROW)) return possible_actions.move_west;

    if(mouse.buttons.is_just_released(input.MOUSE_BUTTON.LEFT) && !mouse_was_dragging_last_update){ // Select an action which targets the square under the mouse.
        const clicked_position = mouse_grid_position();
        if(clicked_position) {
            for(const action of Object.values(possible_actions)){
                if(action.is_basic
                && action.is_safe
                && action.target_position
                && action.target_position.equals(clicked_position))
                    return action;
            }
        }
    }

    mouse_was_dragging_last_update = false;
}

let draggin_start_camera_position = undefined;

function update_camera_control(delta_time){
    const camera_speed = 1;
    const current_speed = camera_speed * delta_time;
    const keyboard = input.keyboard;

    const drag_pos = input.mouse.dragging_positions;
    if(input.mouse.is_dragging
    && !current_game_view.ui.is_under(drag_pos.begin) // Don't drag the camera if we are manipulating UI
    && !editor.is_editing // Don't drag when we are editing the world with the editor
    ){
        // Map dragging
        if(!draggin_start_camera_position){
            draggin_start_camera_position = graphics.camera.position;
            mouse_was_dragging_last_update = true;
        }
        graphics.camera.position = draggin_start_camera_position.translate(game_position_from_graphic_position(drag_pos.begin).substract(mouse_game_position()));

    } else {
        draggin_start_camera_position = undefined;

        if(keyboard.is_down(KEY.A))
            graphics.camera.translate(Vector2_unit_x.multiply(-current_speed));
        if(keyboard.is_down(KEY.D))
            graphics.camera.translate(Vector2_unit_x.multiply(current_speed));
        if(keyboard.is_down(KEY.W))
            graphics.camera.translate(Vector2_unit_y.multiply(-current_speed));
        if(keyboard.is_down(KEY.S))
            graphics.camera.translate(Vector2_unit_y.multiply(current_speed));
    }
}

// Play an action from the actions possible for the current player character.
// Once the action is played we proceed to execute each character turns until we reach a player's turn again.
// If the action is null or undefined, we simply update the possible actions and don't progress turns.
function play_action(player_action){
    console.assert(current_game_view.is_time_for_player_to_chose_action === true);
    console.assert(!player_action || player_action instanceof concepts.Action);
    console.assert(!player_action || Object.values(current_game.last_turn_info.possible_actions).includes(player_action)); // The action MUST come from the possible actions.

    current_game.update_until_player_turn(player_action);
    current_game_view.interpret_turn_events(); // Starts showing each event one by one until it's player's turn.
}


function update(delta_time){
    input.update(delta_time);

    if(current_game_view){
        update_camera_control(delta_time);

        // Only handle input from the player when it's "visible" that it's player's turn.
        if(!input.mouse.is_dragging
        && current_game_view.is_time_for_player_to_chose_action
        && !current_game_view.ui.is_mouse_over
        && !current_game_view.ui.is_selecting_action_target
        && !editor.is_enabled
        ){
            const player_action = select_player_action();

            if(player_action && player_action.is_safe){ // Player just selected an action (only safe ones are considered)
                play_action(player_action);
            }
        }
    }

    if(input.keyboard.is_just_down(KEY.M)){
        current_game_view.tile_grid.enable_grid_lines = !current_game_view.tile_grid.enable_grid_lines;
    }

    if(input.keyboard.is_just_down(KEY.F8)){
        current_game_view.enable_fog_of_war = !current_game_view.enable_fog_of_war;
    }

    if(input.keyboard.is_just_down(KEY.RIGHT_BRACKET)){
        current_game.last_turn_info.player_character.view_distance = current_game.last_turn_info.player_character.view_distance + 1;
        current_game_view.fog_of_war._refresh();
    }

    if(input.keyboard.is_just_down(KEY.LEFT_BRACKET)){
        current_game.last_turn_info.player_character.view_distance = current_game.last_turn_info.player_character.view_distance - 1;
        current_game_view.fog_of_war._refresh();
    }
}



