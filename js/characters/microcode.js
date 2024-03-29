export {
    Microcode,
    Corrupter,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines, random_int, random_sample } from "../system/utility.js";
import { scan_visible_entities_around, select_action_by_type, wander } from "./characters-common.js";
import { Corrupt } from "../rules/rules-corruption.js";
import { Jump } from "../rules/rules-movement.js";
import { is_walkable } from "../definitions-tiles.js";
import { desc_chars_per_line } from "../definitions-texts.js";

function actions_to_jump(){
    return random_int(5, 10);
}

class Corrupter extends concepts.Actor {
    actions_until_jump = actions_to_jump();

    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        if(this.can_see_another_character(character, world)){

            if(this.actions_until_jump <= 0){
                this.actions_until_jump = actions_to_jump();

                const jump = this._jump_around(character, possible_actions);
                if(jump)
                    return jump;
                else
                    return possible_actions.wait; // Skip the turn if we can't jump now.
            }

            --this.actions_until_jump;

            const corrupt = this._corrupt_randomly(character, possible_actions, world);
            if(corrupt)
                return corrupt;
        }

        return possible_actions.wait;
    }

    can_see_another_character(character, world) {
        return scan_visible_entities_around(character, world, entity=> entity instanceof Character
                                                            && !(entity instanceof Microcode)
                                                            && entity !== character
                                    ).length > 0;
    }

    _corrupt_randomly(character, possible_actions, world){
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        if(random_int(1, 100) > 95){ // Don't always corrupt.
            return;
        }

        const visible_targets = character.field_of_vision.visible_positions
                .filter(position => !position.equals(character.position)); // Don't corrupt your own memory directly.

        const random_target = random_sample(visible_targets);
        if(!random_target)
            return;

        const corrupt = select_action_by_type(possible_actions, random_target, Corrupt);
        return corrupt;
    }

    _jump_around(character, possible_actions){
        return wander(possible_actions, [ Jump ]); // Only allow jumping.
    }
};

class Microcode extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.microcode,
        }}
    };

    description = auto_newlines("Complex but swiftly optimized code sequences. Avoid them if you do not want your data to be corrupted.\nImmune to corruption.", desc_chars_per_line);

    immunity = {
        corruption: true,
    }

    constructor(){
        super("Micro-Code", );
        this.actor = new Corrupter;
        this.stats.integrity.real_max = 4;
        this.stats.integrity.real_value = 4;
        this.stats.inventory_size.real_value = 3;
        this.stats.activable_items.real_value = 3;
        this.stats.view_distance.real_value = 4;
        this.stats.ap_recovery.real_value = 40;
        this.stats.action_points.real_max = 10;
        this.stats.action_points.real_value = 10;
        this.inventory.add(new items.Item_Corrupt());
        this.inventory.add(new items.Item_Jump());
    }

};
