export { LifeForm_Weak, LifeForm_Strong };

import * as concepts from "../core/concepts.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"
import { random_sample } from "../system/utility.js";
import { Wait } from "../rules/rules-basic.js";




class MoveUntilYouCant extends concepts.Actor {

    decide_next_action(possible_actions) {
        const move_actions_ids = Object.keys(possible_actions)
            .filter(name => name.startsWith("move_"))
            .filter(name => possible_actions[name].is_safe);

        // We want the character to continue their last action until they cannot.
        // When they cannot, we change the action to continue.

        if(move_actions_ids.includes(this.last_action_id)){
            const action = possible_actions[this.last_action_id];
            console.assert(action instanceof concepts.Action);
            return action;
        } else {
            const random_action_id = random_sample(move_actions_ids);
            this.last_action_id = random_action_id;
            const action = possible_actions[random_action_id];
            console.assert(action instanceof concepts.Action);
            return action;
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
        this.actor = new MoveUntilYouCant();
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
        this.actor = new MoveUntilYouCant();
    }
};