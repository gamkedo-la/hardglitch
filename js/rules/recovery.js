
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
import { CharacterView } from "../view/character-view.js";

class Repaired extends concepts.Event {
    constructor(entity_id, entity_position, repair_amount, from_position, final_health){
        super({
            description: `Entity ${entity_id} was repaired ${repair_amount} integrity! Final health = ${final_health}`
        });

        this.allow_parallel_animation = false;
        this.entity_id = entity_id;
        this.entity_position = entity_position;
        this.from_position = from_position;
        this.repair_amount = repair_amount;
        this.final_health = final_health;
    }

    get focus_positions() { return [ this.entity_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const entity_view = game_view.focus_on_entity(this.entity_id);
        if(!(entity_view instanceof EntityView)) return; // FIXME: was an assertion, not sure why it went false.

        // If we repair through targetting another (via an action), we show the whole animation.
        // Otherwise we just show the value change.
        if(this.from_position instanceof concepts.Position /*&& !this.from_position.equals(entity_view.game_position)*/){
            yield* animations.repairing_missile(game_view.fx_view, this.from_position, entity_view.game_position)
            yield* in_parallel(
                animations.repaired(game_view.fx_view, entity_view),
                animations.integrity_value_change(game_view, this.repair_amount, entity_view.position),
            );
        } else {
            if(this.repair_amount != 0)
                game_view.special_animations.play(animations.integrity_value_change(game_view, this.repair_amount, entity_view.position));
        }

        if(entity_view instanceof CharacterView){
            entity_view.change_health(this.final_health);
        }

    }

}

function repair(entity, amount, repairer_position){
    debug.assertion(()=>entity instanceof concepts.Entity);
    debug.assertion(()=>repairer_position instanceof concepts.Position || repairer_position === undefined);
    debug.assertion(()=>Number.isInteger(amount) && amount >= 0);
    let final_health;
    if(entity instanceof Character){
        amount = entity.repair(amount);
        final_health = entity.stats.integrity.value;
    } else {
        amount = 0; // Other kinds of entities can't really be repaired.
    }
    return [
        new Repaired(entity.id, entity.position, amount, repairer_position, final_health),
    ];


}

