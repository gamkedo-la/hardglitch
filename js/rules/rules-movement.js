// This file contains all the code describing the general rules of movement.

export {
    Rule_Movements,
    Rule_Jump,
    Move,
    Moved
}

import * as concepts from "../core/concepts.js";
import { is_walkable } from "../definitions-tiles.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";
import * as tiles from "../definitions-tiles.js";
import { EntityView } from "../view/entity-view.js";
import { GameView } from "../game-view.js";


class Moved extends concepts.Event {
    constructor(entity, from_pos, to_pos) {
        console.assert(entity instanceof concepts.Entity);
        console.assert(from_pos instanceof concepts.Position);
        console.assert(to_pos instanceof concepts.Position);
        super({
            allow_parallel_animation: true,
            description: `Entity ${entity.id} Moved from ${JSON.stringify(from_pos)} to ${JSON.stringify(to_pos)}`
        });
        this.entity_id = entity.id;
        this.from_pos = from_pos;
        this.to_pos = to_pos;
    }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        console.assert(this.to_pos instanceof concepts.Position);
        game_view.focus_on_position(this.to_pos);
        yield* animations.move(entity_view, this.to_pos);
    }

};

class Move extends concepts.Action {
    icon_def = sprite_defs.icon_action_move;

    constructor(move_name, new_position){
        super(move_name, `Move to ${JSON.stringify(new_position)} (${move_name})`, new_position);
        this.is_basic = true;
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



class Jump extends concepts.Action {
    icon_def = sprite_defs.icon_action_move;

    constructor(target){
        super(`jump_${target.x}_${target.y}`, `Jump to ${JSON.stringify(target)}`, target);
    }

    execute(world, body){
        console.assert(body instanceof concepts.Body);
        const initial_pos = body.position;
        body.position = this.target_position;
        return [new Moved(body, initial_pos, this.target_position)]; // TODO: implement a different event, with a different animation
    }
}

class Rule_Jump extends concepts.Rule {

    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary
            return {};

        const possible_jumps = {
            rotate_ne : new Jump(body.position.north.east),
            rotate_se : new Jump(body.position.south.east),
            rotate_sw : new Jump(body.position.south.west),
            rotate_nw : new Jump(body.position.north.west),
            rotate_nene : new Jump(body.position.north.east.north.east),
            rotate_sese : new Jump(body.position.south.east.south.east),
            rotate_swsw : new Jump(body.position.south.west.south.west),
            rotate_nwnw : new Jump(body.position.north.west.north.west),
        };
        for(const [name, rotate] of Object.entries(possible_jumps)){
            if(world.is_blocked_position(rotate.target_position, tiles.is_walkable)){
                delete possible_jumps[name];
            }
        }
        return possible_jumps;
    }
};



// class Swaped extends concepts.Event {
//     constructor(entity_a, entity_b) {
//         console.assert(entity_a instanceof concepts.Entity);
//         console.assert(entity_b instanceof concepts.Entity);
//         console.assert(pos_a instanceof concepts.Position);
//         console.assert(pos_b instanceof concepts.Position);
//         super({
//             allow_parallel_animation: true,
//             description: `Entity ${entity_a.id} at ${JSON.stringify(entity_a.position)} and Entity ${entity_b.id} at ${JSON.stringify(entity_b.position)} exchanged position`
//         });
//         this.entity_a_id = entity_a.id;
//         this.entity_b_id = entity_b.id;
//     }

//     *animation(game_view){
//         console.assert(game_view instanceof GameView);
//         const entity_a_view = game_view.entity_views[this.entity_a_id];
//         console.assert(entity_a_view instanceof EntityView);
//         const entity_b_view = game_view.entity_views[this.entity_b_id];
//         console.assert(entity_b_view instanceof EntityView);
//         game_view.focus_on_position(entity_a_view.position);
//         yield* animations.swap(entity_a_view, entity_a_view);
//         game_view.focus_on_position(entity_a_view.position);
//     }

// };

// class Swap extends concepts.Action {
//     icon_def = sprite_defs.icon_action_move;

//     constructor(target){
//         super(`swap_${target.x}_${target.y}`, `Swap with ${JSON.stringify(target)}`, target);
//     }

//     execute(world, body){
//         console.assert(body instanceof concepts.Body);
//         const initial_pos = body.position;
//         body.position = this.target_position;
//         return [
//             new Swaped(body, initial_pos, this.target_position)
//         ];
//     }
// }


// class Rule_Swap extends concepts.Rule {

//     get_actions_for(body, world){
//         if(!body.is_player_actor) // TODO: temporary
//             return {};

//         const possible_swaps = {};
//         const range = 4; // TODO: make different kinds of actions that have different ranges
//         const center_pos = body.position;
//         for(let y = -range; y < range; ++y){
//             for(let x = -range; x < range; ++x){
//                 if((x == 0 && y == 0)  // Skip the character pushing
//                 // || (x != 0 && y != 0) // Skip any position not aligned with axes
//                 )
//                     continue;
//                 const target = new concepts.Position(new Vector2(center_pos).translate({x, y}));
//                 if(world.entity_at(target)){
//                     possible_swaps[`swap_${x}_${y}`] = new Swp(target);
//                 }
//             }
//         }
//         return possible_swaps;
//     }
// };
