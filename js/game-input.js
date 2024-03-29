// This file handles input code specific to this game.

export {
    KEY,
    cursors,
    update,
    game_position_from_graphic_position,
    mouse_game_position,
    mouse_grid_position,
    play_action,
    begin_game,
    end_game,
}

import * as debug from "./system/debug.js";
import { config } from "./game-config.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import { Vector2_unit_x, Vector2_unit_y, Vector2 } from "./system/spatial.js";
import * as concepts from "./core/concepts.js";
import { Game } from "./game.js";
import { GameView } from "./game-view.js";
import { GameSession } from "./game-session.js";
import { Move } from "./rules/rules-movement.js";

let current_game;
let current_game_view;

const cursors = {
    pointer_cursor: "images/mousecursor_pointer_small.png",
    hand_cursor_open: "images/hand_open2_small.png",
    hand_cursor_closed: "images/hand_closed2_small.png",
};

Object.values(cursors).forEach(pointer_url=> input.set_cursor(pointer_url)); // This is to pre-load the mouse cursors.
input.set_cursor(cursors.pointer_cursor); // We can do that from the beginning because the cursor system doesn't depend on the asset loading being finished.



// keyboard keycode constants, determined by printing out evt.keyCode from a key handler
const KEY = {
    SPACE: 32,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    LEFT_CTRL:17,
    ESCAPE:27,
    ENTER: 13,
    TAB: 9,
    W: 87,
    A: 65,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    S: 83,
    X: 88,
    Z: 90,
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
    DASH: 189,
    EQUAL: 187,
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

    PAD_0: 96,
    PAD_1: 97,
    PAD_2: 98,
    PAD_3: 99,
    PAD_4: 100,
    PAD_5: 101,
    PAD_6: 102,
    PAD_7: 103,
    PAD_8: 104,
    PAD_9: 105,

};

// Returns the pixel position inside the game space (taking into acount the camera).
function game_position_from_graphic_position(graphic_position){
    debug.assertion(()=>graphic_position instanceof Vector2);
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
    debug.assertion(()=>!current_game_view.ui.is_selecting_action_target);

    const keyboard = input.keyboard;
    const mouse = input.mouse;
    const possible_actions = current_game.turn_info.possible_actions;

    for(let key_num = 0; key_num < action_button_keys.length; ++key_num){
        if(keyboard.is_just_down(action_button_keys[key_num])){
            current_game_view.ui.play_action_button(key_num);
            break; // Skip all the other action buttons keys
        }
    }

    let default_action_through_keyboard;
    if(keyboard.is_down(KEY.W) || keyboard.is_down(KEY.UP_ARROW)    || keyboard.is_down(KEY.PAD_8)) default_action_through_keyboard = possible_actions.default_north;
    if(keyboard.is_down(KEY.S) || keyboard.is_down(KEY.DOWN_ARROW)  || keyboard.is_down(KEY.PAD_2) || keyboard.is_down(KEY.PAD_5)) default_action_through_keyboard = possible_actions.default_south;
    if(keyboard.is_down(KEY.D) || keyboard.is_down(KEY.RIGHT_ARROW) || keyboard.is_down(KEY.PAD_6)) default_action_through_keyboard = possible_actions.default_east;
    if(keyboard.is_down(KEY.A) || keyboard.is_down(KEY.LEFT_ARROW)  || keyboard.is_down(KEY.PAD_4))  default_action_through_keyboard = possible_actions.default_west;
    if(keyboard.is_down(KEY.Q) || keyboard.is_down(KEY.PAD_7))  default_action_through_keyboard = possible_actions.default_north_west;
    if(keyboard.is_down(KEY.E) || keyboard.is_down(KEY.PAD_9))  default_action_through_keyboard = possible_actions.default_north_east;
    if(keyboard.is_down(KEY.Z) || keyboard.is_down(KEY.PAD_1))  default_action_through_keyboard = possible_actions.default_south_west;
    if(keyboard.is_down(KEY.C) || keyboard.is_down(KEY.PAD_3))  default_action_through_keyboard = possible_actions.default_south_east;
    if(default_action_through_keyboard instanceof concepts.Action
    && (!(default_action_through_keyboard instanceof Move) || default_action_through_keyboard.is_safe) // Using the keyboard, it's too easy to walk into unsafe places, so we don't allow it. It can be done with the mouse though.
    ){
        return default_action_through_keyboard;
    }

    if(!mouse_was_dragging_last_update
    ){
        const mouse_pointed_position = mouse_grid_position();
        if(mouse_pointed_position) {
            for(const action of Object.values(possible_actions)){
                if(action.target_position
                && action.target_position.equals(mouse_pointed_position)
                && action.is_basic
                // && action.is_safe // it's ok, players will decide if it's safe.
                ){
                    // Pointing a basic action or pointing because we are selecting an action target.
                    input.set_cursor(cursors.pointer_cursor);

                    // Select a basic action which targets the square under the mouse.
                    if(mouse.buttons.is_just_released(input.MOUSE_BUTTON.LEFT)){
                        return action;
                    }
                }
            }
        }
    }

    mouse_was_dragging_last_update = false;
}

let draggin_start_camera_position = undefined;

function update_camera_control(delta_time, allow_camera_dragging){
    const camera_speed = 1;
    const current_speed = camera_speed * delta_time;
    const keyboard = input.keyboard;

    if(current_game_view.player_character) {

        let player_character_view = current_game_view.get_entity_view(current_game_view.player_character.id);
        if(player_character_view != null && graphics.camera.center_position.distance(player_character_view.position) > 128){
            current_game_view.request_focus_message_draw();
        }

        if(keyboard.is_just_down(KEY.F)){
            current_game_view.focus_on_current_player_character(true);
        }
    }

    const drag_pos = input.mouse.dragging_positions;
    if(input.mouse.is_dragging
    && !current_game_view.ui.is_under(drag_pos.begin) // Don't drag the camera if we are manipulating UI
    && allow_camera_dragging
    ){
        // Map dragging
        current_game_view.camera_control.stop();
        if(!draggin_start_camera_position){
            draggin_start_camera_position = graphics.camera.position;
            mouse_was_dragging_last_update = true;
        }
        graphics.camera.position = draggin_start_camera_position.translate(game_position_from_graphic_position(drag_pos.begin).substract(mouse_game_position()));

        input.set_cursor(cursors.hand_cursor_closed);
    } else {
        draggin_start_camera_position = undefined;

        if(current_game_view.ui.is_mouse_over
        || current_game_view.ui.is_selecting_action_target
        || current_game.is_game_finished
        ){
            input.set_cursor(cursors.pointer_cursor);
        } else if(input.mouse.buttons.is_down(input.MOUSE_BUTTON.LEFT)){
            input.set_cursor(cursors.hand_cursor_closed);
        } else {
            input.set_cursor(cursors.hand_cursor_open);
        }


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
    debug.assertion(()=>current_game_view.is_time_for_player_to_chose_action === true);
    debug.assertion(()=>!player_action || player_action instanceof concepts.Action);
    debug.assertion(()=>!player_action || player_action.is_generated || Object.values(current_game.turn_info.possible_actions).includes(player_action)); // The action MUST come from the possible actions.

    const event_sequence = current_game.update_until_player_turn(player_action);
    current_game_view.interpret_turn_events(event_sequence); // Starts showing each event one by one until it's player's turn.
}


function begin_game(game_session){
    debug.assertion(()=>game_session instanceof GameSession);
    current_game = game_session.game;
    current_game_view = game_session.view;
}

function end_game(){
    current_game = undefined;
    current_game_view = undefined;
}


function update(delta_time, input_config){
    debug.assertion(()=>input_config instanceof Object);
    debug.assertion(()=>current_game instanceof Game);
    debug.assertion(()=>current_game_view instanceof GameView);

    if(input.keyboard.is_just_down(KEY.F7))
        config.enable_particles = !config.enable_particles;

    if(input.keyboard.is_just_down(KEY.LEFT_CTRL))
        config.enable_view_healthbars = !config.enable_view_healthbars;

    if(current_game_view){
        update_camera_control(delta_time, input_config.is_camera_dragging_allowed);

        if(current_game_view.ui.is_selecting_action_target){
            // When we already are in action target selection mode, re-selecting an action through the keys is like a cancel.
            if(action_button_keys.some(key => input.keyboard.is_just_down(key)))
                current_game_view.ui.cancel_action_target_selection();

        } else {
            // Only handle input from the player when it's "visible" that it's player's turn.
            if(!input.mouse.is_dragging && !input.mouse.was_dragging
            && current_game_view.is_time_for_player_to_chose_action
            && (config.enable_keyboard_input_when_mouse_over_ui || !current_game_view.ui.is_mouse_over)
            && input_config.is_player_action_allowed
            ){
                const player_action = select_player_action();

                if(player_action /*&& player_action.is_safe8*/){ // Player just selected an action (only safe ones are considered - NOT)
                    play_action(player_action);
                }
            }
        }
    } else {
        input.set_cursor(cursors.pointer_cursor);
    }
}


