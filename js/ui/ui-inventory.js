export {
    InventoryUI,
}

import * as debug from "../system/debug.js";
import * as spatial from "../system/spatial.js";
import * as graphics from "../system/graphics.js";
import * as input from "../system/input.js";
import * as concepts from "../core/concepts.js";
import * as game_input from "../game-input.js";
import * as tiles from "../definitions-tiles.js";
import * as audio from "../system/audio.js";
import * as texts from "../definitions-texts.js";
import * as items from "../definitions-items.js";

import { Character, Inventory } from "../core/character.js";
import { sprite_defs } from "../game-assets.js";
import { HelpText } from "../system/ui.js";
import { ItemView } from "../view/item-view.js";
import { SwapItemSlots, DropItem, DestroyInventoryItem } from "../rules/rules-items.js";

import { CharacterStatus } from "./ui-characterstatus.js";
import { GameFxView } from "../game-effects.js";
import { is_blocked_position } from "../definitions-world.js";
import { show_info } from "./ui-infobox.js";
import { EntityView, square_half_unit_vector } from "../view/entity-view.js";
import { CharacterView } from "../game-view.js";
import { config } from "../game-config.js";

const item_slot_vertical_padding = 0;
const item_slot_vertical_size = 72;
const item_slot_vertical_half_size = item_slot_vertical_size /2;
const item_slot_column_width = 52;
const item_slots_relative_position = { x: 0, y: -item_slot_vertical_size };
const item_slots_vertical_space = item_slot_vertical_size + item_slot_vertical_padding;
const item_slot_vertical_top_padding = 64 * 2;
const item_slot_name = "Item Slot";
const active_item_slot_name = "Active Item Slot";
const destroy_item_slot_name = "Destruction Slot";


function is_activable_item_view(item_view){
    return item_view instanceof ItemView
        && !(item_view._item instanceof items.CryptoKey)
        ;
}

const slot_types = {
    NORMAL: 0,
    ACTIVE: 1,
    DESTROY: 2,
};

function is_slot_type(value){
    return Number.isInteger(value) && Object.values(slot_types).includes(value);
}

function slot_text(slot_type){
    debug.assertion(()=>is_slot_type(slot_type));
    switch(slot_type)
    {
        case slot_types.NORMAL:
            return item_slot_name;
        case slot_types.ACTIVE:
            return active_item_slot_name;
        case slot_types.DESTROY:
            return destroy_item_slot_name;
    }
}

function select_item_slot_sprite_def(slot_type){
    switch(slot_type)
    {
        case slot_types.NORMAL:
            return sprite_defs.item_slot;
        case slot_types.ACTIVE:
            return sprite_defs.item_active_slot;
        case slot_types.DESTROY:
            return sprite_defs.item_destroy_slot;
    }
};

class ItemSlot {

    constructor(position, slot_type, fx_view){
        debug.assertion(()=>is_slot_type(slot_type));
        debug.assertion(()=>position === undefined || position instanceof spatial.Vector2);
        debug.assertion(()=>fx_view instanceof GameFxView);

        this._fx_view = fx_view;
        this.type = slot_type;
        const sprite_def = select_item_slot_sprite_def(slot_type);
        this._sprite = new graphics.Sprite(sprite_def);
        this._item_view = null;

        this._help_text = new HelpText({
            text: slot_text(slot_type),
            area_to_help: this._sprite.area,
            delay_ms: 0, // Display the help text immediately when pointed.

        },
        {
            on_mouse_over: ()=> this._show_info(),
        });

        if(position)
            this.position = position;

        this.is_active = this.type === slot_types.ACTIVE;
    }

    get is_mouse_over() { return this._help_text.is_mouse_over_area_to_help; }

    update(delta_time){
        debug.assertion(()=>!this._item_view || this._item_view._item_slot === this);
        this._sprite.update(delta_time);
        this._help_text.update(delta_time);
        if(this._item_view){
            debug.assertion(()=>this._item_view instanceof EntityView);
            this._item_view.update(delta_time);
        }
    }


    draw(canvas_context){
        this._sprite.draw(canvas_context);
    }

    draw_item(canvas_context){
        if(this._item_view){
            debug.assertion(()=>this._item_view instanceof EntityView);
            this._item_view.render_graphics(canvas_context);
        }
    }

    draw_help(canvas_context){
        this._help_text.draw(canvas_context);
    }

    get position() { return this._sprite.position; }
    set position(new_position) {
        this._sprite.position = new_position;
        this._help_text.position = this.position.translate({ x: this.size.width });
        this._help_text.area_to_help = this._sprite.area;
        this._update_item_position();

    }
    get size() { return this._sprite.size; }

    get item() { return this._item_view; }


    set_item(new_item){
        debug.assertion(()=>this._item_view === null);
        debug.assertion(()=>new_item instanceof EntityView);
        debug.assertion(()=>typeof new_item.name === "string");

        if(this.type === slot_types.DESTROY){
            // Destroy the item
            this._destroy_fx();
            return;
        }

        if(this.is_active){
            if(new_item.on_active_begin instanceof Function)
                new_item.on_active_begin();
        }

        this._item_view = new_item;
        this._item_view._item_slot = this;
        this._item_view.is_visible = true;
        this._help_text.text = new_item.name;
        this._update_item_position();
        this._start_fx();
    }

    remove_item(){
        this._stop_fx();
        const item = this._item_view;
        if(item){
            if(this.is_active && item.on_active_end instanceof Function){
                item.on_active_end();
            }
            delete item._item_slot;
        }

        this._item_view = null;
        this._help_text.text = slot_text(this.type);
        return item;
    }

    _start_fx(){
        if (this.is_active) {
            let fx_pos = this._sprite.area.center;
            this.fx = this._fx_view.action(fx_pos);
        }
    }

    _stop_fx(){
        if (this.fx) {
            this.fx.done = true;
            delete this.fx;
        }
    }

    _destroy_fx(){
        let fx_pos = this._sprite.area.center;
        this.destroy_fx = this._fx_view.destruction(fx_pos);
    }

    _update_item_position(){
        if(!this._item_view)
            return;

        debug.assertion(()=>this._item_view instanceof EntityView);
        this._item_view.position = spatial.center_in_rectangle(this._item_view.area, this._sprite.area).position;
        if(this._item_view.is_being_destroyed){
            this._item_view.position = this._item_view.position.translate(square_half_unit_vector);
        }
    }

    _show_info(){
        if(this._item_view != undefined){
            const kind_and_name = this._item_view instanceof ItemView ? `Item: ` : `Entity: ${this._item_view.name}` + '\n\n';
            const active_label = this.is_active ? "Active " : "";
            show_info(`${active_label}${kind_and_name}${this._item_view.description}`);

        } else {
            switch(this.type)
            {
                case slot_types.NORMAL: show_info(texts.ui.empty_slot);  break;
                case slot_types.ACTIVE: show_info(texts.ui.empty_active_slot);  break;
                case slot_types.DESTROY: show_info(texts.ui.detroy_slot);  break;
            }
        }
    }
};



class InventoryUI {
    _slots = [];
    _position = new spatial.Vector2();

    visible = true;
    dragging_enabled = false;

    help_item_slot_enabled = false;

    constructor(position, character_status, events){
        debug.assertion(()=>position instanceof spatial.Vector2);
        debug.assertion(()=>character_status instanceof CharacterStatus);
        debug.assertion(()=>!events || events instanceof Object);
        this.position = position;
        this.character_status = character_status;
        this.events = events;
        this._need_refresh = false;
        this.fx_view = new GameFxView();
        this.fx_view.particleSystem.alwaysActive = true;

        this.help_item_slot_sprite = new graphics.Sprite(sprite_defs.help_item_slot);
    }

    get position() { return this._position; }
    set position(new_position){
        this._position = new spatial.Vector2(new_position);
    }

    update(delta_time, current_character, world){
        debug.assertion(()=>current_character instanceof Character || current_character == undefined);
        debug.assertion(()=>world instanceof concepts.World);
        this.world = world;

        if(current_character){
            this.refresh(current_character);
        } else {
            if(this._slots.length != 0){
                this._slots = [];
                delete this._current_character;
            }
        }

        if(this.dragging_enabled)
            this._update_item_dragging();

        this._slots.forEach(slot=>slot.update(delta_time));

        this.fx_view.update(delta_time);

        if(this.help_item_slot_enabled){
            this.help_item_slot_sprite.update(delta_time);
        }
    }

    get is_dragging_item() { return this._dragging_item && this._dragging_item.item; }
    get is_mouse_over() { return this._slots.some(slot => slot.is_mouse_over); }

    is_under(position){ return this._find_slot_under(position) !== undefined; }

    request_refresh(){
        this._need_refresh = true;
    }

    get_slot_position(idx) {
        debug.assertion(()=>idx < this._slots.length);
        return this._slots[idx].position;
    }

    get_item_view_at(idx) {
        debug.assertion(()=>Number.isInteger(idx));
        debug.assertion(()=>idx < this._slots.length);
        return this._slots[idx].item;
    }

    set_item_view_at(idx, item_view){
        debug.assertion(()=>Number.isInteger(idx));
        debug.assertion(()=>idx < this._slots.length);
        debug.assertion(()=>item_view instanceof EntityView);
        const item_slot = this._slots[idx];
        item_slot.set_item(item_view);

        const is_activable_item = is_activable_item_view(item_view);

        if(config.enable_item_slot_help
        && is_activable_item){
            if(item_slot.is_active){
                this.help_item_slot_enabled = false;
                config.enable_item_slot_help = false;
            } else {
                this.help_item_slot_enabled = true;
            }
        }
    }

    remove_item_view_at(idx){
        debug.assertion(()=>Number.isInteger(idx));
        debug.assertion(()=>idx < this._slots.length);

        const removed_item_view = this._slots[idx].remove_item();

        if(config.enable_item_slot_help
        && this.help_item_slot_enabled
        && this.count_activable_items == 0
        ){
            this.help_item_slot_enabled = false;
        }

        return removed_item_view;
    }

    get count_activable_items() { return this._slots.filter(slot=> is_activable_item_view(slot.item) ).length; }

    get slot_idxs_per_action_name(){
        const result = {};
        this._slots.forEach((slot, idx)=>{
            if(!slot.is_active || slot.item == null)
                return;

            const item = slot.item._item;
            if(!(item instanceof concepts.Item))
                return;

            const action_types = item.get_enabled_action_types();
            action_types.forEach(action_type => {
                if(result[action_type.action_type_name] == null)
                    result[action_type.action_type_name] = [];
                result[action_type.action_type_name].push(idx);
            })
        });
        return result;
    };

    _find_slot_under(position){
        debug.assertion(()=>position instanceof spatial.Vector2);
        return this._slots.find(slot => spatial.is_point_under(position, slot._sprite.area))
    }

    _clear_slot_swaping(){
        delete this._dragging_item.destination_slot_idx;
        delete this._dragging_item.swap_action;
        delete this._dragging_item.drop_action;
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
                        const destination_slot_idx = this._slots.indexOf(destination_slot);
                        if(destination_slot_idx !== this._dragging_item.source_slot_idx){
                            if(destination_slot_idx !== this._dragging_item.destination_slot_idx){
                                debug.assertion(()=>this._current_character instanceof Character);
                                this._dragging_item.destination_slot_idx = destination_slot_idx;
                                if(destination_slot.type === slot_types.DESTROY){
                                    this._dragging_item.destroy_action = new DestroyInventoryItem(this._dragging_item.source_slot_idx);
                                    this.character_status.begin_preview_costs({
                                        action_points: this._current_character.stats.action_points.value - this._dragging_item.destroy_action.constructor.costs.action_points.value,
                                    });
                                } else {
                                    this._dragging_item.swap_action = new SwapItemSlots(this._dragging_item.source_slot_idx, this._dragging_item.destination_slot_idx);
                                    this.character_status.begin_preview_costs({
                                        action_points: this._current_character.stats.action_points.value - this._dragging_item.swap_action.constructor.costs.action_points.value,
                                    });
                                }
                            }
                        } else {
                            // Same slot than source
                            this._clear_slot_swaping();
                        }
                    } else {
                        // We are not over a slot
                        // If the item was dropped next to the character, drop it.
                        const mouse_grid_position = game_input.mouse_grid_position();
                        if(mouse_grid_position){ // Pointing at an actual position in the world.
                            if(!this._dragging_item.drop_action || !this._dragging_item.drop_action.target.equals(mouse_grid_position)){
                                // We didn't point this position before, check if it's a droppable position...
                                if(this._possible_drop_positions.some(position => position.equals(mouse_grid_position))){
                                    // It's a droppable position!
                                    this._dragging_item.drop_action = new DropItem(mouse_grid_position, this._dragging_item.source_slot_idx);
                                    this.character_status.begin_preview_costs({
                                        action_points: this._current_character.stats.action_points.value - this._dragging_item.drop_action.constructor.costs.action_points.value,
                                    });
                                } else {
                                    // Not droppable, ignore.
                                    this._clear_slot_swaping();
                                }
                            } // Do nothing if we are still pointing at the same droppable position.
                        } else {
                            // Pointing outside the world.
                            this._clear_slot_swaping();
                        }

                    }
                } else { // Stopped dragging.
                    if(this._dragging_item.item.on_dragging_end instanceof Function)
                        this._dragging_item.item.on_dragging_end();
                    const destination_slot = this._find_slot_under(input.mouse.dragging_positions.end);
                    if(destination_slot){
                        const destination_slot_idx = this._slots.indexOf(destination_slot);
                        if(this._dragging_item.source_slot_idx === destination_slot_idx){
                            this._dragging_item.slot._update_item_position(); // Reset the item position.
                        } else {
                            debug.assertion(()=>this._dragging_item.destination_slot_idx === destination_slot_idx);
                            if(destination_slot.type === slot_types.DESTROY){
                                debug.assertion(()=>this._dragging_item.destroy_action instanceof concepts.Action);
                                game_input.play_action(this._dragging_item.destroy_action);
                            } else {
                                debug.assertion(()=>this._dragging_item.swap_action instanceof concepts.Action);
                                game_input.play_action(this._dragging_item.swap_action);
                            }
                        }

                        if(destination_slot.is_active)
                            audio.playEvent('activeItem');

                    } else {
                        // Dropped outside in the world
                        if(this._dragging_item.drop_action)
                        { // Dropped in a droppable position!
                            debug.assertion(()=>this._dragging_item.drop_action instanceof concepts.Action);
                            game_input.play_action(this._dragging_item.drop_action);
                        } else { // Dropped too far or in an invalid position.
                            this._dragging_item.slot._update_item_position(); // Reset the item position.
                        }
                    }
                    if(this.events){
                        debug.assertion(()=>this._dragging_item.item);
                        this._dragging_item.item.for_each_sprite(sprite=>sprite.reset_origin());
                        this.events.on_item_dragging_end();
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
                    debug.assertion(()=>slot instanceof ItemSlot);
                    this._dragging_item.source_slot_idx = this._slots.indexOf(this._dragging_item.slot);
                    const item_view = slot.item;
                    if(item_view){ // Begin dragging an item from a slot.
                        this._dragging_item.item = item_view;
                        this._dragging_item.item.for_each_sprite(sprite=>sprite.move_origin_to_center());
                        if(this._dragging_item.item.on_dragging_begin instanceof Function)
                            this._dragging_item.item.on_dragging_begin();

                        debug.assertion(()=>this._current_character instanceof Character);
                        debug.assertion(()=>this.world instanceof concepts.World);
                        this._possible_drop_positions = this._current_character.allowed_drops()
                            .filter(position => !is_blocked_position(this.world, position, tiles.is_walkable));

                        if(this.events)
                            this.events.on_item_dragging_begin(this._possible_drop_positions);
                    }
                }
            }
        }
    }


    draw(canvas_context){
        debug.assertion(()=>graphics.camera.is_rendering_in_screen);
        this._slots.slice().reverse().forEach(slot=>slot.draw(canvas_context));
        this._slots.slice().reverse().forEach(slot=>slot.draw_item(canvas_context));
        this.fx_view.draw(canvas_context);
        this._slots.slice().reverse().forEach(slot=>slot.draw_help(canvas_context));
        if(this.help_item_slot_enabled){
            this.help_item_slot_sprite.draw(canvas_context);
        }
    }

    refresh(character){
        debug.assertion(()=>character instanceof Character);

        const previous_character = this._current_character;
        this._current_character = character;

        const inventory_size = character.stats.inventory_size.value;
        const active_slot_count = character.stats.activable_items.value;
        let slots_have_been_reset = false;
        if(this._slots.length !== inventory_size + 1 // Don't count the destruction slot
        || this._active_slots_count !== active_slot_count
        || this._need_refresh){
            this._reset_slots(inventory_size, active_slot_count);
            slots_have_been_reset = true;
        }

        if(character !== previous_character
        || this._need_refresh){
            this._reset_items(character.inventory);
            if(!slots_have_been_reset)
                this._reset_slots(inventory_size, active_slot_count);
        }


        this.help_item_slot_sprite.position = this.get_slot_position(1);

        this._need_refresh = false;
    }

    _reset_slots(slot_count, active_slots_count){
        debug.assertion(()=>Number.isInteger(slot_count) && slot_count >= 0);
        const previous_items = this._slots.map(slot=> slot.remove_item());
        this._slots = [];
        this._active_slots_count = active_slots_count;

        const min_slots_per_column = 4;
        const vertical_space_in_screen = (graphics.canvas_rect().height + item_slots_relative_position.y - item_slot_vertical_top_padding);
        const vertical_slots_that_could_be_in_screen = Math.ceil(vertical_space_in_screen / item_slots_vertical_space);
        const max_vertical_slots_in_screen = vertical_slots_that_could_be_in_screen;
        const slots_per_column = Math.min(Math.max(min_slots_per_column, max_vertical_slots_in_screen), 8);
        let column_max_slots = slots_per_column;
        let column_idx = 0;
        let column_slots = 0;
        let hexagonal_shift = 0;

        const next_column = () =>{
            column_slots = 0;
            ++column_idx;
            if(column_idx % 2 === 0){
                hexagonal_shift = item_slot_vertical_half_size * 2;
                column_max_slots = slots_per_column - 2;
            } else {
                hexagonal_shift = item_slot_vertical_half_size;
                column_max_slots = slots_per_column - 1;
            }
        };

        const next_slot_position = ()=>{
            if(column_slots >= column_max_slots){
                next_column();
            }

            const x_shift = (column_idx * item_slot_column_width);
            const y_shift = -((column_slots * item_slots_vertical_space) + hexagonal_shift);

            ++column_slots;

            return this.position.translate({ x: item_slots_relative_position.x + x_shift, y: item_slots_relative_position.y + y_shift });
        };

        while(this._slots.length !== slot_count){
            const is_active = this._slots.length < this._active_slots_count;
            const item_slot = new ItemSlot(undefined, is_active ? slot_types.ACTIVE : slot_types.NORMAL, this.fx_view);

            item_slot.position = next_slot_position();

            this._slots.push(item_slot);
            if(this._slots.length <= previous_items.length){
                const previous_item = previous_items[this._slots.length -1];
                if(previous_item)
                    item_slot.set_item(previous_item);
            }
        }

        // Last slot is always the one to destroy items.
        next_column();
        this.destroy_item_slot = new ItemSlot(undefined, slot_types.DESTROY, this.fx_view);
        this.destroy_item_slot.position = next_slot_position().translate({ x: 20 });
        this._slots.push(this.destroy_item_slot);
        this.destroy_item_slot.idx = this._slots.length - 1;
    }

    _reset_items(inventory){
        debug.assertion(()=>inventory instanceof Inventory);
        const items = inventory.stored_items;
        debug.assertion(()=>items instanceof Array);
        debug.assertion(()=>this._slots.length >= items.length);

        this._slots.forEach(slot => slot.remove_item());

        for (const [item_idx, item] of items.entries()){
            if(item instanceof concepts.Item){
                this.set_item_view_at(item_idx, new ItemView(item));
            } else if(item instanceof Character){
                this.set_item_view_at(item_idx, new CharacterView(item));
            } else {
                debug.assertion(()=>!item);
                debug.assertion(()=>!this._slots[item_idx].item);
            }
        }

    }


};



