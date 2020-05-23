// This file handles input code specific to this game.

export { on_player_input_in_game }

import * as input from "./system/input.js";
import { current_game, current_game_view } from "./main.js";
import * as concepts from "./core/concepts.js";

// TODO: add the system that changes the mouse icons here

// keyboard keycode constants, determined by printing out evt.keyCode from a key handler
const KEY_SPACE = 32;
const KEY_LEFT_ARROW = 37;
const KEY_UP_ARROW = 38;
const KEY_RIGHT_ARROW = 39;
const KEY_DOWN_ARROW = 40;
const KEY_LETTER_W = 87;
const KEY_LETTER_A = 65;
const KEY_LETTER_S = 83;
const KEY_LETTER_D = 68;
const KEY_LETTER_P = 80;


function select_player_action(keycode){

    const possible_actions = current_game.last_turn_info.possible_actions;
    let action = null;
    switch (keycode) {
        case KEY_SPACE:         { action = possible_actions.wait; break; }
        case KEY_UP_ARROW:      { action = possible_actions.move_north; break; }
        case KEY_DOWN_ARROW:    { action = possible_actions.move_south; break; }
        case KEY_RIGHT_ARROW:   { action = possible_actions.move_east; break; }
        case KEY_LEFT_ARROW:    { action = possible_actions.move_west; break; }
        // EDITOR STYLE HACKS FOLLOWS:
        case KEY_LETTER_P:      { remove_all_players(); action = possible_actions.wait; break; }
        default:
            break;
    }
    return action;
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

function on_player_input_in_game(event){
    // Only handle input from the player when it's "visible" that it's player's turn.
    if(current_game_view.is_time_for_player_to_chose_action){
        let player_action = select_player_action(event.keyCode);

        if(!player_action) // Unknown action: just skip until a valid action is selected.
            return;

        current_game.update_until_player_turn(player_action);
        current_game_view.interpret_turn_events(); // Starts showing each event one by one until it's player's turn.
    }
  }



