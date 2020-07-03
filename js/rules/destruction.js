
export {
    destroy_entity,
    destroy_at,
}

import * as concepts from "../core/concepts.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { destroyed } from "../game-animations.js";


class Destroyed extends concepts.Event {
    constructor(entity_id){
        console.assert(Number.isInteger(entity_id));
        super({
            description: `Entity ${entity_id} was DESTROYED!!!!!`
        });

        this.entity_id = entity_id;
    }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        yield* destroyed(entity_view);
        game_view.remove_entity_view(this.entity_id);
    }

};


function destroy_entity(entity_id, world){
    console.assert(world instanceof concepts.World);
    world.remove_entity(entity_id);
    return [ new Destroyed(entity_id) ];
}

function destroy_at(position, world){
    console.assert(position);
    console.assert(world instanceof concepts.World);
    const entity = world.entity_at(position);
    if(entity){
        return destroy_entity(entity.id, world);
    } else {
        return [];
    }
}
