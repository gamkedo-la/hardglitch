
export {
    Rule_Destroy,
    Destroy,
}

import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { destroy_at } from "../rules/destruction.js";
import { Character } from "../core/character.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { auto_newlines } from "../system/utility.js";

const destroy_range = new visibility.Range_Diamond(0,7);
class Destroy extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_delete; }
    static get action_type_name() { return "Destroy"; }
    static get action_type_description() { return auto_newlines("Destroys the target entity. Brutal and effective, but very expensive.", 35); }
    static get range() { return destroy_range; }
    static get costs(){
        return {
            action_points: { value: 50 },
            integrity: { value: 3},
        };
    }

    constructor(target_position){
        super(`destroy_${target_position.x}_${target_position.y}`,
                `Destroy anything in that memory section`,
                target_position);
    }

    execute(world){
        return destroy_at(this.target_position , world);
    }
};


class Rule_Destroy extends concepts.Rule {

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Destroy);
    }
};

