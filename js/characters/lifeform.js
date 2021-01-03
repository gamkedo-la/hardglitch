export { LifeForm_Weak, LifeForm_Strong };

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import { sprite_defs } from "../game-assets.js";
import { Character, CharacterStats } from "../core/character.js"
import { random_sample, rotate_array, random_int, auto_newlines } from "../system/utility.js";
import { Item_BadCode, Item_LifeStrength } from "../definitions-items.js";
import { Push } from "../rules/rules-forces.js";

const reverse_move_id = {
    move_east : "move_west",
    move_north: "move_south",
    move_west : "move_east",
    move_south: "move_north",
};

function maybe_push(world, possible_actions){
    const push_actions = Object.values(possible_actions)
        .filter(action => {
                if(!(action instanceof Push))
                    return false;

                const target = world.entity_at(action.target_position);
                return !(target instanceof concepts.Item)
                    && !(target instanceof LifeForm_Strong)
                    ;
        });


    if(push_actions.length > 0){
        if(random_int(0, 100) > 75)
            return random_sample(push_actions);
    }
}

class MoveUntilYouCant extends concepts.Actor {

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

    description = auto_newlines("Unexpected and unexpecting life-form living in the computer's memory. Nobody knows where they come from.", 35);
    is_anomaly = true;

    constructor(){
        super("Weak Life Form", );
        const behavior_type = random_sample(lifeform_possible_behavior);
        this.actor = new behavior_type();
        this.stats.inventory_size.real_value = 1;
    }

    drops = [ new Item_BadCode() ];
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