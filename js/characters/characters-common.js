export {
    find_entity_id,
    select_action_by_type,
    move_towards,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import { Character } from "../core/character.js";
import { Jump, Move } from "../rules/rules-movement.js";
import { distance_grid_precise } from "../system/spatial.js";


function find_entity_id(character, world, predicate){
    const potential_targets = character.field_of_vision.visible_entities(world)
                                .filter(entity => entity instanceof Character && predicate(entity));
    if(potential_targets.length > 0){
        return potential_targets[0].id;
    }
}


function select_action_by_type(possible_actions, target_position, action_type){
    debug.assertion(()=>target_position instanceof concepts.Position);

    const selected_action = Object.values(possible_actions)
                                .find(action => action instanceof action_type
                                        && action.target_position instanceof concepts.Position
                                        && action.target_position.equals(target_position)
                                );

    return selected_action;
}

function move_towards(possible_actions, target_position, allowed_move_types = [Move, Jump]){
    debug.assertion(()=>target_position instanceof concepts.Position);

    const move_actions = Object.values(possible_actions)
        .filter(move_action => allowed_move_types.some(move_type => move_action instanceof move_type)
                            && move_action.is_safe
        );

    if(move_actions.length === 0)
        return possible_actions.wait;

    const move_towards_target = move_actions.sort((move_action_a, move_action_b)=>{
        const distance_a = distance_grid_precise(move_action_a.target_position, target_position);
        const distance_b = distance_grid_precise(move_action_b.target_position, target_position);
        return distance_a - distance_b;
    })[0];

    return move_towards_target;
}