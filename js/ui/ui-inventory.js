export {
    InventoryUI,
}



import * as spatial from "../system/spatial.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";

import { Character, Inventory } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { HelpText } from "../system/ui.js";
import { ItemView } from "../view/item-view.js";
import { play_action } from "../game-input.js";
import { SwapItemSlots } from "../rules/rules-items.js";

import { CharacterStatus } from "./ui-characterstatus.js";

const item_slot_vertical_space = 0;
const item_slot_name = "Item Slot";

class ItemSlot {
    _sprite = new graphics.Sprite(sprite_defs.item_slot);
    _item = null;

    constructor(position){
        this._help_text = new HelpText({
            text: item_slot_name,
            area_to_help: this._sprite.area,
            delay_ms: 0, // Display the help text immediately when pointed.
        });

        if(position)
            this.position = position;
    }

    update(delta_time){
        console.assert(!this._item || this._item._item_slot === this);
        this._sprite.update(delta_time);
        this._help_text.update(delta_time);
        if(this._item){
            console.assert(this._item instanceof ItemView);
            this._item.update(delta_time);
        }
    }


    draw(canvas_context){
        this._sprite.draw(canvas_context);
        this._help_text.draw(canvas_context);
    }

    draw_item(canvas_context){
        if(this._item){
            console.assert(this._item instanceof ItemView);
            this._item.render_graphics(canvas_context);
        }
    }

    get position() { return this._sprite.position; }
    set position(new_position) {
        this._sprite.position = new_position;
        this._help_text.position = this.position.translate({ x: this.size.width });
        this._help_text.area_to_help = this._sprite.area;
        this._update_item_position();

    }
    get size() { return this._sprite.size; }

    get item() { return this._item; }


    set_item(item_name, new_item){
        console.assert(typeof item_name === "string");
        console.assert(this._item === null);
        console.assert(new_item instanceof ItemView);
        this._item = new_item;
        this._item._item_slot = this;
        this._help_text.text = item_name;
        this._update_item_position();
    }

    remove_item(){
        const item = this._item;
        if(item){
            delete item._item_slot;
        }
        this._item = null;
        this._help_text.text = item_slot_name;
        return item;
    }

    _update_item_position(){
        if(!this._item)
            return;

        console.assert(this._item instanceof ItemView);
        this._item.position = spatial.center_in_rectangle(this._item.sprite.area, this._sprite.area).position;
    }
};



class InventoryUI {
    slots = [];
    _position = new spatial.Vector2();

    visible = true;

    constructor(position, character_status){
        console.assert(position instanceof spatial.Vector2);
        console.assert(character_status instanceof CharacterStatus);
        this.position = position;
        this.character_status = character_status;
    }

    get position() { return this._position; }
    set position(new_position){
        this._position = new spatial.Vector2(new_position);
    }

    update(delta_time, current_character){
        console.assert(current_character instanceof Character || current_character === undefined);

        if(current_character){
            this.refresh(current_character);
        } else {
            if(this.slots.length != 0){
                this.slots = [];
                delete this._current_character;
            }
        }

        this._update_item_dragging();

        this.slots.forEach(slot=>slot.update(delta_time));
    }

    get is_dragging_item() { return this._dragging_item && this._dragging_item.item; }

    is_under(position){ return this._find_slot_under(position) !== undefined; }

    _find_slot_under(position){
        console.assert(position instanceof spatial.Vector2);
        return this.slots.find(slot => spatial.is_point_under(position, slot._sprite.area))
    }

    _clear_slot_swaping(){
        delete this._dragging_item.destination_slot_idx;
        delete this._dragging_item.swap_action;
        this.character_status.end_preview_costs();
    }

    _update_item_dragging(){

        if(this._dragging_item){
            if(this._dragging_item.item){ // Ignore dragging from empty slots.
                if(input.mouse.is_dragging) { // Still dragging
                    const mouse_position = input.mouse.position;
                    this._dragging_item.item.position = mouse_position; // Keep the Item under the mouse.

                    const destination_slot = this._find_slot_under(mouse_position);
                    if(destination_slot){
                        // We are over a slot
                        const destination_slot_idx = this.slots.indexOf(destination_slot);
                        if(destination_slot_idx !== this._dragging_item.source_slot_idx){
                            if(destination_slot_idx !== this._dragging_item.destination_slot_idx){
                                console.assert(this._current_character instanceof Character);
                                this._dragging_item.destination_slot_idx = destination_slot_idx;
                                this._dragging_item.swap_action = new SwapItemSlots(this._dragging_item.source_slot_idx, this._dragging_item.destination_slot_idx);
                                this.character_status.begin_preview_costs({
                                    action_points: this._current_character.stats.action_points.value - this._dragging_item.swap_action.costs.action_points,
                                });
                            }
                        } else {
                            // Same slot than source
                            this._clear_slot_swaping();
                        }
                    } else {
                        // We are not over a slot
                        this._clear_slot_swaping();
                    }
                } else {
                    const destination_slot = this._find_slot_under(input.mouse.dragging_positions.end);
                    if(destination_slot){
                        const destination_slot_idx = this.slots.indexOf(destination_slot);
                        if(this._dragging_item.source_slot_idx === destination_slot_idx){
                            this._dragging_item.slot._update_item_position(); // Reset the item position.
                        } else {
                            console.assert(this._dragging_item.swap_action instanceof concepts.Action);
                            console.assert(this._dragging_item.destination_slot_idx === destination_slot_idx);
                            play_action(this._dragging_item.swap_action);
                        }
                    } else {
                        // Dropped outside in the world - TODO: do we remove the item?
                        this._dragging_item.slot._update_item_position(); // Reset the item position.
                    }
                }
            }
            if(!input.mouse.is_dragging){
                this._clear_slot_swaping();
                delete this._dragging_item;
            }
        }
        else
        {
            if(input.mouse.is_dragging){ // Gather information about mouse dragging first time it does.
                const dragging = input.mouse.dragging_positions;
                this._dragging_item = {};
                const slot = this._find_slot_under(dragging.begin);
                this._dragging_item.slot = slot;
                if(slot){
                    console.assert(slot instanceof ItemSlot);
                    this._dragging_item.source_slot_idx = this.slots.indexOf(this._dragging_item.slot);
                    const item_view = slot.item;
                    if(item_view){
                        this._dragging_item.item = item_view;
                    }
                }
            }
        }
    }


    draw(canvas_context){
        console.assert(graphics.camera.is_rendering_in_screen);
        this.slots.forEach(slot=>slot.draw(canvas_context));
        this.slots.forEach(slot=>slot.draw_item(canvas_context));
    }

    refresh(character){
        console.assert(character instanceof Character);

        const previous_character = this._current_character;
        this._current_character = character;

        const inventory_size = character.stats.inventory_size.value;
        if(this.slots.length != inventory_size){
            this._reset_slots(inventory_size);
        }

        if(character !== previous_character){
            const listener_id = "inventory_ui";
            if(previous_character){
                previous_character.inventory.remove_listener(listener_id);
            }
            character.inventory.add_listener(listener_id, inventory =>{
                this._reset_items(inventory);
            });
        }
    }

    _reset_slots(slot_count){
        console.assert(Number.isInteger(slot_count));
        this.slots = [];
        while(slot_count > 0){
            const item_slot = new ItemSlot();
            item_slot.position = this.position.translate({ y: -slot_count * item_slot.size.height });
            this.slots.push(item_slot);
            --slot_count;
        }
    }

    _reset_items(inventory){
        console.assert(inventory instanceof Inventory);
        const items = inventory.stored_items;
        console.assert(items instanceof Array);
        console.assert(this.slots.length >= items.length);

        this.slots.forEach(slot => slot.remove_item());

        for (const [item_idx, item] of items.entries()){
            if(item instanceof concepts.Item){
                this.slots[item_idx].set_item(item.name, new ItemView(item));
            } else {
                console.assert(!item);
                console.assert(!this.slots[item_idx].item);
            }
        }

    }

};



