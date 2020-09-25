
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

    const enabled_action_types = character.inventory.get_enabled_action_types(parent_action_type);

    const actions = {};
    for(const target of valid_target_generator){
        console.assert(target instanceof concepts.Position);
        enabled_action_types.forEach(action_type => {
                console.assert(action_type && (action_type === parent_action_type || action_type.prototype instanceof parent_action_type));
                const action = action_maker(action_type, target);
                actions[action.id] = action;
            });
    }
    return actions;
}

function ranged_actions_for_each_target(world, character, parent_action_type, range, predicate){
    console.assert(world instanceof concepts.World);
    console.assert(character instanceof Character);
    console.assert(parent_action_type && parent_action_type.prototype instanceof concepts.Action);
    console.assert(range instanceof visibility.RangeShape);

    const valid_targets = lazy_call(visibility.valid_target_positions, world, character, range, predicate);
    const actions = actions_for_each_target(character, parent_action_type, valid_targets, (action_type, target)=>{
        const action = new action_type(target);
        action.range = range;
        return action;
    });
    return actions;
}