
export {
    Character,
    CharacterStats,
}

import * as concepts from "./concepts.js";
import { FieldOfVision } from "./visibility.js";

const default_view_distance = 1;

// Character's inventory, where to store Items.
class Inventory {
    _items_stored = [];
    _equipped_items = [];

    add(item){
        console.assert(item instanceof concepts.Item);
        this._items_stored.push(item);
    }

    get stored_items() { return this._items_stored; }

    get is_full() { return false; } // TODO: add a limit to how many stuffs we can store in a character's body.

};

class StatValue {

    constructor(initial_value, initial_max, initial_min){
        console.assert(Number.isInteger(initial_value) && initial_value >= 0);
        console.assert(initial_max === undefined || Number.isInteger(initial_max));
        console.assert(initial_min === undefined || Number.isInteger(initial_min));
        this._value = initial_value;
        this._max = initial_max;
        this._min = initial_min;
        this.modifiers = {};
    }

    get real_value() { return this.value; }
    get accumulated_modifiers() { return Object.values(this.modifiers).reduce((accumulated, value)=> accumulated + value, 0); }
    get value() { return this._value + this.accumulated_modifiers; }
    get max() { return this._max; }
    get min() { return this._min; }

    add_modifier(modifier_id, modifier_value){
        console.assert(Number.isInteger(modifier_id));
        console.assert(Number.isInteger(modifier_value));
    }

    remove_modifier(modifier_id){
        console.assert(Number.isInteger(modifier_id));
        delete this.modifiers[modifier_id];
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
    }

    increase(value_to_add){
        console.assert(Number.isInteger(value_to_add) && value_to_add >= 0);
        const new_value = this.value + value_to_add;
        if(this._max !== undefined)
            this._value = Math.min(new_value, this._max);
        else
            this._value = new_value;
    }

    decrease(value_to_sub){
        console.assert(Number.isInteger(value_to_sub) && value_to_sub >= 0);
        const new_value = this.value - value_to_sub;
        if(this._min !== undefined)
            this._value = Math.max(new_value, this._min);
        else
            this._value = new_value;
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
};

// All characters types from the game must derive from this type.
// Provides everything common to all characters.
// Some rules will rely on properties provided there.
class Character extends concepts.Body {

    constructor(name, stats){
        console.assert(stats instanceof CharacterStats);
        super(name);
        this.stats = stats;
        this.inventory = new Inventory();
        this.field_of_vision = new FieldOfVision(this.position, default_view_distance);
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
            ;
    }

    disable_further_actions(){
        this.action_points.value = 0;
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


    // Properly performs an action after having spent the action points from the body etc.
    // Returns events resulting from performing the action.
    perform_action(action, world){
        console.assert(action instanceof concepts.Action);
        console.assert(world instanceof concepts.World);

        // Pay for this action
        console.assert(Number.isInteger(action.cost) && action.cost >= 0);
        this.stats.action_points.decrease(action.cost);

        // Then execute the action:
        return action.execute(world, this);
    }

    take_damage(damage_count){ // TODO: maybe handle some kind of armor
        this.stats.integrity.decrease(damage_count);
    }

    repair(integrity_amount){
        this.stats.integrity.increase(integrity_amount);
    }

};


