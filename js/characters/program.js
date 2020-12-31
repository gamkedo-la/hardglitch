export {
    Program,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines, random_int, random_sample } from "../system/utility.js";
import { closest_entity, move_away, select_action_by_type } from "./characters-common.js";
import { VirusBehavior } from "./virus.js";
import { Destabilize, Unstability } from "../rules/rules-unstability.js";
import { grid_ID } from "../definitions-world.js";
import { Push } from "../rules/rules-forces.js";


class ProgramBehavior extends concepts.Actor {
    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        const enemy = this._find_closest_enemy(character, world);
        if(enemy instanceof Character){
            const dice_roll = random_int(1, 100);

            if(dice_roll > 90){
                const repel = this._repel_enemy(possible_actions, world, enemy);
                if(repel instanceof concepts.Action)
                    return repel;
            }

            if(dice_roll > 70){
                const push = this._push_enemy(possible_actions, enemy);
                if(push instanceof concepts.Action)
                    return push;
            }

            if(dice_roll > 50) {
                const shield = this._shield_thyself(possible_actions, world, character);
                if(shield instanceof concepts.Action)
                    return shield;
            }

            const move = move_away(character, possible_actions, enemy.position);
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

    _repel_enemy(possible_actions, world, enemy){
        const positions_around_enemy = [enemy.position, ...enemy.position.adjacents_diags ]
            .filter(position => world.is_valid_position(position) && !(world.grids[grid_ID.unstable].get_at(position) instanceof Unstability)); // TODO: factorize
        const target_position = random_sample(positions_around_enemy);
        if(target_position)
            return select_action_by_type(possible_actions, target_position, Unstability);
    }

    _push_enemy(possible_actions, enemy){
        return select_action_by_type(possible_actions, enemy.position, Push);
    }

    _shield_thyself(possible_actions, world, character){
        const positions_around_me = character.position.adjacents_diags
            .filter(position => world.is_valid_position(position) && !(world.grids[grid_ID.unstable].get_at(position) instanceof Unstability)); // TODO: factorize
        const target_position = random_sample(positions_around_me);
        if(target_position)
            return select_action_by_type(possible_actions, target_position, Destabilize);
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
        this.stats.ap_recovery.real_value = 20;
        this.stats.action_points.real_max = 30;
        this.stats.action_points.real_value = 30;
        this.stats.integrity.real_max = 40;
        this.stats.integrity.real_value = 40;

        this.inventory.set_item_at(0, new items.Item_Destabilize());
        this.inventory.set_item_at(1, new items.Item_Push());
        // this.inventory.add(new items.Item_Merge());

    }

};
