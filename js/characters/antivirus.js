export {
    AntiVirus,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";
import { Delete } from "../rules/rules-delete.js";
import { Jump, Move } from "../rules/rules-movement.js";
import { distance_grid_precise } from "../system/spatial.js";


class AnomalyHunter extends concepts.Actor {
    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);

        const target = this._update_target(character, world);

        if(!target)
            return possible_actions.wait;

        debug.assertion(()=>target instanceof Character);

        const delete_actions_ids = Object.keys(possible_actions)
                                    .filter(name => name.startsWith("delete_"));

        const delete_target_id = delete_actions_ids.find((delete_id)=>{
            const delete_action = possible_actions[delete_id];
            debug.assertion(()=>delete_action instanceof Delete);
            return delete_action.target_position.equals(target.position);
        });

        if(delete_target_id)
            return possible_actions[delete_target_id];

        const move_actions_ids = Object.keys(possible_actions)
            .filter(name => name.startsWith("move_") || name.startsWith("jump_"))
            .filter(name => possible_actions[name].is_safe);

        if(move_actions_ids.length === 0)
            return possible_actions.wait;

        const move_towards_target_id = move_actions_ids.sort((a, b)=>{
            const move_action_a = possible_actions[a];
            const move_action_b = possible_actions[b];
            debug.assertion(()=>move_action_a instanceof Move || move_action_a instanceof Jump);
            debug.assertion(()=>move_action_b instanceof Move || move_action_b instanceof Jump);
            const distance_a = distance_grid_precise(move_action_a.target_position, target.position);
            const distance_b = distance_grid_precise(move_action_b.target_position, target.position);
            return distance_a - distance_b;
        })[0];

        if(move_towards_target_id)
            return possible_actions[move_towards_target_id];

        return possible_actions.wait;
    }

    _update_target(character, world){
        if(!this.target_id){
            this.target_id = this._find_new_target(character, world);
        }

        if(this.target_id){
            let target = world.get_entity(this.target_id);
            if(target && character.field_of_vision.is_visible(target.position)){
                return target;
            }

            delete this.target_id;
            return this._update_target(character, world);
        }
        // return undefined in all other cases.
    }

    _find_new_target(character, world){
        const potential_targets = character.field_of_vision.visible_entities(world)
                                    .filter(entity => entity instanceof Character && entity.is_anomaly);

        if(potential_targets.length > 0){
            return potential_targets[0].id;
        }
    }
}

class ByteCleaner extends concepts.Item {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.item_generic_6,
        }}
    };

    description = auto_newlines("Simple data deletion tool, used by Anti-Virus to clean \"anomalies\" from the system.", 35);
    get can_be_taken() { return true; }

    constructor(){
        super("Byte Cleaner");
    }

    get_enabled_action_types(){
        return [ Delete ];
    }

}


class AntiVirus extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.antivirus,
        }}
    };

    description = auto_newlines("Hunts defects, glitches, viruses, malwares. Very agressive and does not have any kind of pity.", 35);

    constructor(){
        super("Anti-Virus");
        this.actor = new AnomalyHunter;
        this.stats.inventory_size.real_value = 3;
        this.stats.activable_items.real_value = 3;
        this.stats.view_distance.real_value = 12;
        this.stats.ap_recovery.real_value = 20;
        this.stats.action_points.real_max = 20;
        this.stats.action_points.real_value = 20;
        this.inventory.add(new ByteCleaner());
        this.inventory.add(new items.Item_Jump());
    }

};
