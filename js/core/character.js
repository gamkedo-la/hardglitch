
export {
    Character,
    CharacterStats,
    StatValue,
    Inventory,
}

import * as concepts from "./concepts.js";
import { FieldOfVision } from "./visibility.js";

const default_view_distance = 1;
const default_inventory_size = 1;
const default_equipable_items = 1;

class StatValue {

    constructor(initial_value, initial_max, initial_min){
        console.assert(Number.isInteger(initial_value) && initial_value >= 0);
        console.assert(initial_max === undefined || Number.isInteger(initial_max));
        console.assert(initial_min === undefined || Number.isInteger(initial_min));
        this._value = initial_value;
        this._max = initial_max;
        this._min = initial_min;
        this._modifiers = {};
        this._listeners = {};
    }

    get real_value() { return this._value; }
    get real_max() { return this._max; }
    get real_min() { return this._min; }

    _accumulate_modifiers(field_name) {
        console.assert(field_name === "value" || field_name === "max" || field_name === "min");
        return Object.values(this._modifiers)
                    .filter(modifier => modifier[field_name] !== undefined)
                    .reduce((accumulated, modifier)=> accumulated + modifier[field_name], 0);
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
        let value = this._value + this.accumulated_value_modifiers;
        if(this.max){
            value = Math.min(value, this.max);
        }
        if(this.min){
            value = Math.max(value, this.min);
        }
        return value;
     }
    get max() { return this._max === undefined ? undefined : this._max + this.accumulated_max_modifiers; }
    get min() { return this._min === undefined ? undefined : this._min + this.accumulated_min_modifiers; }

    add_modifier(modifier_id, modifier){

        console.assert(typeof modifier_id === "string");

        console.assert(modifier instanceof Object);
        console.assert(modifier.value === undefined || Number.isInteger(modifier.value));
        // Min and Max must have been set for this stat to be able to be modified.
        console.assert(modifier.max === undefined || (Number.isInteger(modifier.max) && this._max !== undefined));
        console.assert(modifier.min === undefined || (Number.isInteger(modifier.min) && this._min !== undefined));

        this._modifiers[modifier_id] = modifier;
        this._notify_listeners();
    }

    remove_modifier(modifier_id){

        console.assert(typeof modifier_id === "string");
        delete this._modifiers[modifier_id];
        console.assert(this.max === undefined || this.min === undefined || this.min <= this.max);
        this._notify_listeners();
    }

    set real_value(new_value) {

        console.assert(Number.isInteger(new_value) && new_value >= 0);

        if(this._max !== undefined){
            console.assert(new_value <= this.max);
        }
        if(this._min !== undefined){
            console.assert(new_value >= this.min);
        }

        this._value = new_value;
        this._notify_listeners();
    }

    set real_max(new_value) {
        console.assert(Number.isInteger(new_value) && new_value >= 0);
        this._max = new_value;
        this._notify_listeners();
    }

    set real_min(new_value) {

        console.assert(Number.isInteger(new_value) && new_value < this.max);
        this._min = new_value;
        this._notify_listeners();
    }

    increase(value_to_add){

        console.assert(Number.isInteger(value_to_add) && value_to_add >= 0);
        const new_value = this.value + value_to_add;
        if(this.max !== undefined)
            this._value = Math.min(new_value, this.max);
        else
            this._value = new_value;

        this._notify_listeners();
    }

    decrease(value_to_sub){

        console.assert(Number.isInteger(value_to_sub) && value_to_sub >= 0);
        const new_value = this.value - value_to_sub;
        if(this.min !== undefined)
            this._value = Math.max(new_value, this.min);
        else
            this._value = new_value;

            this._notify_listeners();
    }

    add_listener(listener_id, listener){
        console.assert(typeof listener_id === "string");
        console.assert(listener instanceof Function);
        console.assert(this._listeners[listener_id] === undefined);
        this._listeners[listener_id] = listener;
        listener(this); // Make sure the listner is up to date.
    }

    remove_listener(listener_id){
        console.assert(typeof listener_id === "string");
        delete this._listeners[listener_id];
    }

    _notify_listeners(){
        Object.values(this._listeners).forEach(listener => listener(this));
    }

};

// Statistics of the character.
// This is a separate class so that I can add tons of checks and make sure
// I'm not doing anything wrong when manipulating it.
class CharacterStats{

    integrity = new StatValue(10, 10, 0);       // Health, but for software.
    int_recovery = new StatValue(0);            // How much Integrity to restore each turn.

    action_points = new StatValue(10, 10);      // Action points (AP) are spent to perform actions. Can be negative.
    ap_recovery = new StatValue(10);            // How much AP to restore each turn.

    view_distance = new StatValue(default_view_distance); // How far can the character perceive.
    inventory_size = new StatValue(default_inventory_size, undefined, 0); // How many items a character can store in inventory.
    equipable_items = new StatValue(default_equipable_items, undefined, 0); // How many items a character can store in inventory.

    constructor(){
        this.inventory_size.add_listener("equipable_items", (inventory_size)=>{
            this.equipable_items.real_max = inventory_size.value;
        });
    }

};


// Character's inventory, where to store Items.
class Inventory {
    _items_stored = [];
    _equipable_items = 1;
    _listeners = {};

    constructor(stats){
        console.assert(stats instanceof CharacterStats);
        this.stats = stats;

        this._is_updating_equipable_depth = false;

        this.stats.inventory_size.add_listener("inventory", (inventory_size)=>{
            console.assert(inventory_size instanceof StatValue);
            if(this.size !== inventory_size.value){
                const left_items = this.resize(inventory_size.value);
                // TODO: put the items in an item limbo, handle them afterwards (drop or destroy)
            }
        });

        this.stats.equipable_items.add_listener("inventory", (equipable_items)=>{
            console.assert(equipable_items instanceof StatValue);
            if(this._equipable_items !== equipable_items.value){
                this._equipable_items = equipable_items.value;
                console.assert(Number.isInteger(this._equipable_items));
            }

        });
    }

    add(item){

        console.assert(item instanceof concepts.Item);
        console.assert(this.have_empty_slots);

        for(let idx = this._items_stored.length -1; idx >= 0; --idx){
            if(!this._items_stored[idx]){
                this.set_item_at(idx, item);
                return idx;
            }
        }
        throw "Couldn't find slot for item in inventory";
    }

    set_item_at(idx, item){
        //
        console.assert(idx >= 0 && idx < this._items_stored.length);
        console.assert(item instanceof concepts.Item);
        console.assert(this._items_stored[idx] === undefined);
        this._items_stored[idx] = item;
        if(this.is_equipable_slot(idx))
            this._apply_modifiers(item);
    }

    get_item_at(idx){
        console.assert(idx >= 0 && idx < this._items_stored.length);
        return this._items_stored[idx];
    }

    _apply_modifiers(item){
        console.assert(item instanceof concepts.Item);
        if(item.stats_modifiers instanceof Object){
            const modifier_id = `item_${item.id}`;
            for(const [stat_name, modifier_value] of Object.entries(item.stats_modifiers)){
                console.assert(this.stats[stat_name] instanceof StatValue);
                this.stats[stat_name].add_modifier(modifier_id, modifier_value);
            }
        }
    }

    _reverse_modifiers(item){
        console.assert(item instanceof concepts.Item);
        if(item.stats_modifiers instanceof Object){
            const modifier_id = `item_${item.id}`;
            Object.keys(item.stats_modifiers).forEach(stat_name =>{
                console.assert(this.stats[stat_name] instanceof StatValue);
                this.stats[stat_name].remove_modifier(modifier_id);
            });
        }
    }

    update_modifiers(){
        this._items_stored.slice(0, this._equipable_items)
            .filter(item => item instanceof concepts.Item)
            .forEach(item => this._apply_modifiers(item));
        this._items_stored.slice(this._equipable_items)
            .filter(item => item instanceof concepts.Item)
            .forEach(item => this._reverse_modifiers(item));
    }

    remove(idx){
        console.assert(idx >= 0 && idx < this._items_stored.length);
        const item = this._items_stored[idx];
        if(item instanceof concepts.Item
        && this.is_equipable_slot(idx)){
            this._reverse_modifiers(item);
        }
        this._items_stored[idx] = undefined;
        return item;
    }

    swap(idx_a, idx_b){
        console.assert(idx_a >= 0 && idx_a < this._items_stored.length);
        console.assert(idx_b >= 0 && idx_b < this._items_stored.length);
        const a = this._items_stored[idx_a];
        const b = this._items_stored[idx_b];
        this._items_stored[idx_b] = a;
        this._items_stored[idx_a] = b;
        const is_slot_a_equipable = this.is_equipable_slot(idx_a);
        const is_slot_b_equipable = this.is_equipable_slot(idx_b);
        if(is_slot_a_equipable !== is_slot_b_equipable){
            if(is_slot_a_equipable){
                if(b instanceof concepts.Item)
                    this._apply_modifiers(b);
                if(a instanceof concepts.Item)
                    this._reverse_modifiers(a);
            } else {
                if(a instanceof concepts.Item)
                    this._apply_modifiers(a);
                if(b instanceof concepts.Item)
                    this._reverse_modifiers(b);
            }
        }
        // TODO: return objects from limbo because of listeners.
    }

    resize(new_size){
        console.assert(Number.isInteger(new_size) && new_size >= 0);
        const previous_items = this._items_stored;
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

        previous_items.slice(0, this._equipable_items)
            .filter(item => item instanceof concepts.Item)
            .forEach(item => this._reverse_modifiers(item));

        this._items_stored = new_item_storage;
        Object.seal(this._items_stored);

        // Return the items we couldn't put in the new inventory.
        return previous_items.filter(item => item instanceof concepts.Item);
    }

    get stored_items() { return this._items_stored; }
    get size() { return this._items_stored.length; }

    get have_empty_slots() { return this._items_stored.some(item => item === undefined); }
    get is_full() { return !this.have_empty_slots; }
    get is_empty() { return this._items_stored.length === 0; }

    is_equipable_slot(idx){
        console.assert(idx >= 0 && idx < this._items_stored.length);
        return idx < this._equipable_items;
    }

    get_enabled_action_types(action_type){
        console.assert(action_type && action_type.prototype instanceof concepts.Action);
        const enabled_action_types = [];
        this._items_stored.slice(0, this._equipable_items).filter(item => item instanceof concepts.Item)
            .forEach(item => enabled_action_types.push(...item.get_enabled_action_types(action_type)));
        return enabled_action_types;
    }

};


// All characters types from the game must derive from this type.
// Provides everything common to all characters.
// Some rules will rely on properties provided there.
class Character extends concepts.Body {
    stats = new CharacterStats();
    inventory = new Inventory(this.stats);
    field_of_vision = new FieldOfVision(this.position, default_view_distance);

    constructor(name){
        super(name);
        this.skip_turn = false;
    }

    get position() { return super.position; }
    set position(new_pos) {
        super.position = new_pos;
    }

    update_perception(world){
        this.field_of_vision.position = this.position;
        this.field_of_vision.view_distance = this.stats.view_distance.value;
        this.field_of_vision.update(world);
    }

    can_see(...positions){
        return this.field_of_vision.is_visible(...positions);
    }

    // True if this body can perform actions (have an actor for decisions and have enough action points).
    get can_perform_actions(){
        return this.actor // Cannot perform actions if we don't have an actor to decide which action to perform.
            && this.stats.action_points.value > 0 // Perform actions until there is 0 points or less left.
            && this.skip_turn !== true
            ;
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
        return this.field_of_vision.filter_visible(...Object.values(this.allowed_moves())); // Close to the character, and visible (which means valid to walk in, even if it's lethal).
    }

    // Properly performs an action after having spent the action points from the body etc.
    // Returns events resulting from performing the action.
    perform_action(action, world){
        console.assert(action instanceof concepts.Action);
        console.assert(world instanceof concepts.World);

        // Pay for this action
        console.assert(action.costs instanceof Object);
        console.assert(Number.isInteger(action.costs.action_points) && action.costs.action_points >= 0);
        this.stats.action_points.decrease(action.costs.action_points);

        // Then execute the action:
        return action.execute(world, this);
    }

    take_damage(damage_count){ // TODO: maybe handle some kind of armor
        this.stats.integrity.decrease(damage_count);
    }

    repair(integrity_amount){
        this.stats.integrity.increase(integrity_amount);
    }

    restore_action_points(){
        this.skip_turn = false;
        const ap_to_recover = this.stats.ap_recovery.value;
        this.stats.action_points.increase(ap_to_recover);
        return ap_to_recover;
    }

};


