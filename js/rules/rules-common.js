
export {
    actions_for_each_target,
    ranged_actions_for_each_target,
}

import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";

import { Character } from "../core/character.js";
import { lazy_call } from "../system/utility.js";


function actions_for_each_target(character, parent_action_type, valid_target_generator, action_maker = (action_type, target) => new action_type(target)){
    console.assert(character instanceof Character);
    console.assert(parent_action_type && parent_action_type.prototype instanceof concepts.Action);
    console.assert(valid_target_generator);
    console.assert(action_maker instanceof Function);

    const enabled_action_types = character.get_enabled_action_types(parent_action_type);

    const actions = {};
    enabled_action_types.forEach(action_type => {
        console.assert(action_type && (action_type === parent_action_type || action_type.prototype instanceof parent_action_type));
        const target_generator = valid_target_generator(action_type.range);
        for(const target of target_generator){
            console.assert(target instanceof concepts.Position);
            const action = action_maker(action_type, target);
            actions[action.id] = action;
        }
    });
    return actions;
}

function ranged_actions_for_each_target(world, character, parent_action_type, predicate){
    console.assert(world instanceof concepts.World);
    console.assert(character instanceof Character);
    console.assert(parent_action_type && parent_action_type.prototype instanceof concepts.Action);

    const valid_targets = (range) => lazy_call(visibility.valid_target_positions, world, character, range, predicate);
    const actions = actions_for_each_target(character, parent_action_type, valid_targets, (action_type, target)=>{
        const action = new action_type(target);
        return action;
    });
    return actions;
}