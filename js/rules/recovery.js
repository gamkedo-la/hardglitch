
export {
    Repaired,
    repair,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as animations from "../game-animations.js";
import { GameView } from "../game-view.js";
import { EntityView, graphic_position } from "../view/entity-view.js";
import { Character } from "../core/character.js";
import { in_parallel } from "../system/animation.js";

class Repaired extends concepts.Event {
    constructor(entity_id, entity_position, repair_amount, from_position){
        super({
            description: `Entity ${entity_id} was repaired ${repair_amount} integrity!`
        });

        this.allow_parallel_animation = false;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
        this.from_position = from_position;
        this.repair_amount = repair_amount;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        if(!(entity_view instanceof EntityView)) return; // FIXME: was an assertion, not sure why it went false.

        if(this.from_position instanceof concepts.Position && !this.from_position.equals(entity_view.game_position))
            yield* animations.repairing_missile(game_view.fx_view, this.from_position, entity_view.game_position)

        yield* in_parallel(
            animations.repaired(game_view.fx_view, entity_view),
            animations.integrity_value_change(game_view, this.repair_amount, entity_view.position),
        );
    }

}

function repair(entity, amount, repairer_position){
    debug.assertion(()=>entity instanceof concepts.Entity);
    debug.assertion(()=>repairer_position instanceof concepts.Position || repairer_position === undefined);
    debug.assertion(()=>Number.isInteger(amount) && amount >= 0);
    if(entity instanceof Character){
        entity.repair(amount);
    } else {
        amount = 0; // Other kinds of entities can't really be repaired.
    }
    return [
        new Repaired(entity.id, entity.position, amount, repairer_position),
    ];
}

