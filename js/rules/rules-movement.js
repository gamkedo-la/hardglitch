// This file contains all the code describing the general rules of movement.

export {
    Rule_Movements,
    Move,
    Moved
}

import * as concepts from "../core/concepts.js";
import { BodyView, graphic_position } from "../game-view.js";


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

    constructor(move_name, new_position){
        console.assert(new_position);
        super(move_name, `Move to ${JSON.stringify(new_position)} (${move_name})`);
        this.new_position = new_position;
    }

    execute(world, body) {
        console.assert(body instanceof concepts.Body);
        const initial_pos = body.position;
        body.position = this.new_position;
        return [ new Moved(body, initial_pos, this.new_position) ];
    }
};


// Rule: can move (depending on what is arround).
// Movement can be done only 1 square per turn.
class Rule_Movements extends concepts.Rule {

    get_actions_for(body, world) {
        console.assert(body);
        console.assert(world);

        // TODO: change the rule below to make the possible moves dependent on the BODY characteristics
        const actions = {};

        const current_pos = body.position;
        console.assert(current_pos);

        const allowed_moves = body.allowed_moves();
        for(const move_id in allowed_moves){
            const move_target = allowed_moves[move_id];
            if(!world.is_blocked_position(move_target))
                actions[move_id] = new Move(move_id, move_target);
        }

        return actions;
    }

};


function * animation_move_event(body_view, new_position){
    console.assert(body_view instanceof BodyView)
    console.assert(new_position instanceof concepts.Position);
    // TODO: implement this with TWEENING instead of manually

    // Below we we'll work with graphic positions:
    const steps_count = 20;
    const target_gfx_pos = graphic_position(new_position);
    const translation_step = target_gfx_pos.substract(body_view.position).divide(steps_count);

    while(true){
        body_view.position = body_view.position.translate(translation_step);
        yield;
        const distance_left = body_view.position.distance(target_gfx_pos);
        if(distance_left < translation_step.length)
            break;
    }

    body_view.game_position = new_position;
}
