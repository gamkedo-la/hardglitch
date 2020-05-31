// This file handles input code specific to this game.

export { update }

import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import { current_game, current_game_view } from "./main.js";
import { Vector2_unit_x, Vector2_unit_y } from "./system/spatial.js";

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


function select_player_action(){
    const keyboard = input.keyboard;
    const mouse = input.mouse;
    const possible_actions = current_game.last_turn_info.possible_actions;

    if(keyboard.is_just_down(KEY_SPACE)) return possible_actions.wait;
    if(keyboard.is_down(KEY_UP_ARROW)) return possible_actions.move_north;
    if(keyboard.is_down(KEY_DOWN_ARROW)) return possible_actions.move_south;
    if(keyboard.is_down(KEY_RIGHT_ARROW)) return possible_actions.move_east;
    if(keyboard.is_down(KEY_LEFT_ARROW)) return possible_actions.move_west;

    if(mouse.buttons.is_just_released(input.MOUSE_BUTTON.LEFT)){ // Select an action which targets the square under the mouse.
        for(const action of Object.values(possible_actions)){
            if(action.target_position && action.target_position.equals(current_game_view.mouse_grid_position))
                return action;
        }
    }

    // EDITOR STYLE HACKS FOLLOWS:
    if(keyboard.is_just_down(KEY_LETTER_P))
    {
        remove_all_players();
        return possible_actions.wait;
    }
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

function update_camera_control(delta_time){
    const camera_speed = 1;
    const current_speed = camera_speed * delta_time;
    const keyboard = input.keyboard;

    if(keyboard.is_down(KEY_LETTER_A))
        graphics.camera.translate(Vector2_unit_x.multiply(-current_speed));
    if(keyboard.is_down(KEY_LETTER_D))
        graphics.camera.translate(Vector2_unit_x.multiply(current_speed));
    if(keyboard.is_down(KEY_LETTER_W))
        graphics.camera.translate(Vector2_unit_y.multiply(-current_speed));
    if(keyboard.is_down(KEY_LETTER_S))
        graphics.camera.translate(Vector2_unit_y.multiply(current_speed));
}

function update(delta_time){
    input.update(delta_time);

    update_camera_control(delta_time);

    // Only handle input from the player when it's "visible" that it's player's turn.
    if(current_game_view.is_time_for_player_to_chose_action){
        const player_action = select_player_action();

        if(player_action) // Player just selected an action
        {
            current_game.update_until_player_turn(player_action);
            current_game_view.interpret_turn_events(); // Starts showing each event one by one until it's player's turn.
        }
    }


  }



