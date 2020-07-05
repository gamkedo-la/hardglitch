// This file contain just rules for testing.

export { test_rules }

import * as concepts from "../core/concepts.js";
import { sprite_defs } from "../game-assets.js";
import { destroy_at } from "../rules/destruction.js";
import * as visibility from "../rules/visibility.js";

class Destroy extends concepts.Action {
    icon_def = sprite_defs.icon_action_delete;

    constructor(target_position){
        super(`destroy_${target_position.x}_${target_position.y}`,
                `Destroy anything at ${JSON.stringify(target_position)}`,
                target_position);
    }

    execute(world){
        return destroy_at(this.target_position , world);
    }
};


class Rule_TestDestruction extends concepts.Rule {
    range = new visibility.Range_Diamond(0,7);

    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, body.position, this.range)
            .forEach((target)=>{
                    const destroy = new Destroy(target);
                    destroy.range = this.range;
                    actions[`destroy_${target.x}_${target.y}`] = destroy;
                });
        return actions;
    }
};


const test_rules = [
    new Rule_TestDestruction()
];

