
export {
    Rule_Push,
    Rule_Pull,
    apply_directional_force,
    Pushed,
    Pulled,
    Push,
    Push_Short,
    Pull,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import { Vector2 } from "../system/spatial.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";
import * as audio from "../system/audio.js";
import * as tiles from "../definitions-tiles.js";
import { EntityView, graphic_position } from "../view/entity-view.js";
import { GameView } from "../game-view.js";
import { Character } from "../core/character.js";
import * as visibility from "../core/visibility.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { is_blocked_position } from "../definitions-world.js";
import { auto_newlines } from "../system/utility.js";
import { deal_damage } from "./destruction.js";

const push_range = new visibility.Range_Square(1, 4);
const push_short_range = new visibility.Range_Cross_Axis(1, 2);
const pull_range = new visibility.Range_Square(1, 4);

const base_force_cost = 5;

class Telekynesy extends concepts.Event {
    constructor(from_pos, to_pos){
        debug.assertion(()=>from_pos instanceof concepts.Position);
        debug.assertion(()=>to_pos instanceof concepts.Position);
        super({
            allow_parallel_animation: false,
            description: `Telekynesy visible from ${JSON.stringify(from_pos)} to ${JSON.stringify(to_pos)}`,
        });
        this.from_pos = from_pos;
        this.to_pos = to_pos;
    }

    get focus_positions() { return [ this.from_pos, this.to_pos ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.focus_on_position(this.to_pos);

        audio.playEvent("destroyAction");
        const launcher_gfx_pos = graphic_position(this.from_pos);
        const target_gfx_pos = graphic_position(this.to_pos);
        const missile_fx = game_view.fx_view.missile(launcher_gfx_pos);
        const missile_speed = 4;
        yield* animations.missile(missile_fx, target_gfx_pos, missile_speed);
    }

};

class Pushed extends concepts.Event {
    constructor(entity, from, to){
        super({
            allow_parallel_animation: false,
            description: `Entity ${entity.id} was Pushed from ${JSON.stringify(from)} to ${JSON.stringify(to)}`
        });
        this.target_entity_id = entity.id;
        this.from_pos = from;
        this.to_pos = to;
    }

    get focus_positions() { return [ this.from_pos, this.to_pos ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.target_entity_id);
        if(!(entity_view instanceof EntityView)) return; // FIXME
        yield* animations.pushed(game_view.fx_view, entity_view, this.to_pos);
    }
};

const Pulled = Pushed; // For now, pulling is just pushing in reverse, don't tell anyone until this needs to be changed XD

class Bounced extends concepts.Event {
    constructor(entity, from, to){
        super({
            allow_parallel_animation: false,
            description: `Entity ${entity.id} Bounced from ${JSON.stringify(from)} against ${JSON.stringify(to)}`
        });
        this.target_entity_id = entity.id;
        this.from_pos = from;
        this.to_pos = to;
    }

    get focus_positions() { return [ this.from_pos, this.to_pos ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.target_entity_id);
        if(!(entity_view instanceof EntityView)) return; // FIXME: was an assertion, not sure why it went false.
        yield* animations.bounce(entity_view, this.to_pos);
    }
}

function apply_directional_force(world, target_pos, direction, force_action, origin_pos){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>target_pos instanceof concepts.Position);
    debug.assertion(()=>direction instanceof Vector2);
    debug.assertion(()=>direction.length > 0);

    const events = [];

    if(origin_pos instanceof concepts.Position
    && origin_pos.distance(target_pos) > 1
    ){
        events.push(new Telekynesy(origin_pos, target_pos));
    }

    target_pos = new Vector2(target_pos); // convert Position to Vector2

    // from here, recursively/propagate the force!  AND prevent applying force if there is a wall preventing it
    let target_entity = world.entity_at(target_pos);
    while(target_entity){
        debug.assertion(()=>target_entity instanceof concepts.Entity);

        // By default, all entities are pushable. If one kind is not, it have to provide the is_pushable boolean member.
        const is_pushable = target_entity.can_be_moved === undefined || target_entity.can_be_moved;

        const next_pos = target_pos.translate(direction);
        if(!is_pushable
        || is_blocked_position(world, next_pos, tiles.is_walkable) // Something is behind, we'll bounce against it.
        ){
            // TODO: only bounce IFF the kind of entity will not moved if second-pushed XD
            events.push(new Bounced(target_entity, target_pos, next_pos),
                ...deal_damage(target_entity, 2),
            );

            if(world.is_valid_position(next_pos)){
                const next_entity = world.entity_at(next_pos);
                debug.assertion(()=>!next_entity || next_entity instanceof concepts.Entity);
                target_entity = next_entity;
                target_pos = next_pos;
            } else { // We reached the boundaries of the world.
                target_entity = null;
            }
        } else {
            // Nothing behind, just move there.
            const new_position = next_pos;
            const initial_position = target_entity.position;
            target_entity.position = new_position;
            events.push(new force_action(target_entity, initial_position, new concepts.Position(next_pos)));
            target_entity = null; // Don't propagate anymore.
        }
    }

    return events;
}

function compute_push_translation(origin, target){
    const translation = new Vector2(target).substract(origin);
    return new Vector2({
        x: Math.abs(translation.x) > Math.abs(translation.y) ? Math.sign(translation.x) : 0,
        y: Math.abs(translation.x) <= Math.abs(translation.y) ? Math.sign(translation.y) : 0,
    });
}


class Push extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_push; }
    static get action_type_name() { return "Push"; }
    static get action_type_description() { return auto_newlines("Tries to move an entity away from this character, bouncing on anything blocking that move.", 35); }
    static get range() { return push_range; }
    static get costs(){
        return {
            action_points: { value: base_force_cost },
        };
    }

    constructor(target){
        const action_id = `push_${target.x}_${target.y}`;
        super(action_id, `Push that entity away`, target);
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const push_translation = compute_push_translation(character.position, this.target_position);
        debug.assertion(()=>push_translation.length == 1);
        return apply_directional_force(world, this.target_position, push_translation, Pushed, character.position);
    }
}

class Push_Short extends Push {
    static get action_type_description() { return auto_newlines("Tries to move a close entity away from this character, bouncing on anything blocking that move.", 35); }
    static get action_type_name() { return "Short Push"; }
    static get range() { return push_short_range; }
    static get costs(){
        return {
            action_points: { value: base_force_cost },
        };
    }

}

class Pull extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_pull; }
    static get action_type_name() { return "Pull"; }
    static get action_type_description() { return auto_newlines("Tries to move the target entity towards this character, bouncing on anything blocking that move..", 35); }
    static get range() { return pull_range; }
    static get costs(){
        return {
            action_points: { value: base_force_cost },
        };
    }

    constructor(target){
        const action_id = `pull_${target.x}_${target.y}`;
        super(action_id, `Pull that entity toward you`, target);
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        const pull_translation = compute_push_translation(character.position, this.target_position).inverse;
        debug.assertion(()=>pull_translation.length == 1);
        return apply_directional_force(world, this.target_position, pull_translation, Pulled, character.position);
    }
}


// TODO: factorize code common between Pull and Push rules!
class Rule_Push extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
         return ranged_actions_for_each_target(world, character, Push);
    }
};


class Rule_Pull extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        return ranged_actions_for_each_target(world, character, Pull);
    }
};

