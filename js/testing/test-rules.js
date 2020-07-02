// This file contain just rules for testing.

export {
    test_rules
}

import * as concepts from "../core/concepts.js";
import { Vector2 } from "../system/spatial.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { destroyed } from "../game-animations.js";
import { sprite_defs } from "../game-assets.js";

class Destroyed extends concepts.Event {
    constructor(entity){
        console.assert(entity instanceof concepts.Entity);
        super({
            description: `Entity ${entity.id} was DESTROYED!!!!!`
        });

        this.entity_id = entity.id;
    }


    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        yield* destroyed(entity_view);
        game_view.remove_entity_view(this.entity_id);
    }

}


class Destroy extends concepts.Action {
    icon_def = sprite_defs.icon_action_delete;

    constructor(target_position){
        super(`destroy_${target_position.x}_${target_position.y}`,
                `Destroy anything at ${JSON.stringify(target_position)}`,
                target_position);
    }

    execute(world){
        const entity = world.entity_at(this.target_position);
        if(entity){
            world.remove_entity(entity.id);
            return [ new Destroyed(entity) ];
        } else {
            return [];
        }
    }
};


class Rule_TestDestruction extends concepts.Rule {
    get_actions_for(body, world){
        if(!body.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const actions = {};
        const range = 6;
        const center_pos = body.position;
        for(let y = -range; y < range; ++y){
            for(let x = -range; x < range; ++x){
                const target = new concepts.Position(new Vector2(center_pos).translate({x, y}));
                if(world.entity_at(target)){
                    actions[`destroy_${x}_${y}`] = new Destroy(target);
                }
            }
        }
        return actions;
    }
};


const test_rules = [
    new Rule_TestDestruction()
];

