export {
    AntiVirus,
    AnomalyHunter,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as items from "../definitions-items.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { auto_newlines, random_int, random_sample } from "../system/utility.js";
import { Delete } from "../rules/rules-delete.js";
import { Repair } from "../rules/rules-repair.js";
import { closest_entity, move_towards, select_action_by_type, wander } from "./characters-common.js";


class AnomalyHunter extends concepts.Actor {

    __serialization_ignore_list = [ "target" ];

    decide_next_action(world, character, possible_actions){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        debug.assertion(()=>possible_actions instanceof Object);

        const attack = this._attack_any_virus_around(possible_actions, character, world);
        const friend_to_heal_dying = this._find_friend_to_heal(character, world, 1/2);
        const friend_to_heal_hurt = this._find_friend_to_heal(character, world, 1/10);

        const friend_to_heal = friend_to_heal_dying instanceof Character ? friend_to_heal_dying : friend_to_heal_hurt;

        if(friend_to_heal instanceof Character
        && (!attack
           || friend_to_heal == character   // Heal yourself as a priority...
           || friend_to_heal == friend_to_heal_dying // ...then dying friends have priority.
           || random_int(1, 100) > 80       // Don't heal all the time if there are enemies around.
           )
        ){
            const heal_friend = this._heal_target(possible_actions, friend_to_heal.position);
            if(heal_friend instanceof concepts.Action)
                return heal_friend;

            const move_closer_to_friend = this._move_towards(character, possible_actions, friend_to_heal.position);
            if(move_closer_to_friend instanceof concepts.Action)
                return move_closer_to_friend;
        }

        if(attack instanceof concepts.Action)
            return attack;

        const target = this._update_target(character, world);

        if(!target)
            return possible_actions.wait;

        debug.assertion(()=>target instanceof Character);

        const delete_target = this._attack_target(possible_actions, target.position);
        if(delete_target instanceof concepts.Action)
            return delete_target;

        const move_towards_target = target.is_virus ? this._move_towards_safely(character, possible_actions, target.position) : this._move_towards(character, possible_actions, target.position);
        if(move_towards_target instanceof concepts.Action)
            return move_towards_target;

        // This one is for the case where the target is unreachable.
        const random_move = this._random_move(possible_actions);
        if(random_move instanceof concepts.Action){
            delete this.target;
            return random_move;
        }

        return possible_actions.wait; // Probably blocked.
    }


    _heal_target(possible_actions, target_position){
        return select_action_by_type(possible_actions, target_position, Repair);
    }

    _attack_target(possible_actions, target_position){
        return select_action_by_type(possible_actions, target_position, Delete);
    }

    _attack_any_virus_around(possible_actions, character, world){
        return random_sample(Object.values(possible_actions).filter(action => {
                                                                    if(action instanceof Delete
                                                                    && !action.target_position.equals(character.position)
                                                                    ){
                                                                        const target = world.body_at(action.target_position);
                                                                        if(target && target.is_virus)
                                                                            return true;
                                                                    }
                                                                    return false;
                                                                })
                            );
    }

    _move_towards(character, possible_actions, target_position){
        return move_towards(character, possible_actions, target_position);
    }

    _move_towards_safely(character, possible_actions, target_position){
        const safe_actions = Object.values(possible_actions)
                                .filter(action => !action.target_position
                                            || target_position.adjacents_diags.every(position => !action.target_position.equals(position))
                                );
        return move_towards(character, safe_actions, target_position);
    }

    _random_move(possible_actions){
        return wander(possible_actions);
    }

    _update_target(character, world){
        // Keep track of the current target, or find a new one.
        // if(this.target && !this.target.is_virus){
        //     delete this.target;
        // }

        // FORCE looking for new targets all the time
        delete this.target;

        if(!this.target){
            this.target = this._find_new_target(character, world);
        }

        if(this.target instanceof Character){
            if(this.target
            && world.bodies.includes(this.target)
            && character.field_of_vision.is_visible(this.target.position)){
                return this.target;
            }

            delete this.target;
            return this._update_target(character, world);
        }
        // return undefined in all other cases.
    }

    _find_new_target(character, world){
        const virus = closest_entity(character, world, (entity)=>entity instanceof Character && entity.is_virus);
        if(virus instanceof Character)
            return virus;
        else
            return closest_entity(character, world, (entity)=>entity instanceof Character && entity.is_anomaly);
    }

    _find_friend_to_heal(character, world, ration_of_life_left){
        return closest_entity(character, world, (entity)=>entity instanceof Character
                                                        && !entity.is_virus
                                                        && !entity.is_anomaly
                                                        && entity.stats.integrity.value <= Math.floor(entity.stats.integrity.max * ration_of_life_left));
    }
}



class AntiVirus extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.antivirus,
        }}
    };

    description = auto_newlines("Hunts defects, glitches, viruses, malwares. Very agressive and does not have any kind of pity.", 35);
    is_floating = true; // rule of cool

    constructor(){
        super("Anti-Virus");
        this.actor = new AnomalyHunter;
        this.stats.integrity.real_max = 12;
        this.stats.integrity.real_value = 12;
        this.stats.inventory_size.real_value = 3;
        this.stats.activable_items.real_value = 3;
        this.stats.view_distance.real_value = 6;
        this.stats.ap_recovery.real_value = 8;
        this.stats.action_points.real_max = 20;
        this.stats.action_points.real_value = 20;
        this.inventory.add(new items.Item_ByteClearer());
        this.inventory.add(new items.Item_Jump());
        this.inventory.add(new items.Item_MemoryCleanup());
    }

};
