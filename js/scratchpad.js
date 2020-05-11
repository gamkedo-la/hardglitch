// This is where Klaim test some ideas.

export { make_test_world, next_update };

import { current_game } from "./main.js";
import * as concepts from "./core/concepts.js";
import { Wait, BasicRules } from "./rules/rules-basic.js";
import { MovementRules } from "./rules/rules-movement.js";
import {random_sample, random_int} from "./system/utility.js";

class SomeAI extends concepts.Agent {

    decide_next_action(possible_actions) {
        // Just picking a random action is a perfectly valid strategy, lol
        let random_action = random_sample(Object.values(possible_actions));
        if(random_action == null) { // no action found.
            // In this case just wait:
            return new Wait();
        }
        return random_action;
    }
};

class Enemy extends SomeAI {
    constructor(body){
        super();
        this.body = body;
    }
};

class PlayerBody extends concepts.Body {
    constructor(){
        super();
    }
}


const player = new concepts.Player();

function make_test_world(){
    const world = new concepts.World();

    world.add( new BasicRules() );
    world.add( new MovementRules() );

    player.body = new PlayerBody();
    world.add(player);
    world.add(player.body);

    for(let i = 0; i < 10; ++i){
        const enemy_body = new concepts.Body();
        const enemy =  new Enemy(enemy_body);
        enemy_body.position.x = random_int(0, 10);
        enemy_body.position.y = random_int(0, 10);
        world.add(enemy);
        world.add(enemy_body);
    }

    return world;
}

function select_player_action(keycode){
    const possible_actions = current_game.last_turn_info.possible_actions;
    const KEY_LEFT_ARROW = 37;
    const KEY_UP_ARROW = 38;
    const KEY_RIGHT_ARROW = 39;
    const KEY_DOWN_ARROW = 40;
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

function next_update(event){
    let player_action = select_player_action(event.keyCode);
    current_game.update_until_player_turn(player_action);
}

// entity = {          // every field is optional
//     id : {},        // id that will be associated to the components
//     graphics : {},  // component, name is type
//     audio : {},     // component, name is type
//     actor : {},     // component, name is type
//     body : {},      // component, name is type

// }

// system = {
//     required_components : ["graphics", "audio"],
//     update : function(world, graphics, audio){   }
// }

// ecs

// function apply_system()

// function update(ecs){

// }