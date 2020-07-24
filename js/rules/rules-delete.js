
export {
    Rule_Delete,
    Delete,
}

import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { Damaged } from "./destruction.js";
import { missile } from "../game-animations.js";
import { graphic_position } from "../view/entity-view.js";

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
        const missile_effect = game_view.fx_view.missile(graphic_position(this.deleter_position));
        yield* missile(missile_effect, graphic_position(this.deleted_position));
        game_view.particle_system.remove(missile_effect);
    }
};


class Delete extends concepts.Action {
    icon_def = sprite_defs.icon_action_delete;

    constructor(target_position){
        super(`delete_${target_position.x}_${target_position.y}`,
                `Deal ${delete_damage} damages at ${JSON.stringify(target_position)}`,
                target_position,
                delete_ap_cost
                );
        this.delete_damage = delete_damage;
    }

    execute(world, deleter){
        // TODO: generalize the "take damage" functions like the destroy_entity/destroy_at function
        console.assert(world instanceof concepts.World);
        console.assert(deleter instanceof Character);

        const deleted =  world.body_at(this.target_position);
        console.assert(deleted instanceof Character);
        deleted.take_damage(this.delete_damage);
        const events = [
            new Damaged(deleted.id, deleted.position, this.delete_damage),
        ];
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
        if(!character.is_player_actor) // TODO: temporary (otherwise the player will be bushed lol)
            return {};

        const actions = {};
        visibility.valid_target_positions(world, character, this.range)
            .forEach((target)=>{
                    const delete_action = new Delete(target);
                    delete_action.range = this.range;
                    actions[delete_action.id] = delete_action;
                });
        return actions;
    }
};

