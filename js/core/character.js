
export {
    Character,
    CharacterStats,
    StatValue,
    Inventory,
}

import * as debug from "../system/debug.js";
import { Wait } from "../rules/rules-basic.js";
import { TakeItem } from "../rules/rules-items.js";
import { Move } from "../rules/rules-movement.js";
import * as concepts from "./concepts.js";
import { FieldOfVision } from "./visibility.js";

const default_view_distance = 1;
const default_inventory_size = 1;
const default_activable_items = 1;

const __statvalue_serialization_ignore_list = [
    "_cache_is_valid", "_cache"
];
class StatValue {

    constructor(initial_value = 0, initial_max, initial_min){
        debug.assertion(()=>Number.isInteger(initial_value));
        debug.assertion(()=>initial_max == null || Number.isInteger(initial_max));
        debug.assertion(()=>initial_min == null || Number.isInteger(initial_min));
        this._value = initial_value;
        this._max = initial_max;
        this._min = initial_min;
        this._modifiers = {};
        this._listeners = {};

        // these are for optimizations:
        this._cache_is_valid = {};
        this._cache = {};
        this.__serialization_ignore_list = __statvalue_serialization_ignore_list;
    }

    get real_value() { return this._value; }
    get real_max() { return this._max; }
    get real_min() { return this._min; }

    _accumulate_modifiers(field_name) {
        debug.assertion(()=>field_name === "value" || field_name === "max" || field_name === "min");
        return Object.values(this._modifiers)
                    .filter(modifier => modifier[field_name] != null)
                    .reduce((accumulated, modifier)=> accumulated + modifier[field_name], 0);
    }

    _compute_value_or_get_cache(field_name, compute){
        debug.assertion(()=> typeof field_name === "string");
        debug.assertion(()=> compute instanceof Function);

        if(this._cache_is_valid[field_name] === true){
            const cached_value = this._cache[field_name];
            debug.assertion(()=> Number.isInteger(cached_value));
            return cached_value;
        } else {
            const new_value = compute();
            this._cache[field_name] = new_value;
            this._cache_is_valid[field_name] = true;
            return new_value;
        }
    }

    _invalidate_cache(field_name) {
        if(field_name != null) {
            this._cache_is_valid[field_name] = false;
        } else {
            this._cache_is_valid = {};
        }
    }

    get accumulated_value_modifiers() {
        return this._accumulate_modifiers("value");
    }

    get accumulated_max_modifiers() {
        return this._accumulate_modifiers("max");
    }

    get accumulated_min_modifiers() {
        return this._accumulate_modifiers("min");
    }

    get value() {
        const compute_current_value = ()=>{
            let value = this._value + this.accumulated_value_modifiers;
            if(this.max != null){
                value = Math.min(value, this.max);
            }
            if(this.min != null){
                value = Math.max(value, this.min);
            }
            return value;
        };
        return this._compute_value_or_get_cache("value", compute_current_value);
     }
    get max() { return this._max == null ? null : this._compute_value_or_get_cache("max", ()=> this._max + this.accumulated_max_modifiers); }
    get min() { return this._min == null ? null : this._compute_value_or_get_cache("min", ()=> this._min + this.accumulated_min_modifiers); }

    add_modifier(modifier_id, modifier){

        debug.assertion(()=>typeof modifier_id === "string");

        debug.assertion(()=>modifier instanceof Object);
        debug.assertion(()=>modifier.value == null || Number.isInteger(modifier.value));
        // Min and Max must have been set for this stat to be able to be modified.
        debug.assertion(()=>modifier.max == null || (Number.isInteger(modifier.max) && this._max != null));
        debug.assertion(()=>modifier.min == null || (Number.isInteger(modifier.min) && this._min != null));

        this._modifiers[modifier_id] = modifier;
        this._invalidate_cache();
        this._notify_listeners();
    }

    remove_modifier(modifier_id){

        debug.assertion(()=>typeof modifier_id === "string");
        delete this._modifiers[modifier_id];
        this._invalidate_cache();
        debug.assertion(()=>this.max == null || this.min == null || this.min <= this.max);
        this._notify_listeners();
    }

    set real_value(new_value) {

        debug.assertion(()=>Number.isInteger(new_value) && new_value >= 0);

        if(this._max !== undefined){
            debug.assertion(()=>new_value <= this.max);
        }
        if(this._min !== undefined){
            debug.assertion(()=>new_value >= this.min);
        }

        this._value = new_value;
        this._invalidate_cache("value");
        this._notify_listeners();
    }

    set real_max(new_value) {
        debug.assertion(()=>Number.isInteger(new_value) && new_value >= 0);
        this._max = new_value;
        this._invalidate_cache("max");
        this._notify_listeners();
    }

    set real_min(new_value) {
        debug.assertion(()=>Number.isInteger(new_value) && new_value < this.max);
        this._min = new_value;
        this._invalidate_cache("min");
        this._notify_listeners();
    }

    increase(value_to_add){

        debug.assertion(()=>Number.isInteger(value_to_add) && value_to_add >= 0);
        const new_value = this.value + value_to_add;
        if(this.max !== undefined)
            this._value = Math.min(new_value, this.max);
        else
            this._value = new_value;
        this._invalidate_cache("value");
        this._notify_listeners();
    }

    decrease(value_to_sub){

        debug.assertion(()=>Number.isInteger(value_to_sub) && value_to_sub >= 0);
        const new_value = this.value - value_to_sub;
        if(this.min !== undefined)
            this._value = Math.max(new_value, this.min);
        else
            this._value = new_value;
        this._invalidate_cache("value");
        this._notify_listeners();
    }

    add_listener(listener_id, listener){
        debug.assertion(()=>typeof listener_id === "string");
        debug.assertion(()=>listener instanceof Function);
        debug.assertion(()=>this._listeners[listener_id] == null);
        this._listeners[listener_id] = listener;
        listener(this); // Make sure the listner is up to date.
    }

    remove_listener(listener_id){
        debug.assertion(()=>typeof listener_id === "string");
        delete this._listeners[listener_id];
    }

    _notify_listeners(){
        Object.values(this._listeners).forEach(listener => {
            this._invalidate_cache();
            listener(this)
        });
    }

};

// Statistics of the character.
// This is a separate class so that I can add tons of checks and make sure
// I'm not doing anything wrong when manipulating it.
class CharacterStats {

    integrity = new StatValue(10, 10, 0);       // Health, but for software.
    int_recovery = new StatValue(0);            // How much Integrity to restore each turn.

    action_points = new StatValue(10, 10);      // Action points (AP) are spent to perform actions. Can be negative.
    ap_recovery = new StatValue(10);            // How much AP to restore each turn.

    view_distance = new StatValue(default_view_distance, undefined, 0); // How far can the character perceive.
    inventory_size = new StatValue(default_inventory_size, undefined, 0); // How many items a character can store in inventory.
    activable_items = new StatValue(default_activable_items, undefined, 0); // How many inventory slots can active items.

    constructor(){
        this._on_deserialized();
    }
    _on_deserialized(){
        this.inventory_size.remove_listener("activable_items");
        this.inventory_size.add_listener("activable_items", (inventory_size)=>{
            this.activable_items.real_max = inventory_size.value;
        });
    }

};

const __inventory_serialization_ignore_list = ["stats"];

// Character's inventory, where to store Items.
class Inventory {
    _item_slots = [];
    _activable_items = 1;
    _listeners = {};
    _limbo = []; // Where the lost items ends-up.

    get __serialization_ignore_list() { return  __inventory_serialization_ignore_list; }

    connect_stats(stats){
        debug.assertion(()=>stats instanceof CharacterStats || stats == null);

        this.stats = stats;

        this.stats.inventory_size.remove_listener("inventory");
        this.stats.inventory_size.add_listener("inventory", (inventory_size)=>{
            debug.assertion(()=>inventory_size instanceof StatValue);
            if(this.size !== inventory_size.value){
                const left_items = this.resize(inventory_size.value);
                this._limbo.push(...left_items);
            }
        });

        this.stats.activable_items.remove_listener("inventory");
        this.stats.activable_items.add_listener("inventory", (activable_items)=>{
            debug.assertion(()=>activable_items instanceof StatValue);
            if(this._activable_items !== activable_items.value){
                this._activable_items = activable_items.value;
                debug.assertion(()=>Number.isInteger(this._activable_items));
            }
        });

    }

    extract_items_from_limbo() {
        const limbo = this._limbo;
        this._limbo = [];
        return limbo;
    }

    move_all_items_into_limbo() {
        this._item_slots
            .filter(item => item instanceof concepts.Entity)
            .forEach(item => this._limbo.push(item) );
        this._item_slots = [];
    }

    extract_all_items_slots() {
        const slots = this._item_slots;
        this._item_slots = [];
        this.resize(this.stats.inventory_size.value);
        return slots;
    }

    add(item){

        debug.assertion(()=>item instanceof concepts.Entity);
        debug.assertion(()=>this.have_empty_slots);

        // Put the item in the first free slot that is not an active slot.
        for(let idx = this._activable_items; idx < this._item_slots.length; ++idx){
            if(this._item_slots[idx] == null){
                this.set_item_at(idx, item);
                return idx;
            }
        }

        // Otherwise, put it in an active slot.
        for(let idx = 0; idx < this._activable_items; ++idx){
            if(this._item_slots[idx] == null){
                this.set_item_at(idx, item);
                return idx;
            }
        }

        throw "Couldn't find slot for item in inventory - Inconsistency detected, an addition action should never be possible if there is no space in the inventory";
    }

    set_item_at(idx, item){
        //
        debug.assertion(()=>idx >= 0 && idx < this._item_slots.length);
        debug.assertion(()=>item instanceof concepts.Entity);
        debug.assertion(()=>this._item_slots[idx] == null);
        this._item_slots[idx] = item;
        if(this.is_active_slot(idx)){
            this._activate(item);
        }
    }

    get_item_at(idx){
        debug.assertion(()=>idx >= 0 && idx < this._item_slots.length);
        return this._item_slots[idx];
    }

    _activate(item){
        debug.assertion(()=>item instanceof concepts.Entity);
        this._apply_modifiers(item);
        if(item.on_activated instanceof Function){
            item.on_activated();
        }
    }

    _deactivate(item){
        debug.assertion(()=>item instanceof concepts.Entity);
        this._reverse_modifiers(item);
        if(item.on_deactivated instanceof Function){
            item.on_deactivated();
        }
    }

    _apply_modifiers(item){
        debug.assertion(()=>item instanceof concepts.Entity);
        if(item.stats_modifiers instanceof Object){
            const modifier_id = `item_${item.id}`;
            for(const [stat_name, modifier_value] of Object.entries(item.stats_modifiers)){
                debug.assertion(()=>this.stats[stat_name] instanceof StatValue);
                this.stats[stat_name].add_modifier(modifier_id, modifier_value);
            }
        }
    }

    _reverse_modifiers(item){
        debug.assertion(()=>item instanceof concepts.Entity);
        if(item.stats_modifiers instanceof Object){
            const modifier_id = `item_${item.id}`;
            Object.keys(item.stats_modifiers).forEach(stat_name =>{
                debug.assertion(()=>this.stats[stat_name] instanceof StatValue);
                this.stats[stat_name].remove_modifier(modifier_id);
            });
        }
    }

    update_modifiers(){
        this._item_slots.slice(this._activable_items)
            .filter(item => item instanceof concepts.Entity)
            .forEach(item => this._deactivate(item));
        this._item_slots.slice(0, this._activable_items)
            .filter(item => item instanceof concepts.Entity)
            .forEach(item => this._activate(item));
    }

    remove(idx){
        debug.assertion(()=>idx >= 0 && idx < this._item_slots.length);
        const item = this._item_slots[idx];
        this._item_slots[idx] = undefined;
        if(item instanceof concepts.Entity
        && this.is_active_slot(idx)){
            this._deactivate(item);
        }
        return item;
    }

    swap(idx_a, idx_b){
        debug.assertion(()=>idx_a >= 0 && idx_a < this._item_slots.length);
        debug.assertion(()=>idx_b >= 0 && idx_b < this._item_slots.length);
        const a = this._item_slots[idx_a];
        const b = this._item_slots[idx_b];
        this._item_slots[idx_b] = a;
        this._item_slots[idx_a] = b;
        const is_slot_a_active = this.is_active_slot(idx_a);
        const is_slot_b_active = this.is_active_slot(idx_b);
        if(is_slot_a_active !== is_slot_b_active){
            if(is_slot_a_active){
                if(b instanceof concepts.Item)
                    this._activate(b);
                if(a instanceof concepts.Item)
                    this._deactivate(a);
            } else {
                if(a instanceof concepts.Item)
                    this._activate(a);
                if(b instanceof concepts.Item)
                    this._deactivate(b);
            }
        }
    }

    resize(new_size){
        debug.assertion(()=>Number.isInteger(new_size) && new_size >= 0);
        const previous_items = this._item_slots;
        const new_item_storage = new Array(new_size).fill(undefined);

        // Preserve as many items we can from the previous set
        for(let item_idx = 0; item_idx < new_item_storage.length; ++item_idx){
            if(item_idx === previous_items.length){
                break;
            }
            const item = previous_items[item_idx];
            new_item_storage[item_idx] = item;
            previous_items[item_idx] = undefined;
        }

        previous_items.slice(0, this._activable_items)
            .filter(item => item instanceof concepts.Entity)
            .forEach(item => this._deactivate(item));

        this._item_slots = new_item_storage;
        Object.seal(this._item_slots);

        // Return the items we couldn't put in the new inventory.
        const left_items = previous_items.filter(item => item instanceof concepts.Entity);
        while(this.have_empty_slots && left_items.length > 0){ // If we can still put the item somewhere, just put it there.
            this.add(left_items.pop());
        }
        debug.assertion(()=>left_items.length === 0 || this.have_empty_slots === false );
        return left_items;
    }

    get stored_items() { return this._item_slots; }
    get active_items() { return this._item_slots.slice(0, this._activable_items); }
    get size() { return this._item_slots.length; }

    get have_empty_slots() { return this._item_slots.some(item => item == null); }
    get is_full() { return !this.have_empty_slots; }
    get is_empty() { return this._item_slots.length === 0; }

    is_active_slot(idx){
        debug.assertion(()=>idx >= 0 && idx < this._item_slots.length);
        return idx < this._activable_items;
    }

    get_enabled_action_types_related_to(...action_types){
        debug.assertion(()=>action_types.length > 0 && action_types.every(action_type=> action_type.prototype instanceof concepts.Action));
        return this.get_all_enabled_action_types(type => {
            while(type){
                if(action_types.includes(type) || action_types.some(action_type => type.prototype instanceof action_type))
                    return true;
                if(type === type.prototype.constructor)
                    return false;
                type = type.prototype.constructor;
            }
        });
    }

    get_all_enabled_action_types(predicate = ()=>true){
        const enabled_action_types = [];
        this._item_slots.slice(0, this._activable_items)
            .filter(item => item instanceof concepts.Entity)
            .forEach(item => {
                if(item.get_enabled_action_types instanceof Function){
                    const types = item.get_enabled_action_types().filter(predicate);
                    enabled_action_types.push(...types);
                }
            });
        return enabled_action_types;
    }

};


const __character_serialization_ignore_list = [ ...concepts.__entity_serialization_ignore_list, "field_of_vision" ];

// All characters types from the game must derive from this type.
// Provides everything common to all characters.
// Some rules will rely on properties provided there.
class Character extends concepts.Body {
    stats = new CharacterStats();
    inventory = new Inventory();
    field_of_vision = new FieldOfVision(this.position, default_view_distance);


    get __serialization_ignore_list() { return __character_serialization_ignore_list; }

    constructor(name){
        super(name);
        this.skip_turn = true;
        this._on_deserialized();
    }

    _on_deserialized(){
        this.inventory.connect_stats(this.stats);
        this._reset_ownership_of_items_in_inventory();
    }

    _reset_ownership_of_items_in_inventory(world){
        const character = this;
        this.inventory.stored_items
            .forEach(item=> {
                if(item instanceof concepts.Item){
                    item.owner = character;
                    item.world = world
                }
            });
    }

    get position() { return super.position; }
    set position(new_pos) {
        super.position = new_pos;
        this._need_perception_update = true;
    }

    get is_virus() { return this.actor instanceof concepts.Actor && this.actor.is_virus === true; }

    update_perception(world){
        this.field_of_vision.position = this.position;
        this.field_of_vision.view_distance = this.stats.view_distance.value;
        this.field_of_vision.update(world);

        this._reset_ownership_of_items_in_inventory(world);

        this._need_perception_update = false;
    }

    can_see(...positions){
        return this.field_of_vision.is_visible(...positions);
    }

    can_see_any(...positions){
        return this.field_of_vision.is_any_visible(...positions);
    }

    // True if this body can perform actions (have an actor for decisions and have enough action points).
    get can_perform_actions(){
        return this.actor // Cannot perform actions if we don't have an actor to decide which action to perform.
            && this.stats.action_points.value > 0 // Perform actions until there is 0 points or less left.
            && this.skip_turn !== true
            ;
    }

    get next_turn_prediction_ap(){
        const prediction_ap = new StatValue(this.stats.action_points.value, this.stats.action_points.max, this.stats.action_points.min);
        const ap_to_recover = this.stats.ap_recovery.value;
        prediction_ap.increase(ap_to_recover);
        return prediction_ap.value;
    }

    get can_perform_actions_next_turn(){
        return this.actor && this.next_turn_prediction_ap > 0;
    }

    // Describe the possible positions relative to the current ones that could be reached in one step,
    // assuming there is no obstacles.
    // Should be overloaded by bodies that have limited sets of movements.
    // Returns an object: { move_id: target_position, another_move_name: another_position }
    allowed_moves(){ // By default: can go on the next square on north, south, east and west.
        return {
            move_east: this.position.east,
            move_west: this.position.west,
            move_north: this.position.north,
            move_south: this.position.south
        };
    }

    // Describe the possible positions relative to the current one where an item can be dropped by this character.
    allowed_drops() {
        return this.field_of_vision.filter_visible(...this.position.adjacents_diags); // Close to the character, and visible (which means valid to walk in, even if it's lethal).
    }

    // Properly performs an action after having spent the action points from the body etc.
    // Returns events resulting from performing the action.
    perform_action(action, world){
        debug.assertion(()=>action instanceof concepts.Action);
        debug.assertion(()=>world instanceof concepts.World);

        // Pay for this action
        debug.assertion(()=>action.constructor.costs instanceof Object);
        debug.assertion(()=>Number.isInteger(action.constructor.costs.action_points.value) && action.constructor.costs.action_points.value >= 0);
        this.stats.action_points.decrease(action.constructor.costs.action_points.value);

        // Make sure the item providing that action will be updated, if any:
        const item = this.inventory.active_items.find(item=> item instanceof concepts.Entity
                                                          && item.get_enabled_action_types instanceof Function
                                                          && item.get_enabled_action_types().some((action_type)=> action instanceof action_type)
                                                          );

        // Then execute the action:
        const action_result = action.execute(world, this);

        // Update the item.
        if(item && item.on_action_used instanceof Function){
            item.on_action_used();
        }
        return action_result;
    }

    take_damage(damage_count){ // TODO: maybe handle some kind of armor
        const initial_value = this.stats.integrity.value;
        this.stats.integrity.decrease(damage_count);
        const damage_taken = initial_value - this.stats.integrity.value;
        return damage_taken;
    }

    take_ap_damage(damage_count){ // TODO: maybe handle some kind of armor
        const initial_value = this.stats.action_points.value;
        this.stats.action_points.decrease(damage_count);
        const damage_taken = initial_value - this.stats.action_points.value;
        return damage_taken;
    }

    repair(integrity_amount){
        const initial_value = this.stats.integrity.value;
        this.stats.integrity.increase(integrity_amount);
        const repaired = this.stats.integrity.value - initial_value;
        return repaired;
    }

    restore_action_points(){
        this.skip_turn = false;
        const ap_to_recover = this.stats.ap_recovery.value;
        this.stats.action_points.increase(ap_to_recover);
        return ap_to_recover;
    }

    get_all_enabled_actions_types(){
        return [
            Wait, Move,
            ... this.inventory.get_all_enabled_action_types(),
            TakeItem,
        ];
    }

    get_enabled_action_types(){
        return this.get_all_enabled_actions_types();
    }

    get_enabled_action_types_related_to(...action_type){
        return this.inventory.get_enabled_action_types_related_to(...action_type);
    }

};


