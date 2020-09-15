
export {
    Rule_Copy,
    Copy,
    Copied,
}

import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { EntitySpawned, spawn_entities_around } from "./spawn.js";

const copy_ap_cost = 20;

class Copied extends EntitySpawned {}; // Shortcut for now...

class Copy extends concepts.Action {
    icon_def = sprite_defs.icon_action_merge;

    constructor(target_position){
        super(`copy_${target_position.x}_${target_position.y}`,
                `Copy ${JSON.stringify(target_position)}`,
                target_position,
                { // costs
                    action_points: copy_ap_cost
                }
            );
        this.target_position = target_position;
    }

    execute(world){
        console.assert(world instanceof concepts.World);
        const copied_entity =  world.entity_at(this.target_position);
        console.assert(copied_entity instanceof concepts.Entity);

        // Javascript copy ability is bad, so we will have to do it manually.
        // Copying a character does not imply copying it's inventory.
        // nor does it imply copying it's state.
        // What we want, exactly, is to copy the kind of entity it is.
        const entity_copy = new copied_entity.constructor(); // Warning: This only works because we know that the different Items and Characters types can be built from no parametters.
        return spawn_entities_around(world, this.target_position, [ entity_copy ]);
    }
};


class Rule_Copy extends concepts.Rule {
    range = new visibility.Range_Circle(0, 6);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Copy, this.range);
    }

};

