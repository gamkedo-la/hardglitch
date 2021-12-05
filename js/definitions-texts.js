// Put here general texts used in the game.
// Export the texts so that we can use them in the rest of the code.

import * as debug from "./system/debug.js";
import * as concepts from "./core/concepts.js";
import { auto_newlines } from "./system/utility.js";


export const desc_chars_per_line = 30;

export {
    item_description,
    action_description,
}

export const help_info = `How To Play:
1. Your Goal: FIND and REACH THE EXIT of the level.
2. Actions: Use the Action buttons at the bottom of the screen. Items in active slots can enable new actions that will appear as additional action buttons.
3. Movement: Use "WASD" keys, click on green highlighted squares or use the "Move" action button.
4. Information: Point anything to get info through tooltips or the info-box (bottom right of the screen).
5. Camera: Drag'n'drop the world to move the camera, or use "IJKL" keys.
6. Item Slots: Click on an item in the world to take it. The item will appear in the bottom left item slots. Drag items between slots to change or exchange slots.
7. Activate Items: Some item slots have a yellow border, they are "Active". Putting an item in an Active slot enables its powers.
8. Drop Items: drag items from the item slots to white squares around your character to drop the item there.
`;

export const ui = {
empty_slot:
`Item Slot (empty):

Taken items will be put here.
Drag'n'drop items to different slots
to organize your inventory.
Drag'n'drop an item in an Active
slot to enable its powers.

Moving Items in slots costs 1 AP.
`,

empty_active_slot:
`Active Item Slot (empty):

Items put here will have their
powers activated (shining).

Drag'n'drop the item in an normal
item slot to disable its powers.

Moving Items in slots costs 1 AP.
`,

detroy_slot:
`Destroy Slot:

Put an item here to destroy it.
The item can never be retrieved once
destroyed.

Moving Items in slots costs 1 AP.
`,

character_name:
`Name of the digital-life entity you
are currently controlling.
`,

integrity:
`Integrity:

Structural integrity, or health,
of the data constituing this entity.

If at 0, this entity is destroyed!

Use [LCTRL] key to show/hide health
constantly.
`,

action_points:
`Action Points:

Actions costs Action Points (AP).

Entities can perform actions until
AP <= 0, or until they Wait.
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

Turn order of visible entities.

Point entities in this Timeline to
see where they are in the world.
Use the cycle count to show/hide.
`,

new_cycle:
`New Cycle:

When everybody finished acting, a new
cycle begins and updates the world.
Then each entity acts in turn.

Special tiles and effects will
change when a new cycle begins.
`,

infobox:
`This is the Info Box.

It helps you gather the info about
what's visible around.
Try to point at things to learn
about them.

Use the top button to open/close.
`,

autofocus_button:
`Auto Focus ON/OFF:

Enabled: camera will center on the
player entity after each action.
Disabled: Does nothing.

Drag'n'drop the world to look around.

Press "F" key to re-focus.
`,

mute_button:
`Mute ON/OFF:

Allows you to mute/unmute all audio.
`,

menu_button:
`Menu:

Displays the menu:
help, options, volumes...
`,

cancel_action: `Cancels the current Action.`
};

function action_description(action_type){ // TODO : also clarify the range.
    return `Action: ${action_type.action_type_name}
${action_type.action_type_name == "Wait" ? "" : `Costs:\n${stats_modifiers_description(action_type.costs, false)}\n`}
${action_type.action_type_description}
`
}

function signed_number_str(number){
    if(number > 0){
        return `+${number}`;
    }
    return `${number}`;
}

function stats_modifiers_description(modifiers, with_signs = true){
    if(!modifiers)
        return;
    debug.assertion(()=>modifiers instanceof Object);
    let description = "";
    let line = 0;
    const maybe_newline = ()=> line++ > 0 ? '\n  ' : '  ';
    const value_str = with_signs ? signed_number_str : (value)=>value;
    if(modifiers.integrity){
        if(modifiers.integrity.max)
            description += `${maybe_newline()}${value_str(modifiers.integrity.max)} Max Integrity`;
        if(modifiers.integrity.value)
            description += `${maybe_newline()}${value_str(modifiers.integrity.value)} Integrity`;
    }
    if(modifiers.int_recovery){
        description += `${maybe_newline()}${value_str(modifiers.int_recovery.value)} Integrity / Cycle`;
    }
    if(modifiers.action_points){
        if(modifiers.action_points.max)
            description += `${maybe_newline()}${value_str(modifiers.action_points.max)} Max Action Points`;
        if(modifiers.action_points.value)
            description += `${maybe_newline()}${value_str(modifiers.action_points.value)} Action Points`;
    }
    if(modifiers.ap_recovery){
        description += `${maybe_newline()}${value_str(modifiers.ap_recovery.value)} Action Points / Cycle`;
    }
    if(modifiers.inventory_size){
        description += `${maybe_newline()}${value_str(modifiers.inventory_size.value)} Item Slots`;
    }
    if(modifiers.activable_items){
        description += `${maybe_newline()}${value_str(modifiers.activable_items.value)} Slots Activation`;
    }
    if(modifiers.view_distance){
        description += `${maybe_newline()}${value_str(modifiers.view_distance.value)} View Distance`;
    }
    return description;
}

const max_action_list_line_width = 30;

function item_description(item){
    debug.assertion(()=>item instanceof concepts.Item);

    const item_stats_modifiers = stats_modifiers_description(item.stats_modifiers);
    let action_count = 0;
    const item_actions_names = item.get_enabled_actions_names()
        .map(action_name=> `${action_count++ > 0 ? ', ' : ''}${action_name}`)
        .reduce((previous, current)=> { return previous += current}, "");

    let description_text = `${item.name}`;
    if(item_actions_names.length > 0){
        description_text += `\n${auto_newlines("  + Actions : " + item_actions_names, max_action_list_line_width)}`;
    }
    if(item_stats_modifiers){
        description_text += `\n${item_stats_modifiers}`;
    }
    description_text += `\n\n${item.description}`;

    return description_text;
}