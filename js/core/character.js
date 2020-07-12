
export {
    Character,
    CharacterStats,
}

import * as concepts from "./concepts.js";
import { FieldOfVision } from "./visibility.js";

const default_view_distance = 7;

// Character's inventory, where to store Items.
class Inventory {

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

        if(this.max){
            console.assert(new_value <= this.max);
        }
        if(this.min){
            console.assert(new_value >= this.min);
        }

        this._value = new_value;
    }

    increase(value_to_add){
        console.assert(Number.isInteger(value_to_add) && value_to_add >= 0);
        const new_value = this.value + value_to_add;
        if(this.max !== undefined)
            this._value = Math.max(new_value, this.max);
        else
            this._value = new_value;
    }

    decrease(value_to_sub){
        console.assert(Number.isInteger(value_to_sub) && value_to_sub >= 0);
        const new_value = this.value - value_to_sub;
        if(this.min !== undefined)
            this._value = Math.max(new_value, this.min);
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
        this.stats = new CharacterStats();
        this.field_of_vision = new FieldOfVision(this.position, default_view_distance);
    }

    get position() { return super.position; }
    set position(new_pos) {
        super.position = new_pos;
        this.field_of_vision.position = this.position;
    }

    update_perception(world){
        this.field_of_vision.view_distance = this.stats.view_distance.value;
        this.field_of_vision.update(world);
    }

    ////////////////////////////////
    // Action Point System here.
    action_points_left = 0;
    max_action_points = 0;

    // TODO: replace the following functions implementations with action point system!
    // BEWARE, this is a hack to simulate being able to act once per turn.
    acted_this_turn = false;


    // True if this body can perform actions (have an actor for decisions and have enough action points).
    get can_perform_actions(){ // TODO: use actual action points
        // Cannot perform actions if we don't have an actor to decide which action to perform.
        return this.actor && !this.acted_this_turn;
    }

    disable_further_actions(){
        this.acted_this_turn = true;
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
        // TODO: Spend the action points etc. HERE
        this.disable_further_actions(); // TEMPORARY/TODO: REPLACE THIS BY PROPER ACTION POINT SPENDING

        // Then execute the action:
        return action.execute(world, this);
    }


};


