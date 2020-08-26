
export {
    Character,
    CharacterStats,
    StatValue,
    Inventory,
}

import * as concepts from "./concepts.js";
import { FieldOfVision } from "./visibility.js";

const default_view_distance = 1;
const default_inventory_size = 5;

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

    get real_value() { return this.value; }
    get accumulated_modifiers() { return Object.values(this._modifiers).reduce((accumulated, value)=> accumulated + value, 0); }
    get value() { return this._value + this.accumulated_modifiers; }
    get max() { return this._max; }
    get min() { return this._min; }

    add_modifier(modifier_id, modifier_value){
        console.assert(typeof modifier_id === "string");
        console.assert(Number.isInteger(modifier_value));
        console.assert(this._modifiers[modifier_id] === undefined);
        this._modifiers[modifier_id] = modifier_value;
        this._notify_listeners();
    }

    remove_modifier(modifier_id){
        console.assert(typeof modifier_id === "string");
        delete this._modifiers[modifier_id];
    }

    set value(new_value) {
        console.assert(Number.isInteger(new_value) && new_value >= 0);

        if(this._max){
            console.assert(new_value <= this.max);
        }
        if(this._min){
            console.assert(new_value >= this.min);
        }

        this._value = new_value;
        this._notify_listeners();
    }

    set max(new_value) {
        console.assert(Number.isInteger(new_value) && new_value >= 0);
        this._max = new_value;
        this._notify_listeners();
    }

    set min(new_value) {
        console.assert(Number.isInteger(new_value) && new_value < this.max);
        this._min = new_value;
        this._notify_listeners();
    }

    increase(value_to_add){
        console.assert(Number.isInteger(value_to_add) && value_to_add >= 0);
        const new_value = this.value + value_to_add;
        if(this._max !== undefined)
            this._value = Math.min(new_value, this._max);
        else
            this._value = new_value;
        this._notify_listeners();
    }

    decrease(value_to_sub){
        console.assert(Number.isInteger(value_to_sub) && value_to_sub >= 0);
        const new_value = this.value - value_to_sub;
        if(this._min !== undefined)
            this._value = Math.max(new_value, this._min);
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
        delete this._listeners[modifier_id];
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
    int_recovery = new StatValue(1);            // How much Integrity to restore each turn.

    action_points = new StatValue(10, 10);      // Action points (AP) are spent to perform actions. Can be negative.
    ap_recovery = new StatValue(10);            // How much AP to restore each turn.

    view_distance = new StatValue(default_view_distance); // How far can the character perceive.
    inventory_size = new StatValue(default_inventory_size, undefined, 0); // How many items a character can store in inventory.
};


// Character's inventory, where to store Items.
class Inventory {
    _items_stored = [];
    _equipped_items = [];
    _listeners = {};

    add(item){
        console.assert(item instanceof concepts.Item);
        console.assert(this.have_empty_slots);

        for(let idx = 0; idx < this._items_stored.length; ++idx){
            if(!this._items_stored[idx]){
                this._items_stored[idx] = item;
                this._notify_listeners();
                return idx;
            }
        }
        throw "Couldn't find slot for item in inventory";
    }

    set_item_at(idx, item){
        console.assert(idx >= 0 && idx < this._items_stored.length);
        console.assert(item instanceof concepts.Item);
        console.assert(this._items_stored[idx] === undefined);
        this._items_stored[idx] = item;
        this._notify_listeners();
    }

    get_item_at(idx){
        console.assert(idx >= 0 && idx < this._items_stored.length);
        return this._items_stored[idx];
    }

    remove(idx){
        console.assert(idx >= 0 && idx < this._items_stored.length);
        const item = this._items_stored[idx];
        this._items_stored[idx] = undefined;
        this._notify_listeners();
        return item;
    }

    resize(new_size){
        console.assert(Number.isInteger(new_size) && new_size >= 0);
        const previous_items = this._items_stored;
        this._items_stored = new Array(new_size).fill(undefined);
        Object.seal(this._items_stored);

        // Preserve as many items we can from the previous set
        for(let item_idx = 0; item_idx < this._items_stored.length; ++item_idx){
            if(item_idx === previous_items.length){
                // Return the items we couldn't put in the new inventory.
                return previous_items;
            }
            const item = previous_items[item_idx];
            this._items_stored[item_idx] = item;
            previous_items[item_idx] = undefined;
        }
        this._notify_listeners();
    }

    get stored_items() { return this._items_stored; }
    get size() { return this._items_stored.length; }

    get have_empty_slots() { return this._items_stored.some(item => item === undefined); }
    get is_full() { return !this.have_empty_slots; }



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

    get_enabled_action_types(action_type){
        console.assert(action_type && action_type.prototype instanceof concepts.Action);
        const enabled_action_types = [];
        this._items_stored.filter(item => item instanceof concepts.Item)
            .forEach(item => enabled_action_types.push(...item.get_enabled_action_types(action_type)));
        return enabled_action_types;
    }

};


// All characters types from the game must derive from this type.
// Provides everything common to all characters.
// Some rules will rely on properties provided there.
class Character extends concepts.Body {
    stats = new CharacterStats();
    inventory = new Inventory();
    field_of_vision = new FieldOfVision(this.position, default_view_distance);

    constructor(name){
        super(name);
        this.skip_turn = false;

        this.stats.inventory_size.add_listener("inventory", (inventory_size)=>{
            console.assert(inventory_size instanceof StatValue);
            if(this.inventory.size !== inventory_size.value){
                this.inventory.resize(inventory_size.value);
            }
        });
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


