
export {
    Rule_Push,
    Rule_Pull,
    apply_directional_force,
    Pushed,
    Pulled,
    Push,
    Pull,
}

import * as concepts from "../core/concepts.js";
import { Vector2 } from "../system/spatial.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";
import * as tiles from "../definitions-tiles.js";
import { EntityView } from "../view/entity-view.js";
import { GameView } from "../game-view.js";
import { Character } from "../core/character.js";
import * as visibility from "../core/visibility.js";
import { ranged_actions_for_each_target } from "./rules-common.js";

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
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.target_entity_id);
        console.assert(entity_view instanceof EntityView);
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
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.target_entity_id);
        console.assert(entity_view instanceof EntityView);
        yield* animations.bounce(entity_view, this.to_pos);
    }
}

function apply_directional_force(world, target_pos, direction, force_action){
    console.assert(world instanceof concepts.World);
    console.assert(target_pos instanceof concepts.Position);
    target_pos = new Vector2(target_pos); // convert Position to Vector2
    console.assert(direction instanceof Vector2);
    console.assert(direction.length > 0);

    const events = [];

    // from here, recursively/propagate the force!  AND prevent applying force if there is a wall preventing it
    let target_entity = world.entity_at(target_pos);
    while(target_entity){
        console.assert(target_entity instanceof concepts.Entity);

        const next_pos = target_pos.translate(direction);
        if(world.is_blocked_position(next_pos, tiles.is_walkable)){ // Something is behind, we'll bounce against it.
            // TODO: only bounce IFF the kind of entity will not moved if second-pushed XD
            events.push(new Bounced(target_entity, target_pos, next_pos));
            if(world.is_valid_position(next_pos)){
                const next_entity = world.entity_at(next_pos);
                console.assert(!next_entity || next_entity instanceof concepts.Entity);
                target_entity = next_entity;
                target_pos = next_pos;
            } else { // We reached the boundaries of the world.
                target_entity = null; //
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
    icon_def = sprite_defs.icon_action_push;

    constructor(target){
        const action_id = `push_${target.x}_${target.y}`;
        super(action_id, `Push ${JSON.stringify(target)}`, target,
        { // costs
            action_points: 5
        });
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const push_translation = compute_push_translation(character.position, this.target_position);
        console.assert(push_translation.length == 1);
        return apply_directional_force(world, this.target_position, push_translation, Pushed);
    }
}

class Pull extends concepts.Action {
    icon_def = sprite_defs.icon_action_pull;

    constructor(target){
        const action_id = `pull_${target.x}_${target.y}`;
        super(action_id, `Pull ${JSON.stringify(target)}`, target,
        { // costs
            action_points: 5
        });
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const pull_translation = compute_push_translation(character.position, this.target_position).inverse;
        console.assert(pull_translation.length == 1);
        return apply_directional_force(world, this.target_position, pull_translation, Pulled);
    }
}


// TODO: factorize code common between Pull and Push rules!
class Rule_Push extends concepts.Rule {
    range = new visibility.Range_Square(1, 5);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Push, this.range);
    }
};


class Rule_Pull extends concepts.Rule {
    range = new visibility.Range_Square(1, 5);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Pull, this.range);
    }
};

