// This file contains all the code describing the general rules of movement.

export {
    Rule_Movements,
    Move,
    Moved
}

import * as concepts from "../core/concepts.js";
import { CharacterView } from "../game-view.js";
import { is_walkable } from "../definitions-tiles.js";

class Moved extends concepts.Event {
    constructor(entity, from_pos, to_pos) {
        console.assert(entity instanceof concepts.Entity);
        console.assert(from_pos instanceof concepts.Position);
        console.assert(to_pos instanceof concepts.Position);
        super(entity.id, {
            allow_parallel_animation: true,
        });
        this.from_pos = from_pos;
        this.to_pos = to_pos;
    }

    *animation(body_view){
        yield* animation_move_event(body_view, this.to_pos);
    }

};

class Move extends concepts.Action {

    constructor(move_name, new_position){
        super(move_name, `Move to ${JSON.stringify(new_position)} (${move_name})`, new_position);
    }

    execute(world, body) {
        console.assert(body instanceof concepts.Body);
        const initial_pos = body.position;
        body.position = this.target_position;
        return [ new Moved(body, initial_pos, this.target_position) ];
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
            if(!world.is_blocked_position(move_target, is_walkable))
                actions[move_id] = new Move(move_id, move_target);
        }

        return actions;
    }

};


function* animation_move_event(character_view, new_position){
    console.assert(character_view instanceof CharacterView);
    console.assert(new_position instanceof concepts.Position);
    yield* character_view.move_animation(new_position);
}
