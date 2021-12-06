
export {
    RandomActionEnemy,
    RandomActionSelector,
    WaitingNPC,
    WaitForever,
};

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import {auto_newlines, random_sample} from "../system/utility.js";
import { Wait } from "../rules/rules-basic.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"
import { desc_chars_per_line } from "../definitions-texts.js";

class RandomActionSelector extends concepts.Actor {

    decide_next_action(world, character, possible_actions) {
        // Just picking a random action is a perfectly valid strategy, lol
        while(true){
            let random_action = random_sample(Object.values(possible_actions));
            if(!random_action.is_safe) // Only select ations that seem safe for the character.
                continue;
            if(random_action == null) { // no action found.
                // In this case just wait:
                debug.assertion(()=>possible_actions.wait instanceof Wait);
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

    description = auto_newlines("Randomly generates data. Best source of randomness used by other programs.", desc_chars_per_line);

    constructor(){
        super("Random Device", new CharacterStats());
        this.actor = new RandomActionSelector();
    }
};

class WaitForever extends concepts.Actor{
    decide_next_action(world, character, possible_actions) { return possible_actions.wait; }
}

class WaitingNPC extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.test_enemy_2,
        }}
    };

    description = auto_newlines("Background program that does nothing apparent.", desc_chars_per_line);

    constructor(){
        super("Background Service", new CharacterStats());
        this.actor = new WaitForever();
    }
};
