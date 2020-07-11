
export {
    Rule_Push,
    Rule_Pull,
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
        yield* animations.move(entity_view, this.to_pos);
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
            const next_entity = world.entity_at(next_pos);
            console.assert(!next_entity || next_entity instanceof concepts.Entity);
            events.push(new Bounced(target_entity, target_entity.position, next_pos));
            target_entity = next_entity;
            target_pos = next_pos;
        } else {
            // Nothing behind, just move there.
            const new_position = new Vector2(target_entity.position).translate(direction);
            const initial_position = target_entity.position;
            target_entity.position = new_position;
            events.push(new force_action(target_entity, initial_position, new concepts.Position(next_pos)));
            target_entity = null; // Don't propagate anymore.
        }
    }

    return events;
}

class Push extends concepts.Action {
    icon_def = sprite_defs.icon_action_push;

    constructor(target){
        const action_id = `push_${target.x}_${target.y}`;
        super(action_id, `Push ${JSON.stringify(target)}`, target);
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const push_translation = new Vector2(character.position).substract(this.target_position).normalize().inverse;
        push_translation.x = Math.floor(push_translation.x);
        push_translation.y = Math.floor(push_translation.y);
        console.assert(push_translation.length > 0);
        return apply_directional_force(world, this.target_position, push_translation, Pushed);
    }
}

class Pull extends concepts.Action {
    icon_def = sprite_defs.icon_action_pull;

    constructor(target){
        const action_id = `pull_${target.x}_${target.y}`;
        super(action_id, `Pull ${JSON.stringify(target)}`, target);
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);
        const pull_translation = new Vector2(character.position).substract(this.target_position).normalize();
        pull_translation.x = Math.floor(pull_translation.x);
        pull_translation.y = Math.floor(pull_translation.y);
        console.assert(pull_translation.length > 0);
        return apply_directional_force(world, this.target_position, pull_translation, Pulled);
    }
}


// TODO: factorize code common between Pull and Push rules!
class Rule_Push extends concepts.Rule {
    range = new visibility.Range_Square(1, 5);

    get_actions_for(character, world){
        if(!character.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const push_actions = {};
        visibility.valid_target_positions(world, character.position, this.range)
            .forEach(target => {
                const push = new Push(target);
                push.range = this.range;
                push_actions[`push_${target.x}_${target.y}`] = push;
            });
        return push_actions;
    }
};


class Rule_Pull extends concepts.Rule {
    range = new visibility.Range_Square(1, 5);

    get_actions_for(character, world){
        if(!character.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const pull_actions = {};
        visibility.valid_target_positions(world, character.position, this.range)
            .forEach(target => {
                const pull = new Pull(target);
                pull.range = this.range;
                pull_actions[`pull_${target.x}_${target.y}`] = pull;
            });
        return pull_actions;
    }
};

