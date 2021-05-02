export { LifeForm_Weak, LifeForm_Strong, LifeForm_Aggressive };

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"
import { random_sample, rotate_array, random_int, auto_newlines } from "../system/utility.js";
import { Item_BadCode, Item_LifeStrength } from "../definitions-items.js";
import { Push } from "../rules/rules-forces.js";
import { move_towards, select_action_by_type, closest_entity } from "./characters-common.js";

const reverse_move_id = {
    move_east : "move_west",
    move_north: "move_south",
    move_west : "move_east",
    move_south: "move_north",
};

function all_lifeform_types() { return [ LifeForm_Strong, LifeForm_Weak, LifeForm_Aggressive ]; };

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

class MoveUntilYouCant extends concepts.Actor {

    decide_next_action(world, character, possible_actions) {
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
    directions = rotate_array([ "north", "east", "south", "west" ], random_int(0, 4));

    *next_direction(){
        while(true){
            for(const direction of this.directions){
                yield direction;
            }
        }
    }

    constructor(){
        super();
        this.direction_sequence = this.next_direction();
    }

    decide_next_action(world, character, possible_actions) {
        const push_action = maybe_push(world, possible_actions);
        if(push_action instanceof concepts.Action)
            return push_action;

        const move_actions_ids = Object.keys(possible_actions)
            .filter(name => name.startsWith("move_"))
            .filter(name => possible_actions[name].is_safe)
            ;
        if(move_actions_ids.length === 0)
            return possible_actions.wait;

        const prefered_direction = this.direction_sequence.next().value;
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
};



class Crusher extends concepts.Actor {

    constructor(){
        super();
        const base_behavior_type = random_sample(lifeform_possible_behavior);
        this.base_behavior = new base_behavior_type();
    }

    decide_next_action(world, character, possible_actions) {
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

        return this.base_behavior.decide_next_action(world, character, possible_actions);
    }

    find_someone_to_crush(world, character){
        const target = closest_entity(character, world,
            entity => entity instanceof Character && all_lifeform_types().every(lifeform_type => !(entity instanceof lifeform_type))
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

    description = auto_newlines("Uncivilized life-form living in the computer's memory. They crush anyone coming in their sight.", 35);
    is_anomaly = true;

    constructor(){
        super("Aggressive Life Form", new CharacterStats());
        this.actor = new Crusher();
        this.stats.integrity.real_max = 8;
        this.stats.integrity.real_value = 8;
        this.stats.inventory_size.real_value = 2;
        this.stats.activable_items.real_value = 2;
        this.stats.view_distance.real_value = 4;
        this.stats.ap_recovery.real_value = 10;
        this.stats.action_points.real_max = 10;
        this.stats.action_points.real_value = 10;
        this.inventory.add(new Item_LifeStrength());
    }

    drops = [ new LifeForm_Weak(), null, null ];
};