// Put here general texts used in the game.
// Export the texts so that we can use them in the rest of the code.

import * as concepts from "./core/concepts.js";

export {
    item_description,
    action_description,
}

export const help_info = `How To Play in 5 points:
1. Your Goal: FIND and REACH THE EXIT of the level.
2. Actions: Use the action buttons at the bottom of the screen. They only appear when the action is possible.
3. Movement: Use "WASD" keys, click on green highlighted squares or use the "Move" action button.
4. Information: Point anything to get info through tooltips or the info-box (bottom right of the screen).
5. Camera: Drag'n'drop the world to move the camera, or use "IJKL" keys.
`;

export const inventory = {
    empty_slot: `Item Slot (empty):

Taken items will be put here.
Drag'n'drop items to different slots
to organize your inventory.
Drag'n'drop an item in an Active
slot to enable it's powers (shining).
`,
    empty_active_slot: `Active Item Slot (empty):

Items put here will have their
powers activated (shining).
Drag'n'drop the item in an normal
item slot to disable it's powers.
`,
};

function action_description(action){ // TODO : also clarify the range.
    console.assert(action instanceof concepts.Action);

    return `Action: ${action.constructor.action_type_name}
Costs: ${action.costs.action_points} AP

${action.constructor.action_type_description}
`
}

function stats_modifiers_description(modifiers){
    if(!modifiers)
        return "";

    console.assert(modifiers instanceof Object);
    return "INSERT MODIFIERS HERE";
}

function item_description(item){
    console.assert(item instanceof concepts.Item);

    const item_effects_here = stats_modifiers_description(item.stats_modifiers);
    const item_actions_names = item.get_enabled_actions_names().map(action_name=>{

    });

    const description_text = `${item.name}

${item.description}
${item_actions_names}
${item_effects_here}
`;

    return description_text;
}