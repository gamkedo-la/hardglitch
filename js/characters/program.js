export {
    Program,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines } from "../system/utility.js";
import { closest_entity, move_away } from "./characters-common.js";
import { VirusBehavior } from "./virus.js";

class ProgramBehavior extends concepts.Actor {
    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        const ennemy = this._find_closest_enemy(character, world);
        if(ennemy instanceof Character){

            const move = move_away(character, possible_actions, ennemy.position);
            if(move instanceof concepts.Action)
                return move;
        }



        return possible_actions.wait;
    }

    _find_closest_enemy(character, world){
        return closest_entity(character, world, entity => entity instanceof Character
                                                        && (entity.actor instanceof VirusBehavior
                                                            || entity.is_anomaly));
    }

}


class Program extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.program,
        }}
    };

    description = auto_newlines("User-space program. Eats memory for no reason.", 30);

    constructor(){
        super("Program", );
        this.actor = new ProgramBehavior;

        this.stats.inventory_size.real_value = 12;
        this.stats.activable_items.real_value = 2;
        this.stats.view_distance.real_value = 5;
        this.stats.ap_recovery.real_value = 10;
        this.stats.action_points.real_max = 10;
        this.stats.action_points.real_value = 10;
        this.stats.integrity.real_max = 40;
        this.stats.integrity.real_value = 40;

        this.inventory.add(new items.Item_Copy());
        this.inventory.add(new items.Item_Merge());

    }

};
