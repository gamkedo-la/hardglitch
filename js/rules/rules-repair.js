
export {
    Rule_Repair,
    Repair,
    Repaired,
}

import * as debug from "../system/debug.js";
import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { Repaired, repair } from "./recovery.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { deal_damage } from "./destruction.js";
import { auto_newlines } from "../system/utility.js";
import * as recovery from "./recovery.js";

const repair_points = 6;
const repair_ap_cost = 15;
const repair_range = new visibility.Range_Square(0,3);

class Repair extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_repair; }
    static get action_type_name() { return "Repair"; }
    static get action_type_description() { return auto_newlines(`Restores ${repair_points} data integrity of the target entity.`, 35); }
    static get range() { return repair_range; }
    static get costs(){
        return {
            action_points: { value: repair_ap_cost },
        };
    }

    constructor(target_position){
        super(`repair_${target_position.x}_${target_position.y}`,
                `Repair that entity of ${repair_points} Integrity`,
                target_position);
        this.repair_points = repair_points;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const repaired =  world.entity_at(this.target_position);
        debug.assertion(()=>repaired instanceof concepts.Entity);
        return recovery.repair(repaired, this.repair_points, character.position);
    }
};


class Rule_Repair extends concepts.Rule {
    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        return ranged_actions_for_each_target(world, character, Repair);
    }

    update_world_at_the_beginning_of_game_turn(world){
        // Characters natural recovery (or hurt).
        const events = [];
        world.bodies.forEach(character => {
            debug.assertion(()=>character instanceof Character);
            const recovery_amount = character.stats.int_recovery.value;
            if(recovery_amount > 0){
                events.push(...repair(character, recovery_amount));
            } else if(recovery_amount < 0) {
                events.push(...deal_damage(character, Math.abs(recovery_amount)) );
            }
        });
        return events;
    }

};

