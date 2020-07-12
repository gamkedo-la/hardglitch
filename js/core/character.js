
export {
    Character,
}

import * as concepts from "./concepts.js";
import { FieldOfVision } from "./visibility.js";

const default_view_distance = 7;

// All characters types from the game must derive from this type.
// Provides everything common to all characters.
// Some rules will rely on properties provided there.
class Character extends concepts.Body {

    constructor(name){
        super(name);
        this.field_of_view = new FieldOfView(this.position, default_view_distance);
    }

    get position() { return super.position; }
    set position(new_pos) {
        super.position = new_pos;
        this.field_of_vision.position = this.position;
    }

    get view_distance(){ return this.field_of_vision.view_distance; }
    set view_distance(new_distance){
        console.assert(Number.isInteger(new_distance));
        this.field_of_vision.view_distance = new_distance;
    }

    update_perception(world){
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


