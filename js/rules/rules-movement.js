// This file contains all the code describing the general rules of movement.

export {
    Rule_Movements,
    Rule_Jump,
    Rule_RandomJump,
    Rule_Swap,
    Rule_Crawling,
    Move,
    Moved,
    Jump,
    Jumped,
    RandomJump,
    FreeJump,
    Swap,
    Swaped,
    Crawl,
    random_jump,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";
import { EntityView } from "../view/entity-view.js";
import { GameView } from "../game-view.js";
import { Character } from "../core/character.js";
import * as visibility from "../core/visibility.js";
import { ranged_actions_for_each_target, actions_for_each_target, add_default_action_if_adjacent } from "./rules-common.js";
import { auto_newlines, lazy_call, random_sample } from "../system/utility.js";
import { is_blocked_position } from "../definitions-world.js";
import { desc_chars_per_line } from "../definitions-texts.js";

const move_range = new visibility.Range_Cross_Axis(1,2); // TODO: obtain that from the bodie's data!
const crawl_range = new visibility.Range_Cross_Diagonal(1,2); // TODO: obtain that from the bodie's data!
const jump_range = new visibility.Range_Cross_Star(3, 4);
const swap_range = new visibility.Range_Diamond(1, 4);
const free_jump_range = new visibility.Range_Square(1, 4);

const move_base_cost = 10;

// Set the action as unsafe if the target tile is unsafe.
function safe_if_safe_arrival(move_action, world){
    const tiles_under_target = world.tiles_at(move_action.target_position);
    move_action.is_safe = tiles_under_target.some(tile_id => Number.isInteger(tile_id) && tiles.is_safe(tile_id));
}


class Moved extends concepts.Event {
    constructor(entity, from_pos, to_pos, duration) {
        debug.assertion(()=>entity instanceof concepts.Entity);
        debug.assertion(()=>from_pos instanceof concepts.Position);
        debug.assertion(()=>to_pos instanceof concepts.Position);
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
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        if(!(entity_view instanceof EntityView)) // FIXME: why does this happen?
            return;
        debug.assertion(()=>entity_view instanceof EntityView);
        debug.assertion(()=>this.to_pos instanceof concepts.Position);
        yield* animations.move(game_view.fx_view, entity_view, this.to_pos, this.duration);
    }

};

class Move extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_move; }
    static get action_type_name() { return "Move"; }
    static get action_type_description() { return auto_newlines("Move this character on the target memory section.", desc_chars_per_line); }
    static get range(){ return move_range; }
    static get costs(){
        return {
            action_points: { value: move_base_cost },
        };
    }

    constructor(move_name, new_position, desc= `Move to this memory section`){
        super(move_name, desc, new_position);
        this.is_basic = true;
    }

    execute(world, character) {
        debug.assertion(()=>character instanceof Character);
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
        debug.assertion(()=>character);
        debug.assertion(()=>world);

        const actions = {};

        const current_pos = character.position;
        debug.assertion(()=>current_pos);

        const allowed_moves = character.allowed_moves(); // TODO: filter to what's visible
        for(const [move_id, move_target] of Object.entries(allowed_moves)){
            if(!is_blocked_position(world, move_target, tiles.is_walkable)
            && character.can_see(move_target)
            ){
                const move = new Move(move_id, move_target);
                safe_if_safe_arrival(move, world);
                actions[move_id] = move;
                add_default_action_if_adjacent(character.position, actions, move, move_target)
            }
        }

        return actions;
    }

};


class Crawl extends Move {
    static get action_type_name() { return "Crawl"; }
    static get action_type_description() { return auto_newlines("Move this character on the target memory section, by crawling awkwardly.", desc_chars_per_line); }
    static get range(){ return crawl_range; }

    constructor(target){
        super(`crawl_tp_${target.x}_${target.y}`, target, `Crawl to this memory section`);
    }
};

class Rule_Crawling extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        const valid_targets = (range) => lazy_call(visibility.valid_move_positions, world, character, range, tiles.is_walkable);
        const possible_crawls = actions_for_each_target(character, Crawl, valid_targets, (crawl_type, target)=>{
            const crawl = new crawl_type(target);
            safe_if_safe_arrival(crawl, world);
            return crawl;
        });
        Object.values(possible_crawls).forEach(action=> add_default_action_if_adjacent(character.position, possible_crawls, action, action.target_position, true))
        return possible_crawls;
    }
};



class Jumped extends concepts.Event {
    constructor(entity, from_pos, to_pos, duration=666) {
        debug.assertion(()=>entity instanceof concepts.Entity);
        debug.assertion(()=>from_pos instanceof concepts.Position);
        debug.assertion(()=>to_pos instanceof concepts.Position);
        super({
            allow_parallel_animation: false,
            description: `Entity ${entity.id} Jumped from ${JSON.stringify(from_pos)} to ${JSON.stringify(to_pos)}`
        });
        this.entity_id = entity.id;
        this.from_pos = from_pos;
        this.to_pos = to_pos;
        this.duration = duration;
    }

    get focus_positions() { return [ this.from_pos, this.to_pos ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        if(!(entity_view instanceof EntityView)) // FIXME: why does this happen?
            return;
        debug.assertion(()=>entity_view instanceof EntityView);
        debug.assertion(()=>this.to_pos instanceof concepts.Position);
        yield* animations.jump(game_view.fx_view, entity_view, this.to_pos);
    }

};

class Jump extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_move; }
    static get action_type_name() { return "Jump"; }
    static get action_type_description() { return auto_newlines("Transfers data and execution thread of this character to a remote target readable memory section.", desc_chars_per_line); }
    static get range() { return jump_range; }
    static get costs(){
        return {
            action_points: { value: move_base_cost * 2 },
        };
    }

    constructor(target){
        super(`jump_${target.x}_${target.y}`, `Jump to this memory section`, target);
        this.is_basic = true;
    }

    execute(world, character){
        debug.assertion(()=>character instanceof Character);
        const initial_pos = character.position;
        character.position = this.target_position;
        const move_event = new Jumped(character, initial_pos, this.target_position);
        move_event.allow_parallel_animation = false; // Never mix a jump animation with other moves.
        return [move_event]; // TODO: implement a different event, with a different animation
    }
};

class FreeJump extends Jump {
    static get action_type_name() { return "Free Jump"; }
    static get range() { return free_jump_range; }
    static get action_type_description() { return auto_newlines(`${super.action_type_description} More precise and different range than a simple Jump.`, 32); }
}

class Rule_Jump extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        const valid_targets = (range) => lazy_call(visibility.valid_move_positions, world, character, range, tiles.is_walkable);
        const possible_jumps = actions_for_each_target(character, Jump, valid_targets, (jump_type, target)=>{
            const jump = new jump_type(target);
            safe_if_safe_arrival(jump, world);
            return jump;
        });
        return possible_jumps;
    }
};


const random_jump_shape = new visibility.Range_Square(3, 64);

function random_jump(world, entity, range, position_predicate = ()=>true){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>entity instanceof concepts.Entity);
    debug.assertion(()=>range instanceof visibility.RangeShape);
    debug.assertion(()=>position_predicate instanceof Function);
    const initial_pos = entity.position;
    const possible_targets = visibility.positions_in_range(entity.position, range, pos => world.is_valid_position(pos))
                                .filter(position_predicate);
    const random_position = random_sample(possible_targets);
    entity.position = random_position;
    const move_event = new Jumped(entity, initial_pos, random_position);
    move_event.allow_parallel_animation = false; // Never mix a jump animation with other moves.
    return [move_event]; // TODO: implement a different event, with a different animation
}

class RandomJump extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_move; }
    static get action_type_name() { return "RandomJump"; }
    static get action_type_description() { return auto_newlines("Transfers data and execution of this character to a random memory section, even if unreachable.", desc_chars_per_line); }
    static get costs(){
        return {
            action_points: { value: 20 },
        };
    }

    constructor(){
        super(`random_jump`, `Random Jump`, undefined);
        this.is_basic = false;
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        // Only jump where the character can see.
        const position_predicate = pos => !is_blocked_position(world, pos, tiles.is_walkable)
                                       && character.can_see(pos);
        return random_jump(world, character, random_jump_shape, position_predicate);
    }
};

class Rule_RandomJump extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        const random_jump_actions = character.inventory.get_enabled_action_types_related_to(RandomJump).reverse();
        const events = {};
        while(random_jump_actions.length){
            const action_type = random_jump_actions.pop();
            const jump_action = new action_type();
            events[jump_action.id] = jump_action;
        }
        return events;
    }
};



class Swaped extends concepts.Event {
    constructor(entity_a_id, entity_b_id, pos_a, pos_b) {
        debug.assertion(()=>Number.isInteger(entity_a_id));
        debug.assertion(()=>Number.isInteger(entity_a_id));
        debug.assertion(()=>pos_a instanceof concepts.Position);
        debug.assertion(()=>pos_b instanceof concepts.Position);
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
        debug.assertion(()=>game_view instanceof GameView);
        const entity_a_view = game_view.focus_on_entity(this.entity_a_id);
        // debug.assertion(()=>entity_a_view instanceof EntityView);
        const entity_b_view = game_view.get_entity_view(this.entity_b_id);
        // debug.assertion(()=>entity_b_view instanceof EntityView);
        if(entity_a_view instanceof EntityView && entity_b_view instanceof EntityView){ // FIXME: why does this happen?
            debug.assertion(()=>this.pos_a.equals(entity_a_view.game_position));
            debug.assertion(()=>this.pos_b.equals(entity_b_view.game_position));
            yield* animations.swap(game_view.fx_view, entity_a_view, entity_b_view, animations.default_move_duration_ms * 2);
        }
        game_view.focus_on_entity(this.entity_a_id);
    }

};

class Swap extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_swap; }
    static get action_type_name() { return "Swap"; }
    static get action_type_description() { return auto_newlines("Exchange position with the target entity.", desc_chars_per_line); }
    static get range() { return swap_range; }
    static get costs(){
        return {
            action_points: { value: move_base_cost * 2 },
        };
    }

    constructor(target){
        debug.assertion(()=>target instanceof concepts.Position);
        super(`swap_${target.x}_${target.y}`, `Swap position with that entity`, target);
        this.target = target
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const target_entity = world.entity_at(this.target);
        debug.assertion(()=>target_entity instanceof concepts.Entity);

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

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        const entity_can_be_moved = (position)=> {
            const entity = world.entity_at(position);
            if(entity instanceof concepts.Entity){
                // Entities can be moved by default.
                return entity.can_be_moved === undefined || entity.can_be_moved;
            }
            return false;
        };

        return ranged_actions_for_each_target(world, character, Swap, entity_can_be_moved);
    }
};
