export {
    Microcode,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines, random_sample } from "../system/utility.js";
import { Jump } from "../rules/rules-movement.js";
import { select_action_by_type } from "./characters-common.js";
import { Corrupt } from "../rules/rules-corruption.js";


class Corrupter extends concepts.Actor {
    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        const corrupt = this. _corrupt_randomly(character, possible_actions);
        if(corrupt)
            return corrupt;

        return possible_actions.wait;
    }

    _corrupt_randomly(character, possible_actions){
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);
        const visible_targets = character.field_of_vision.visible_positions
                .filter(position => !position.equals(character.position));
        const random_target = random_sample(visible_targets);
        if(!random_target)
            return;

        const corrupt = select_action_by_type(possible_actions, random_target, Corrupt);
        return corrupt;
    }
};

class Microcode extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.microcode,
        }}
    };

    description = auto_newlines("Complex but swiftly optimized code sequences. Avoid them if you do not want your data to be corrupted.\nImmune to corruption.", 34);

    immunity = {
        corruption: true,
    }

    constructor(){
        super("Micro-Code", );
        this.actor = new Corrupter;
        this.stats.inventory_size.real_value = 3;
        this.stats.activable_items.real_value = 3;
        this.stats.view_distance.real_value = 3;
        this.stats.ap_recovery.real_value = 20;
        this.stats.action_points.real_max = 20;
        this.stats.action_points.real_value = 20;
        this.inventory.add(new items.Item_Corrupt());
        this.inventory.add(new items.Item_Jump());
    }

};
