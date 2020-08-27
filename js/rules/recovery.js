
export {
    Repaired,
    repair,
}

import * as concepts from "../core/concepts.js";
import * as animations from "../game-animations.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { Character } from "../core/character.js";

class Repaired extends concepts.Event {
    constructor(entity_id, entity_position, repair_amount){
        super({
            description: `Entity ${entity_id} was repaired ${repair_amount} integrity!`
        });

        this.allow_parallel_animation = false;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
        this.repair_amount = repair_amount;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const entity_view = game_view.get_entity_view(this.entity_id);
        console.assert(entity_view instanceof EntityView);
        yield* animations.repaired(entity_view);
    }

}

function repair(entity, amount){
    console.assert(entity instanceof concepts.Entity);
    console.assert(Number.isInteger(amount) && amount >= 0);
    if(entity instanceof Character){
        entity.repair(amount);
    }
    return [
        new Repaired(entity.id, entity.position, amount),
    ];
}

