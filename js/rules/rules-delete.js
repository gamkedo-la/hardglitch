
export {
    Rule_Delete,
    Delete,
}

import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import { Damaged } from "./destruction.js";

const delete_damage = 5;
const delete_ap_cost = 5;

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

    execute(world){
        console.assert(world instanceof concepts.World);
        const character =  world.body_at(this.target_position);
        console.assert(character instanceof Character);
        character.take_damage(this.delete_damage);
        return [
            new Damaged(character.id, character.position, this.delete_damage),
        ];
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

