
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

class Destroy extends concepts.Action {
    icon_def = sprite_defs.icon_action_delete;

    constructor(target_position){
        super(`destroy_${target_position.x}_${target_position.y}`,
                `Destroy anything at ${JSON.stringify(target_position)}`,
                target_position,
                { // costs
                    action_points: 50
                }
                );
    }

    execute(world){
        return destroy_at(this.target_position , world);
    }
};


class Rule_Destroy extends concepts.Rule {
    range = new visibility.Range_Diamond(0,7);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Destroy, this.range);
    }
};

