
export {
    Rule_Destroy,
    Destroy,
}

import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { destroy_at } from "../rules/destruction.js";

class Destroy extends concepts.Action {
    icon_def = sprite_defs.icon_action_delete;

    constructor(target_position){
        super(`destroy_${target_position.x}_${target_position.y}`,
                `Destroy anything at ${JSON.stringify(target_position)}`,
                target_position,
                1
                );
    }

    execute(world){
        return destroy_at(this.target_position , world);
    }
};


class Rule_Destroy extends concepts.Rule {
    range = new visibility.Range_Diamond(0,7);

    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, body.position, this.range)
            .forEach((target)=>{
                    const destroy = new Destroy(target);
                    destroy.range = this.range;
                    actions[destroy.id] = destroy;
                });
        return actions;
    }
};

