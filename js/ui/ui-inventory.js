export {
    InventoryUI,
}



import * as graphics from "../system/graphics.js";
import { Character } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { Item } from "../core/concepts.js";
import { Vector2 } from "../system/spatial.js";

const item_slot_vertical_space = 0;

class ItemIcon {
    _sprite = new graphics.Sprite({ position: graphics.canvas_center_position().translate({ y: 100 }) });


    update(delta_time){
        this._sprite.update(delta_time);

    }


    draw(canvas_context){
        this._sprite.draw(canvas_context);
    }

};

class ItemSlot {
    _sprite = new graphics.Sprite(sprite_defs.item_slot);

    constructor(){
        this._sprite.position = graphics.canvas_center_position();
    }

    update(delta_time){
        this._sprite.update(delta_time);

    }


    draw(canvas_context){
        this._sprite.draw(canvas_context);
    }

    get position() { return this._sprite.position; }
    set position(new_position) { this._sprite.position = new_position; }
    get size() { return this._sprite.size; }
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
            this.slots.push(item_slot);
            item_slot.position = this.position.translate({ y: -slot_count * item_slot.size.height });
            --slot_count;
        }
    }

};



