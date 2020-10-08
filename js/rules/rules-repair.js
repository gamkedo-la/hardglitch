
export {
    Rule_Repair,
    Repair,
    Repaired,
}

import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { Repaired, repair } from "./recovery.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { deal_damage } from "./destruction.js";

const repair_points = 5;
const repair_ap_cost = 5;
const repair_range = new visibility.Range_Square(0,4);


class Repair extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_repair; }
    static get action_type_name() { return "Repair"; }
    static get range() { return repair_range; }
    static get costs(){
        return {
            action_points: repair_ap_cost,
        };
    }

    constructor(target_position){
        super(`repair_${target_position.x}_${target_position.y}`,
                `Repair ${repair_points} Integrity at ${JSON.stringify(target_position)}`,
                target_position);
        this.repair_points = repair_points;
    }

    execute(world){
        console.assert(world instanceof concepts.World);
        const repaired =  world.entity_at(this.target_position);
        console.assert(repaired instanceof concepts.Entity);
        if(repaired instanceof Character){
            repaired.repair(this.repair_points);
        }
        return [
            new Repaired(repaired.id, repaired.position, this.repair_points),
        ];
    }
};


class Rule_Repair extends concepts.Rule {
    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Repair, Repair.range);;
    }

    update_world_at_the_beginning_of_game_turn(world){
        // Characters natural recovery (or hurt).
        const events = [];
        world.bodies.forEach(character => {
            console.assert(character instanceof Character);
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

