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

export const ui = {
empty_slot:
`Item Slot (empty):
Taken items will be put here.
Drag'n'drop items to different slots
to organize your inventory.
Drag'n'drop an item in an Active
slot to enable it's powers (shining).
Moving Items in slots costs 1 AP.
`,

empty_active_slot:
`Active Item Slot (empty):
Items put here will have their
powers activated (shining).
Drag'n'drop the item in an normal
item slot to disable it's powers.
Moving Items in slots costs 1 AP.
`,

character_name:
`Name of the digital-life entity
you are currently controlling.
`,

integrity:
`Integrity:

If this value reaches 0, this entity
will be destroyed!
Try to keep it to the max to have
a chance to survive longer.
`,

action_points:
`Action Points:

Each action costs Action Points (AP)
Entities can perform actions until
AP <= 0 OR until they Wait.
Then the next entity in the timeline
will act - repeat until New Cycle.
Entity skips turns until AP > 0.
`,

ap_per_cycle:
`Actions Points Per Cycle:

At the beginning of each cycle,
this entity will gain/lose that much
Action Points.
`,

integrity_per_cycle:
`Integrity Per Cycle:

At the beginning of each cycle,
this entity gain/lose that much
Integrity points.
`,

timeline:
`Timeline:

Order in which the visible entities
will execute their actions.
Point entities in this Timeline
to see where they are in the world.
Click the cycle count to open/close.
`,

new_cycle:
`New Cycle:

When everybody finished acting,
a new cycle begins and updates
the world.
Then each entity acts in turn.
`,

infobox:
`This is the Info Box.

It helps you gather the information
about what's visible around.
Try to point at something to learn
about it.

Use the top button to open/close.
`,

autofocus_button:
`Auto Focus ON/OFF:

Enabled: camera will center on the
player entity after each action.
Disabled: Does nothing.
Drag'n'drop the world to see around.
Press "F" key to re-focus.
`,

mute_button:
`Mute ON/OFF:

Allows you to mute all audio at will.
`,

menu_button:
`Menu:

Displays the menu:
help, options, volumes...
`,

cancel_action: `Cancels the current Action.`
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