
export {
    Rule_Void,
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { destroy_entity } from "./destruction.js";


class Rule_Void extends concepts.Rule {
    update_world_after_character_turn(world){
        console.assert(world instanceof concepts.World);
        const events = [];
        for(const entity of world.entities){
            console.assert(entity instanceof concepts.Entity);
            const tiles_under_entity = world.tiles_at(entity.position);
            for(const tile of tiles_under_entity){
                if(tile === tiles.ID.VOID){
                    events.push(...destroy_entity(entity.id, world));
                    break;
                }
            }
        }

        return events;
    }
};




