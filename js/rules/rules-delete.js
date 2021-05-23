
export {
    Rule_Delete,
    Delete,
}

import * as debug from "../system/debug.js";
import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { deal_damage } from "./destruction.js";
import * as anim from "../game-animations.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { auto_newlines } from "../system/utility.js";
import { EntityView } from "../view/entity-view.js";

const delete_damage = 4;
const delete_ap_cost = 10;
const delete_range = new visibility.Range_Cross_Star(0,4);

class Deleted extends concepts.Event {
    constructor(deleter_character, deleted_character){
        super({
            description: `Entity ${deleter_character.id} deleted parts of entity ${deleted_character.id}!`
        });

        this.allow_parallel_animation = false;
        this.deleter_position = deleter_character.position;
        this.deleted_position = deleted_character.position;
        this._deleted_id = deleted_character.id;
    }

    get focus_positions() { return [ this.deleter_position, this.deleted_position ]; }

    *animation(game_view){
        const entity_view = game_view.focus_on_entity(this._deleted_id);
        if(!(entity_view instanceof EntityView)) return; // FIXME
        yield* anim.deleting_missile(game_view.fx_view, this.deleter_position, this.deleted_position);
        yield* anim.take_hit_damage(game_view.fx_view, entity_view);
    }
};


class Delete extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_delete; }
    static get action_type_name() { return "Delete"; }
    static get action_type_description() { return auto_newlines("Deletes parts of the memory of the target entity. If the entity loses too much integrity, they will be destroyed. Some entities cannot lose integrity through deletion.", 35); }
    static get range() { return delete_range; }
    static get costs(){
        return {
            action_points: { value: delete_ap_cost },
        };
    }

    constructor(target_position){
        super(`delete_${target_position.x}_${target_position.y}`,
                `Deal ${delete_damage} damages to this entity`,
                target_position);
        this.delete_damage = delete_damage;
    }

    execute(world, deleter){
        // TODO: generalize the "take damage" functions like the destroy_entity/destroy_at function
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>deleter instanceof Character);

        const deleted =  world.entity_at(this.target_position);

        const events = [
                            new Deleted(deleter, deleted),
                            ...deal_damage(deleted, this.delete_damage),
                        ];
        return events;
    }
};


class Rule_Delete extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        return ranged_actions_for_each_target(world, character, Delete);
    }
};

