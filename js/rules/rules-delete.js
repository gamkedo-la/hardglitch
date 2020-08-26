
export {
    Rule_Delete,
    Delete,
}

import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { Damaged } from "./destruction.js";
import * as anim from "../game-animations.js";
import { lazy_call } from "../system/utility.js";
import { actions_for_each_target, ranged_actions_for_each_target } from "./rules-common.js";

const delete_damage = 5;
const delete_ap_cost = 5;

class Deleted extends concepts.Event {
    constructor(deleter_character, deleted_character){
        super({
            description: `Entity ${deleter_character.id} deleted parts of entity ${deleted_character.id}!`
        });

        this.allow_parallel_animation = false;
        this.deleter_position = deleter_character.position;
        this.deleted_position = deleted_character.position;
    }

    get focus_positions() { return [ this.deleter_position, this.deleted_position ]; }

    *animation(game_view){
        yield* anim.deleting_missile(game_view.fx_view, this.deleter_position, this.deleted_position);
    }
};


class Delete extends concepts.Action {
    icon_def = sprite_defs.icon_action_delete;

    constructor(target_position){
        super(`delete_${target_position.x}_${target_position.y}`,
                `Deal ${delete_damage} damages at ${JSON.stringify(target_position)}`,
                target_position,
                { // costs
                    action_points: delete_ap_cost
                }
                );
        this.delete_damage = delete_damage;
    }

    execute(world, deleter){
        // TODO: generalize the "take damage" functions like the destroy_entity/destroy_at function
        console.assert(world instanceof concepts.World);
        console.assert(deleter instanceof Character);


        const deleted =  world.entity_at(this.target_position);
        console.assert(deleted instanceof concepts.Entity);
        if(deleted instanceof Character){
            deleted.take_damage(this.delete_damage);
        }
        const events = [ new Damaged(deleted.id, deleted.position, this.delete_damage) ];
        if(!deleted.position.equals(deleter.position)){
            events.unshift(new Deleted(deleter, deleted));
        }
        return events;
    }
};


class Rule_Delete extends concepts.Rule {
    range = new visibility.Range_Diamond(0,7);

    get_actions_for(character, world){
        console.assert(character instanceof Character);
        return ranged_actions_for_each_target(world, character, Delete, this.range);
    }
};

