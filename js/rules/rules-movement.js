
import * as concepts from "../core/concepts.js";
import { animation_wait_event } from "./rules-basic.js";

export { MovementRules, Move, Moved }

class Moved extends concepts.Event {
    constructor(body, from_pos, to_pos) {
        super(body.body_id);
        this.from_pos = from_pos;
        this.to_pos = to_pos;
    }

    *animation(body_view){
        yield* animation_move_event(body_view, this.to_pos);
    }

};

class Move extends concepts.Action {

    constructor(new_position){
        console.assert(new_position);
        super();
        this.new_position = new_position;
    }

    execute(world, body) {
        console.assert(body);
        const initial_pos = body.position;
        body.position = this.new_position;
        return [ new Moved(body, initial_pos, this.new_position) ];
    }
};


// Rule: can move (depending on what is arround).
// Movement can be done only 1 square per turn.
class MovementRules extends concepts.Rule {

    get_actions_for(body, world) {
        console.assert(body);
        console.assert(world);

        // TODO: change the rule below to make the possible moves dependent on the BODY characteristics
        let actions = {};

        // TODO: check if we CAN move (or not) in each direction, add actions accordingly
        // TEMPORARY HIDDEN WALLS (to remove when we have proper walls):
        const boundaries = { top : 0, left : 0, bottom : 10, right : 14 };

        const current_pos = body.position;
        console.assert(current_pos);

        if( current_pos.x > boundaries.left )   actions.move_west  = new Move(current_pos.west);
        if( current_pos.x < boundaries.right )  actions.move_east  = new Move(current_pos.east);
        if( current_pos.y > boundaries.top )    actions.move_north = new Move(current_pos.north);
        if( current_pos.y < boundaries.bottom ) actions.move_south = new Move(current_pos.south);

        return actions;
    }

};


function * animation_move_event(body_view, new_position){
    console.assert(new_position);
    // TODO: implement this with tweening instead of manually
    // For this first version we'll just stop a short time and teleport the
    // sprite to the right position.
    yield* animation_wait_event(body_view);
    body_view.game_position = new_position;
}
