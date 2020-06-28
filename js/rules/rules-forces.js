
export {
    Rule_Push,
}

import * as concepts from "../core/concepts.js";
import { Vector2 } from "../system/spatial.js";
import { sprite_defs } from "../game-assets.js";
import * as animations from "../game-animations.js";

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

class Push extends concepts.Action {
    icon_def = sprite_defs.icon_action_push;

    constructor(target){
        super("push", "Push", target); // TODO: do it properly
    }

    execute(world, body){
        console.assert(world instanceof concepts.World);
        console.assert(body instanceof concepts.Body);
        const target_entity = world.entity_at(this.target_position);
        console.assert(target_entity instanceof concepts.Entity);

        if(target_entity){
            const initial_pos = target_entity.position;
            const push_translation = new Vector2(body.position).substract(target_entity.position).normalize().inverse;
            push_translation.x = Math.floor(push_translation.x);
            push_translation.y = Math.floor(push_translation.y);
            const new_position = new Vector2(target_entity.position).translate(push_translation); // TODO: from here, recursively/propagate push! (in the event?) AND prevent applying push if there is a wall preventing it
            if(new_position.length != 0){
                target_entity.position = new_position;
                return [new Pushed(target_entity, initial_pos, target_entity.position)]; // TODO: use a specific Event instead
            }
        }

        return [];
    }
}

class Rule_Push extends concepts.Rule {

    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const push_actions = {};
        const range = 4; // TODO: make different kinds of push actions that have different ranges
        const center_pos = body.position;
        for(let y = -range; y < range; ++y){
            for(let x = -range; x < range; ++x){
                if(x == 0 && y == 0)  // Skip the character pushing
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

