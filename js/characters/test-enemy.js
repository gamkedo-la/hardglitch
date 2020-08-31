
export {
    RandomActionEnemy,
    WaitingNPC
};

import * as concepts from "../core/concepts.js";
import {random_sample} from "../system/utility.js";
import { Wait } from "../rules/rules-basic.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"

class RandomActionSelector extends concepts.Actor {

    decide_next_action(possible_actions) {
        // Just picking a random action is a perfectly valid strategy, lol
        while(true){
            let random_action = random_sample(Object.values(possible_actions));
            if(!random_action.is_safe) // Only select ations that seem safe for the character.
                continue;
            if(random_action == null) { // no action found.
                // In this case just wait:
                console.assert(possible_actions.wait instanceof Wait);
                return possible_actions.wait;
            }
            return random_action;
        }

    }
};

class RandomActionEnemy extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.test_enemy,
        }}
    };

    constructor(){
        super("Random Man", new CharacterStats());
        this.actor = new RandomActionSelector();
    }
};

class WaitingNPC extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.test_enemy,
        }}
    };

    constructor(){
        super("Wait Man", new CharacterStats());
        this.actor = new class extends concepts.Actor{
            decide_next_action(possible_actions) { return possible_actions.wait; }
        };
    }
};
