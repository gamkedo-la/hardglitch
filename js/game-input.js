// This file handles input code specific to this game.

export { on_player_input_in_game }

import * as input from "./system/input.js";
import { current_game, current_game_view } from "./main.js"

// TODO: add the system that changes the mouse icons here

// keyboard keycode constants, determined by printing out evt.keyCode from a key handler
const KEY_LEFT_ARROW = 37;
const KEY_UP_ARROW = 38;
const KEY_RIGHT_ARROW = 39;
const KEY_DOWN_ARROW = 40;
const KEY_LETTER_W = 87;
const KEY_LETTER_A = 65;
const KEY_LETTER_S = 83;
const KEY_LETTER_D = 68;


function select_player_action(keycode){

    const possible_actions = current_game.last_turn_info.possible_actions;
    let action = null;
    switch (keycode) {
        case KEY_UP_ARROW:      { action = possible_actions.move_north; break; }
        case KEY_DOWN_ARROW:    { action = possible_actions.move_south; break; }
        case KEY_RIGHT_ARROW:   { action = possible_actions.move_east; break; }
        case KEY_LEFT_ARROW:    { action = possible_actions.move_west; break; }
        default:
            break;
    }
    if(!action){
        action = possible_actions.wait;
    }
    return action;
}


function on_player_input_in_game(event){
    // Only handle input from the player when it's "visible" that it's player's turn.
    if(current_game_view.is_time_for_player_to_chose_action){
        let player_action = select_player_action(event.keyCode);
        current_game.update_until_player_turn(player_action);
        current_game_view.interpret_turn_events(); // Starts showing each event one by one until it's player's turn.
    }
  }



