export {
    InventoryUI,
}



import * as graphics from "../system/graphics.js";
import * as concepts from "../core/concepts.js";
import { Character, Inventory } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { Vector2 } from "../system/spatial.js";
import { HelpText } from "../system/ui.js";

const item_slot_vertical_space = 0;

class ItemIcon {
    _sprite = new graphics.Sprite({  });


    update(delta_time){
        this._sprite.update(delta_time);

    }


    draw(canvas_context){
        this._sprite.draw(canvas_context);
    }

};

class ItemSlot {
    _sprite = new graphics.Sprite(sprite_defs.item_slot);
    _item = null

    constructor(position){
        this._help_text = new HelpText({
            text: "Item Slot",
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
    }


    draw(canvas_context){
        this._sprite.draw(canvas_context);
        this._help_text.draw(canvas_context);
    }

    get position() { return this._sprite.position; }
    set position(new_position) {
        this._sprite.position = new_position;
        this._help_text.position = this.position.translate({ x: this.size.width });
        this._help_text.area_to_help = this._sprite.area;
    }
    get size() { return this._sprite.size; }

    get item() { return this._item; }
    set item(new_item){
        console.assert(this._item === null);
        console.assert(item instanceof concepts.Item);
        this._item = new_item;
        this._item._item_slot = this;
    }

    remove_item(){
        const item = this._item;
        if(item){
            delete item._item_slot;
        }
        this._item = null;
        return item;
    }
};



class InventoryUI {
    slots = [];
    _position = new Vector2();

    constructor(position){
        if(position){
            this.position = position;
        }
    }

    get position() { return this._position; }
    set position(new_position){
        this._position = new Vector2(new_position);
    }

    update(delta_time, current_character){
        console.assert(current_character instanceof Character || current_character === undefined);

        if(current_character){
            this.refresh(current_character);
        } else {
            if(slots.length != 0){
                slots = [];
            }
        }


        this.slots.forEach(slot=>slot.update(delta_time));
    }


    draw(canvas_context){
        console.assert(graphics.camera.is_rendering_in_screen);
        this.slots.forEach(slot=>slot.draw(canvas_context));
    }

    refresh(character){
        console.assert(character instanceof Character);
        const inventory_size = character.stats.inventory_size.value;
        if(this.slots.length != inventory_size){
            this._reset_slots(inventory_size);
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
        const items = inventory.items;
        console.assert(this.slots.length >= items.length);

        items.forEach(item => {
            console.assert(item instanceof concepts.Item);
            this.slots.item
        });

    }

};



