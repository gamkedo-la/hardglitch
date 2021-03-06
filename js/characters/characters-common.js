export {
    scan_visible_entities_around,
    closest_entity,
    select_action_by_type,
    move_towards,
    move_away,
    wander,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import { Jump, Move } from "../rules/rules-movement.js";
import { distance_grid_precise } from "../system/spatial.js";
import { random_sample } from "../system/utility.js";
import { Character } from "../core/character.js";

const default_movement_types = [Move, Jump];

// Returns a list of visible entities, sorted by distance, matching the given predicate.
function scan_visible_entities_around(character, world, predicate){
    debug.assertion(()=>character instanceof Character);
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>predicate instanceof Function);
    return character.field_of_vision.visible_entities(world).filter(predicate);
}


// Returns the closest visible entity from the specified character, which matches the given predicate.
// Returns undefined if none matches these conditions.
function closest_entity(character, world, predicate){
    const potential_targets = scan_visible_entities_around(character, world, predicate);
    if(potential_targets.length > 0){
        return potential_targets.shift();
    }
}


function select_action_by_type(possible_actions, target_position, action_type){
    debug.assertion(()=>possible_actions instanceof Array || possible_actions instanceof Object);
    debug.assertion(()=>target_position instanceof concepts.Position);

    if(possible_actions instanceof Object) possible_actions = Object.values(possible_actions);
    const selected_action = possible_actions.find(action => action instanceof action_type
                                        && action.target_position instanceof concepts.Position
                                        && action.target_position.equals(target_position)
                                );

    return selected_action;
}

function moves_sorted_by_distance(possible_actions, target_position, allowed_move_types = default_movement_types){
    debug.assertion(()=>possible_actions instanceof Array || possible_actions instanceof Object);
    debug.assertion(()=>target_position instanceof concepts.Position);
    debug.assertion(()=>allowed_move_types instanceof Array);

    if(possible_actions instanceof Object) possible_actions = Object.values(possible_actions);
    const move_actions = possible_actions.filter(move_action => allowed_move_types.some(move_type => move_action instanceof move_type) && move_action.is_safe);

    if(move_actions.length === 0)
        return [];

    const moves_by_distance = move_actions.sort((move_action_a, move_action_b)=>{
        const distance_a = distance_grid_precise(move_action_a.target_position, target_position);
        const distance_b = distance_grid_precise(move_action_b.target_position, target_position);
        return distance_a - distance_b;
    });

    return moves_by_distance;
}

function move_towards(character, possible_actions, target_position, allowed_move_types = default_movement_types){
    const moves = moves_sorted_by_distance(possible_actions, target_position, allowed_move_types);
    const best_move = moves.shift();
    if(best_move
    && distance_grid_precise(best_move.target_position, target_position) <= distance_grid_precise(character.position, target_position))
        return best_move;
    else
        return undefined;
}

function move_away(character, possible_actions, target_position, allowed_move_types = default_movement_types){
    const moves = moves_sorted_by_distance(possible_actions, target_position, allowed_move_types);
    const best_move = moves.pop();
    if(best_move
    && distance_grid_precise(best_move.target_position, target_position) >= distance_grid_precise(character.position, target_position))
        return best_move;
    else
        return undefined;
}

function wander(possible_actions, allowed_move_types = default_movement_types, predicate_next_pos = ()=>true){
    debug.assertion(()=>possible_actions instanceof Array || possible_actions instanceof Object);
    if(possible_actions instanceof Object) possible_actions = Object.values(possible_actions);
    const all_moves = possible_actions.filter(action => allowed_move_types.some(move_type => action instanceof move_type)
                                                     && action.is_safe
                                                     && predicate_next_pos(action.target_position)
                                                     );
    return random_sample(all_moves);
}
