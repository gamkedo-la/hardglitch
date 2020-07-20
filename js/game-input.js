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

import { config } from "./game-config.js";
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
    F: 70,
    P: 80,
    M: 77,
    N: 78,
    C: 67,
    X: 88,
    I: 73,
    K: 75,
    J: 74,
    L: 76,
    NUMBER_0: 48,
    NUMBER_1: 49,
    NUMBER_2: 50,
    NUMBER_3: 51,
    NUMBER_4: 52,
    NUMBER_5: 53,
    NUMBER_6: 54,
    NUMBER_7: 55,
    NUMBER_8: 56,
    NUMBER_9: 57,
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

// Keys mapped to action buttons
const action_button_keys = [
    KEY.SPACE,
    KEY.NUMBER_1,
    KEY.NUMBER_2,
    KEY.NUMBER_3,
    KEY.NUMBER_4,
    KEY.NUMBER_5,
    KEY.NUMBER_6,
    KEY.NUMBER_7,
    KEY.NUMBER_8,
    KEY.NUMBER_9,
    KEY.NUMBER_0,
];

function select_player_action(){
    const keyboard = input.keyboard;
    const mouse = input.mouse;
    const possible_actions = current_game.turn_info.possible_actions;

    for(let key_num = 0; key_num < action_button_keys.length; ++key_num){
        if(keyboard.is_just_down(action_button_keys[key_num])){
            current_game_view.ui.play_action_button(key_num);
            break; // Skip all the other action buttons keys
        }
    }

    if(keyboard.is_down(KEY.W) || keyboard.is_down(KEY.UP_ARROW)) return possible_actions.move_north;
    if(keyboard.is_down(KEY.S) || keyboard.is_down(KEY.DOWN_ARROW)) return possible_actions.move_south;
    if(keyboard.is_down(KEY.D) || keyboard.is_down(KEY.RIGHT_ARROW)) return possible_actions.move_east;
    if(keyboard.is_down(KEY.A) || keyboard.is_down(KEY.LEFT_ARROW)) return possible_actions.move_west;

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


    if(keyboard.is_just_down(KEY.F)){
        current_game_view.enable_auto_camera_center = !current_game_view.enable_auto_camera_center;
        if(current_game_view.enable_auto_camera_center){
            current_game_view.center_on_player_if_too_far();
        }
    }

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

        if(keyboard.is_down(KEY.J))
            graphics.camera.translate(Vector2_unit_x.multiply(-current_speed));
        if(keyboard.is_down(KEY.L))
            graphics.camera.translate(Vector2_unit_x.multiply(current_speed));
        if(keyboard.is_down(KEY.I))
            graphics.camera.translate(Vector2_unit_y.multiply(-current_speed));
        if(keyboard.is_down(KEY.K))
            graphics.camera.translate(Vector2_unit_y.multiply(current_speed));
    }
}

// Play an action from the actions possible for the current player character.
// Once the action is played we proceed to execute each character turns until we reach a player's turn again.
// If the action is null or undefined, we simply update the possible actions and don't progress turns.
function play_action(player_action){
    console.assert(current_game_view.is_time_for_player_to_chose_action === true);
    console.assert(!player_action || player_action instanceof concepts.Action);
    console.assert(!player_action || Object.values(current_game.turn_info.possible_actions).includes(player_action)); // The action MUST come from the possible actions.

    editor.set_text("PROCESSING TURNS...");
    const event_sequence = current_game.update_until_player_turn(player_action);
    current_game_view.interpret_turn_events(event_sequence); // Starts showing each event one by one until it's player's turn.
}


function update(delta_time){
    input.update(delta_time);

    if(input.keyboard.is_just_down(KEY.F7))
        config.enable_particles = !config.enable_particles;

    if(current_game_view){
        update_camera_control(delta_time);

        if(current_game_view.ui.is_selecting_action_target){
            // When we already are in action target selection mode, re-selecting an action through the keys is like a cancel.
            if(action_button_keys.some(key => input.keyboard.is_just_down(key)))
                current_game_view.ui.cancel_action_target_selection();

        } else {
            // Only handle input from the player when it's "visible" that it's player's turn.
            if(!input.mouse.is_dragging
            && current_game_view.is_time_for_player_to_chose_action
            && !current_game_view.ui.is_mouse_over
            && !editor.is_enabled
            ){
                const player_action = select_player_action();

                if(player_action && player_action.is_safe){ // Player just selected an action (only safe ones are considered)
                    play_action(player_action);
                }
            }
        }
    }
}



