
export {
    Rule_Push,
    Rule_Pull,
}

import * as concepts from "../core/concepts.js";
import { Vector2 } from "../system/spatial.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";
import * as tiles from "../definitions-tiles.js";

class Pushed extends concepts.Event {
    constructor(entity, from, to){
        super(entity.id, {
             allow_parallel_animation: false
        });
        this.target_entity = entity;
        this.from_pos = from;
        this.to_pos = to;
    }

    *animation(entity_view){
        yield* animations.move(entity_view, this.to_pos);
    }
};

const Pulled = Pushed; // For now, pulling is just pushing in reverse, don't tell anyone until this needs to be changed XD

class Bounced extends concepts.Event {
    constructor(entity, from, to){
        super(entity.id, {
             allow_parallel_animation: false
        });
        this.target_entity = entity;
        this.from_pos = from;
        this.to_pos = to;
    }

    *animation(entity_view){
        yield* animations.bounce(entity_view, this.to_pos);
    }
}

function apply_directional_force(world, target_pos, direction, force_action){
    console.assert(world instanceof concepts.World);
    console.assert(target_pos instanceof concepts.Position);
    target_pos = new Vector2(target_pos); // convert Position to Vector2
    console.assert(direction instanceof Vector2);

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

    execute(world, body){
        console.assert(world instanceof concepts.World);
        console.assert(body instanceof concepts.Body);
        const push_translation = new Vector2(body.position).substract(this.target_position).normalize().inverse;
        push_translation.x = Math.ceil(push_translation.x);
        push_translation.y = Math.ceil(push_translation.y);
        return apply_directional_force(world, this.target_position, push_translation, Pushed);
    }
}

class Pull extends concepts.Action {
    icon_def = sprite_defs.icon_action_pull;

    constructor(target){
        const action_id = `pull_${target.x}_${target.y}`;
        super(action_id, `Pull ${JSON.stringify(target)}`, target);
    }

    execute(world, body){
        console.assert(world instanceof concepts.World);
        console.assert(body instanceof concepts.Body);
        const push_translation = new Vector2(body.position).substract(this.target_position).normalize();
        push_translation.x = Math.ceil(push_translation.x);
        push_translation.y = Math.ceil(push_translation.y);
        return apply_directional_force(world, this.target_position, push_translation, Pulled);
    }
}


// TODO: factorize code common between Pull and Push rules!
class Rule_Push extends concepts.Rule {

    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const push_actions = {};
        const range = 4; // TODO: make different kinds of push actions that have different ranges
        const center_pos = body.position;
        for(let y = -range; y < range; ++y){
            for(let x = -range; x < range; ++x){
                if((x == 0 && y == 0)  // Skip the character pushing
                // || (x != 0 && y != 0) // Skip any position not aligned with axes
                )
                    continue;
                const target = new concepts.Position(new Vector2(center_pos).translate({x, y}));
                if(world.entity_at(target)){
                    push_actions[`push_${x}_${y}`] = new Push(target);
                }
            }
        }
        return push_actions;
    }
};


class Rule_Pull extends concepts.Rule {

    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const pull_actions = {};
        const range = 5; // TODO: make different kinds of pull actions that have different ranges
        const center_pos = body.position;
        for(let y = -range; y < range; ++y){
            for(let x = -range; x < range; ++x){
                if((x == 0 && y == 0)  // Skip the character pulling
                // || (x != 0 && y != 0) // Skip any position not aligned with axes
                )
                    continue;
                const target = new concepts.Position(new Vector2(center_pos).translate({x, y}));
                if(world.entity_at(target)){
                    pull_actions[`pull_${x}_${y}`] = new Pull(target);
                }
            }
        }
        return pull_actions;
    }
};

