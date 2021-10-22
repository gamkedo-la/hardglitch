export {
    LifeForm_Weak,
    LifeForm_Strong,
    LifeForm_Aggressive,
    LifeForm_Berserk,

    MoveUntilYouCant,
    MoveInCircles,
    Crusher,
};

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"
import { random_sample, rotate_array, random_int, auto_newlines } from "../system/utility.js";
import { Item_AutoRepair, Item_BadCode, Item_FrequencyBoost, Item_IntegrityBoost, Item_LifeStrength } from "../definitions-items.js";
import { Push } from "../rules/rules-forces.js";
import { move_towards, select_action_by_type, closest_entity } from "./characters-common.js";
import { DropItem, drop_items_around } from "../rules/rules-items.js";
import { valid_spawn_positions } from "../core/visibility.js";

const reverse_move_id = {
    move_east : "move_west",
    move_north: "move_south",
    move_west : "move_east",
    move_south: "move_north",
};

function all_lifeform_types() { return [ LifeForm_Strong, LifeForm_Weak, LifeForm_Aggressive, LifeForm_Berserk ]; };

function maybe_push(world, possible_actions){
    const push_actions = Object.values(possible_actions)
        .filter(action => {
                if(!(action instanceof Push))
                    return false;

                const target = world.entity_at(action.target_position);
                return !(target instanceof concepts.Item)
                    && all_lifeform_types().every(lifeform_type => !(target instanceof lifeform_type));
        });


    if(push_actions.length > 0){
        if(random_int(1, 100) > 5)
            return random_sample(push_actions);
    }
}

function maybe_drop_thanks_items(world, character){
    if(!(character._thanks_drops instanceof Array))
        return;

    const drop_positions = valid_spawn_positions(world, character.position, tiles.is_walkable);
    if(drop_positions.length == 0)
        return;

    const thanks_drops = character._thanks_drops;
    character._thanks_drops = true;
    const random_drop = random_sample(thanks_drops);
    const item_idx = character.inventory.add(random_drop);
    return new DropItem(drop_positions[0], item_idx);

}

class MoveUntilYouCant extends concepts.Actor {

    decide_next_action(world, character, possible_actions) {
        const thanks_drop = maybe_drop_thanks_items(world, character);
        if(thanks_drop instanceof concepts.Action){
            return thanks_drop;
        }

        const push_action = maybe_push(world, possible_actions);
        if(push_action instanceof concepts.Action)
            return push_action;

        const move_actions_ids = Object.keys(possible_actions)
            .filter(name => name.startsWith("move_") && possible_actions[name].is_safe)
            ;

        if(move_actions_ids.length === 0)
            return possible_actions.wait;

        // We want the character to continue their last action until they cannot.
        // When they cannot, we change the action to continue.

        if(move_actions_ids.includes(this.last_action_id)){
            const action = possible_actions[this.last_action_id];
            debug.assertion(()=>action instanceof concepts.Action);
            return action;
        } else {
            const reverse_action_id = reverse_move_id[this.last_action_id];
            if(move_actions_ids.includes(reverse_action_id)){
                this.last_action_id = reverse_action_id;
                const action = possible_actions[reverse_action_id];
                debug.assertion(()=>action instanceof concepts.Action);
                return action;
            } else {
                const random_action_id = random_sample(move_actions_ids);
                this.last_action_id = random_action_id;
                const action = possible_actions[random_action_id];
                debug.assertion(()=>action instanceof concepts.Action);
                return action;
            }
        }
    }
};

class MoveInCircles extends concepts.Actor {
    constructor(){
        super();
        this.directions = rotate_array([ "north", "east", "south", "west" ], random_int(0, 4));
        if(random_int(1, 100) > 50) this.directions.reverse();
    }

    next_direction(){
        this.directions = rotate_array(this.directions, 1);
        return this.directions[0];
    }


    decide_next_action(world, character, possible_actions) {
        const thanks_drop = maybe_drop_thanks_items(world, character);
        if(thanks_drop instanceof concepts.Action){
            return thanks_drop;
        }

        const push_action = maybe_push(world, possible_actions);
        if(push_action instanceof concepts.Action)
            return push_action;

        const move_actions_ids = Object.keys(possible_actions)
            .filter(name => name.startsWith("move_"))
            .filter(name => possible_actions[name].is_safe)
            ;
        if(move_actions_ids.length === 0)
            return possible_actions.wait;

        const prefered_direction = this.next_direction();
        const prefered_move_id = `move_${prefered_direction}`;
        if(move_actions_ids.includes(prefered_move_id)){
            this.last_action_id = prefered_move_id;
            const prefered_move = possible_actions[prefered_move_id];
            debug.assertion(()=>prefered_move instanceof concepts.Action && prefered_move.is_safe);
            return prefered_move;
        } else {
            this.directions.reverse();
            const reversed_move_id = reverse_move_id[this.last_action_id];
            if(move_actions_ids.includes(reverse_move_id)){
                this.last_action_id = reversed_move_id;
                const second_prefered_move = possible_actions[reverse_move_id];
                debug.assertion(()=>second_prefered_move instanceof concepts.Action && second_prefered_move.is_safe);
                return second_prefered_move;
            } else {
                const random_action_id = random_sample(move_actions_ids);
                const action = possible_actions[random_action_id];
                this.last_action_id = random_action_id;
                debug.assertion(()=>action instanceof concepts.Action && action.is_safe);
                return action;
            }
        }
    }
};

const lifeform_possible_behavior = [
    MoveInCircles, MoveUntilYouCant,
];

class LifeForm_Weak extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.life_form_weak,
        }}
    };

    description = auto_newlines("Unexpected anomaly life-form living in the computer's memory. Nobody knows where they come from.", 35);
    is_anomaly = true;

    constructor(){
        super("Weak Life Form", );
        const behavior_type = random_sample(lifeform_possible_behavior);
        this.actor = new behavior_type();
        this.stats.inventory_size.real_value = 1;
    }

    drops = [ new Item_BadCode(), null, null ];

    repair(integrity_amount){
        const repaired = super.repair(integrity_amount);
        if(repaired > 0 && this.stats.integrity.value == this.stats.integrity.max){
            this._thanks_drops = [ new Item_AutoRepair() ];
        }
        return repaired;
    }
};
class LifeForm_Strong extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.life_form,
        }}
    };

    description = auto_newlines("Stubborn life-form living in the computer's memory. They might not be sentient but they sure know what they want.", 35);
    is_anomaly = true;

    constructor(){
        super("Life Form", new CharacterStats());
        const behavior_type = random_sample(lifeform_possible_behavior);
        this.actor = new behavior_type();
        this.stats.integrity.real_max = 20;
        this.stats.integrity.real_value = 20;
        this.stats.inventory_size.real_value = 2;
        this.stats.activable_items.real_value = 2;
        this.inventory.add(new Item_LifeStrength());
    }

    drops = [ [ new LifeForm_Weak(), new LifeForm_Weak(), ] ];


    repair(integrity_amount){
        const repaired = super.repair(integrity_amount);
        if(repaired > 0 && this.stats.integrity.value == this.stats.integrity.max){
            this._thanks_drops = [ new Item_IntegrityBoost() ];
        }
        return repaired;
    }
};



class Crusher extends concepts.Actor {

    attack_life_forms = false;

    constructor(){
        super();
        const base_behavior_type = random_sample(lifeform_possible_behavior);
        this.base_behavior = new base_behavior_type();
    }

    decide_next_action(world, character, possible_actions) {
        const thanks_drop = maybe_drop_thanks_items(world, character);
        if(thanks_drop instanceof concepts.Action){
            return thanks_drop;
        }

        const target = this.find_someone_to_crush(world, character);
        if(target instanceof Character){
            const push_action = this.push(target, possible_actions);
            if(push_action instanceof concepts.Action){
                return push_action;
            } else {
                const approach = move_towards(character, possible_actions, target.position);
                if(approach instanceof concepts.Action)
                    return approach;
            }
        }

        if(this.base_behavior)
            return this.base_behavior.decide_next_action(world, character, possible_actions);
        else
            return possible_actions.wait;
    }

    find_someone_to_crush(world, character){
        const target = closest_entity(character, world,
            entity => entity instanceof Character && entity != character
                    && (this.attack_life_forms || all_lifeform_types().every(lifeform_type => !(entity instanceof lifeform_type))
                    )
        );
        return target;
    }

    push(target, possible_actions){
        return select_action_by_type(possible_actions, target.position, Push);
    }

};


class LifeForm_Aggressive extends Character {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.life_form_aggressive,
        }}
    };

    description = auto_newlines("Uncivilized life-form living in the computer's memory. They crush anyone coming in their sight! Except maybe other life-forms?", 35);
    is_anomaly = true;

    constructor(){
        super("Aggressive Life Form", new CharacterStats());
        this.actor = new Crusher();
        this.stats.integrity.real_max = 8;
        this.stats.integrity.real_value = 8;
        this.stats.inventory_size.real_value = 2;
        this.stats.activable_items.real_value = 2;
        this.stats.view_distance.real_value =  5;
        this.stats.ap_recovery.real_value = 10;
        this.stats.action_points.real_max = 10;
        this.stats.action_points.real_value = 10;
        this.inventory.add(new Item_LifeStrength());
    }

    drops = [ new LifeForm_Weak(), null, null ];
};

class LifeForm_Berserk extends LifeForm_Aggressive {
    assets = {
        graphics : { body: {
            sprite_def : sprite_defs.life_form_berserk,
        }}
    };

    description = auto_newlines("Enraged emergent life-form. Charge and crush anyone coming in their sight, even other life-forms! Might be tamed by kindness.", 35);

    constructor(...args){
        super(...args);
        this.name = "Berserk Life Form";
        this.inventory.add(new Item_FrequencyBoost()); // We want it to be fast and dangerous! And drop that item if killed :D
        this.stats.view_distance.real_value = 4; // Don't see too far, to be avoidable.
        this.actor.attack_life_forms = true; // We want it to attack any other life-forms too, anyone actually!

        this.actor._initial_base_behavior = this.actor.base_behavior;
        delete this.actor.base_behavior; // When nobody attackable is around, just wait.
    }

    drops = [ new LifeForm_Aggressive(), null ];

    repair(integrity_amount){
        const repaired = super.repair(integrity_amount);
        // Drops bonus if you attempt to appease it. (and change behavior)
        if(!this._thanks_drops){
            this.inventory.extract_all_items_slots();
            this._thanks_drops = [ new Item_FrequencyBoost() ];
            if(this.actor instanceof Crusher){
                this.actor = this.actor._initial_base_behavior;
            }
        }
        return repaired;
    }
};