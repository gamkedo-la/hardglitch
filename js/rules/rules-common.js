
export {
    add_default_action_if_adjacent,
    actions_for_each_target,
    ranged_actions_for_each_target,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";

import { Character } from "../core/character.js";
import { lazy_call } from "../system/utility.js";

function add_default_action_if_adjacent(character_position, possible_actions, action, action_target, allow_diagnoals = false){
    debug.assertion(()=> character_position instanceof concepts.Position);
    debug.assertion(()=> possible_actions instanceof Object);
    debug.assertion(()=> action_target instanceof concepts.Position);
    debug.assertion(()=> action instanceof concepts.Action);

    if(character_position.north.equals(action_target)) possible_actions["default_north"] = action;
    else if(character_position.south.equals(action_target)) possible_actions["default_south"] = action;
    else if(character_position.east.equals(action_target)) possible_actions["default_east"] = action;
    else if(character_position.west.equals(action_target)) possible_actions["default_west"] = action;

    if(allow_diagnoals){
        if(character_position.north_west.equals(action_target)) possible_actions["default_north_west"] = action;
        else if(character_position.north_east.equals(action_target)) possible_actions["default_north_east"] = action;
        else if(character_position.south_west.equals(action_target)) possible_actions["default_south_west"] = action;
        else if(character_position.south_east.equals(action_target)) possible_actions["default_south_east"] = action;
    }
}

function actions_for_each_target(character, parent_action_type, valid_target_generator, action_maker = (action_type, target) => new action_type(target)){
    debug.assertion(()=>character instanceof Character);
    debug.assertion(()=>parent_action_type && parent_action_type.prototype instanceof concepts.Action);
    debug.assertion(()=>valid_target_generator);
    debug.assertion(()=>action_maker instanceof Function);

    const enabled_action_types = character.get_enabled_action_types_related_to(parent_action_type);

    const actions = {};
    enabled_action_types.forEach(action_type => {
        debug.assertion(()=>action_type && (action_type === parent_action_type || action_type.prototype instanceof parent_action_type));
        const action_range = action_type.range instanceof Function ? action_type.range(character) : action_type.range;
        debug.assertion(()=>action_range instanceof visibility.RangeShape);
        const target_generator = valid_target_generator(action_range);
        for(const target of target_generator){
            debug.assertion(()=>target instanceof concepts.Position);
            const action = action_maker(action_type, target);
            actions[action.id] = action;
        }
    });
    return actions;
}

function ranged_actions_for_each_target(world, character, parent_action_type, predicate){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>character instanceof Character);
    debug.assertion(()=>parent_action_type && parent_action_type.prototype instanceof concepts.Action);

    const valid_targets = (range) => lazy_call(visibility.valid_target_positions, world, character, range, predicate);
    const actions = actions_for_each_target(character, parent_action_type, valid_targets, (action_type, target)=>{
        const action = new action_type(target);
        return action;
    });
    return actions;
}