// This file contains all the code describing the general rules of movement.

export {
    Rule_Movements,
    Rule_Jump,
    Rule_Swap,
    Move,
    Moved
}

import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";
import { EntityView } from "../view/entity-view.js";
import { GameView } from "../game-view.js";
import { Vector2 } from "../system/spatial.js";
import { Character } from "../core/character.js";
import * as visibility from "../core/visibility.js";

// Set the action as unsafe if the target tile is unsafe.
function safe_if_safe_arrival(move_action, world){
    const tiles_under_target = world.tiles_at(move_action.target_position);
    move_action.is_safe = tiles_under_target.some(tiles.is_safe);
}


class Moved extends concepts.Event {
    constructor(entity, from_pos, to_pos, duration) {
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
        this.duration = duration;
    }

    get focus_positions() { return [ this.from_pos, this.to_pos ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.get_entity_view(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        console.assert(this.to_pos instanceof concepts.Position);
        yield* animations.move(entity_view, this.to_pos, this.duration);
    }

};

class Move extends concepts.Action {
    icon_def = sprite_defs.icon_action_move;

    constructor(move_name, new_position){
        super(move_name, `Move to ${JSON.stringify(new_position)}`, new_position, 5);
        this.is_basic = true;
    }

    execute(world, character) {
        console.assert(character instanceof Character);
        const initial_pos = character.position;
        character.position = this.target_position;
        const move_event = new Moved(character, initial_pos, this.target_position);
        move_event.allow_parallel_animation = this.is_safe; // If that move is not safe, make it more noticeable when done.
        return [ move_event ];
    }
};


// Rule: can move (depending on what is arround).
// Movement can be done only 1 square per turn.
class Rule_Movements extends concepts.Rule {

    get_actions_for(character, world) {
        console.assert(character);
        console.assert(world);

        const actions = {};

        const current_pos = character.position;
        console.assert(current_pos);

        const allowed_moves = character.allowed_moves(); // TODO: filter to what's visible
        for(const move_id in allowed_moves){
            const move_target = allowed_moves[move_id];
            if(!world.is_blocked_position(move_target, tileid => tiles.is_walkable(tileid))
            && character.can_see(move_target)
            ){
                const move = new Move(move_id, move_target);
                safe_if_safe_arrival(move, world);
                move.range = this.range;
                actions[move_id] = move;
            }
        }

        return actions;
    }

};



class Jump extends concepts.Action {
    icon_def = sprite_defs.icon_action_move;

    constructor(target){
        super(`jump_${target.x}_${target.y}`, `Jump to ${JSON.stringify(target)}`, target, 6);
        this.is_basic = true;
    }

    execute(world, character){
        console.assert(character instanceof Character);
        const initial_pos = character.position;
        character.position = this.target_position;
        const move_event = new Moved(character, initial_pos, this.target_position, 666);
        move_event.allow_parallel_animation = false; // Never mix a jump animation with other moves.
        return [move_event]; // TODO: implement a different event, with a different animation
    }
}

class Rule_Jump extends concepts.Rule {
    range = new visibility.Range_Cross_Star(3, 4);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        if(!character.is_player_actor) // TODO: temporary
            return {};

        const possible_jumps = {};
        visibility.valid_move_positions(world, character, this.range, tiles.is_walkable)
            .forEach( (target)=>{
                const jump = new Jump(target);
                safe_if_safe_arrival(jump, world);
                jump.range = this.range;
                possible_jumps[jump.id] = jump;
            });
        return possible_jumps;
    }
};



class Swaped extends concepts.Event {
    constructor(entity_a_id, entity_b_id, pos_a, pos_b) {
        console.assert(Number.isInteger(entity_a_id));
        console.assert(Number.isInteger(entity_a_id));
        console.assert(pos_a instanceof concepts.Position);
        console.assert(pos_b instanceof concepts.Position);
        super({
            allow_parallel_animation: false,
            description: `Entity ${entity_a_id} at ${JSON.stringify(pos_a)} and Entity ${entity_b_id} at ${JSON.stringify(pos_b)} exchanged position`
        });
        this.entity_a_id = entity_a_id;
        this.entity_b_id = entity_b_id;
        this.pos_a = pos_a;
        this.pos_b = pos_b;
    }

    get focus_positions() { return [ this.pos_a, this.pos_ ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_a_view = game_view.entity_views[this.entity_a_id];
        console.assert(entity_a_view instanceof EntityView);
        const entity_b_view = game_view.entity_views[this.entity_b_id];
        console.assert(entity_b_view instanceof EntityView);
        console.assert(this.pos_a.equals(entity_a_view.game_position));
        console.assert(this.pos_b.equals(entity_b_view.game_position));

        yield* animations.swap(entity_a_view, entity_b_view, animations.default_move_duration_ms * 2);
    }

};

class Swap extends concepts.Action {
    icon_def = sprite_defs.icon_action_swap;

    constructor(target){
        console.assert(target instanceof concepts.Position);
        super(`swap_${target.x}_${target.y}`, `Swap with ${JSON.stringify(target)}`, target, 10);
        this.target = target
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const target_entity = world.entity_at(this.target);
        console.assert(target_entity instanceof concepts.Entity);

        const pos_a = character.position;
        const pos_b = target_entity.position;

        character.position = pos_b;
        target_entity.position = pos_a;

        return [
            new Swaped(character.id, target_entity.id, pos_a, pos_b)
        ];
    }
}


class Rule_Swap extends concepts.Rule {
    range = new visibility.Range_Diamond(1, 4);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        if(!character.is_player_actor) // TODO: temporary
            return {};

        const possible_swaps = {};
        visibility.valid_target_positions(world, character, this.range)
            .forEach(target => {
                const swap = new Swap(target);
                swap.range = this.range;
                possible_swaps[`swap_${target.x}_${target.y}`] = swap;
            });
        return possible_swaps;
    }
};
