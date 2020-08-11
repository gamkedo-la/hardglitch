
export {
    Rule_Repair,
    Repair,
}

import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { Repaired } from "./recovery.js";

const repair_points = 5;
const repair_ap_cost = 5;

class Repair extends concepts.Action {
    icon_def = sprite_defs.icon_action_repair;

    constructor(target_position){
        super(`repair_${target_position.x}_${target_position.y}`,
                `Repair ${repair_points} Integrity at ${JSON.stringify(target_position)}`,
                target_position,
                { // costs
                    action_points: repair_ap_cost
                }
                );
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
    range = new visibility.Range_Square(0,4);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        if(!character.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, character, this.range)
            .forEach((target)=>{
                    const action = new Repair(target);
                    action.range = this.range;
                    actions[action.id] = action;
                });
        return actions;
    }
};

