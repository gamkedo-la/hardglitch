export { LifeForm_Weak, LifeForm_Strong };

import * as concepts from "../core/concepts.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"
import { random_sample } from "../system/utility.js";
import { Wait } from "../rules/rules-basic.js";

class CyclicBehavior extends concepts.Actor {

    decide_next_action(possible_actions) {
        // Just picking a random action is a perfectly valid strategy, lol
        while(true){
            let random_action = random_sample(Object.values(possible_actions));
            if(!random_action.is_safe) // Only select ations that seem safe for the character.
                continue;
            if(random_action == null) { // no action found.
                // In this case just wait:
                return new Wait();
            }
            return random_action;
        }
    }
};

class LifeForm_Weak extends Character {
    assets = {
        graphics : {
            sprite_def : sprite_defs.life_form_weak,
        }
    };

    constructor(){
        super("Weak Life Form", new CharacterStats());
        this.actor = new CyclicBehavior();
    }
};

class LifeForm_Strong extends Character {
    assets = {
        graphics : {
            sprite_def : sprite_defs.life_form,
        }
    };

    constructor(){
        super("Life Form", new CharacterStats());
        this.actor = new CyclicBehavior();
    }
};