
export {
    Rule_Freeze,
    Freeze,
}

import * as debug from "../system/debug.js";
import * as audio from "../system/audio.js";
import { Character } from "../core/character.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import { sprite_defs } from "../game-assets.js";
import * as anim from "../game-animations.js";
import { ranged_actions_for_each_target } from "./rules-common.js";
import { auto_newlines } from "../system/utility.js";
import { EntityView, graphic_position } from "../view/entity-view.js";
import { deal_ap_damage } from "./destruction.js";

const freeze_damage = 30;
const freeze_ap_cost = 8;
const freeze_range = new visibility.Range_Cross_Star(0,5);

class Frozen extends concepts.Event {
    constructor(freezer_character, froze_character){
        super({
            description: `Entity ${freezer_character.id} froze entity ${froze_character.id}!`
        });

        this.allow_parallel_animation = false;
        this.freezer_position = freezer_character.position;
        this.froze_position = froze_character.position;
        this._froze_id = froze_character.id;
    }

    get focus_positions() { return [ this.freezer_position, this.froze_position ]; }

    *animation(game_view){
        const entity_view = game_view.focus_on_entity(this._froze_id);
        if(!(entity_view instanceof EntityView)) return; // FIXME
        audio.playEvent("destroyAction");
        const launcher_gfx_pos = graphic_position(this.freezer_position);
        const target_gfx_pos = graphic_position(this.froze_position);
        const missile_fx = game_view.fx_view.missile(launcher_gfx_pos);
        const missile_speed = 4;
        yield* anim.missile(missile_fx, target_gfx_pos, missile_speed);
        yield* anim.take_hit_damage(game_view.fx_view, entity_view);
    }
};


class Freeze extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_delete; }
    static get action_type_name() { return "Freeze"; }
    static get action_type_description() { return auto_newlines("Freezes parts of the memory of the target entity. Prevents that entity from acting for some cycles by damaging it's Action Points.", 35); }
    static get range() { return freeze_range; }
    static get costs(){
        return {
            action_points: { value: freeze_ap_cost },
        };
    }
    static get is_attack(){ return true; }

    constructor(target_position){
        super(`freeze_${target_position.x}_${target_position.y}`,
                `Freeze ${freeze_damage} AP of this entity`,
                target_position);
        this.freeze_damage = freeze_damage;
    }

    execute(world, freezer){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>freezer instanceof Character);

        const frozen =  world.entity_at(this.target_position);

        const events = [
                            new Frozen(freezer, frozen),
                            ...deal_ap_damage(frozen, this.freeze_damage),
                        ];
        return events;
    }
};


class Rule_Freeze extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);
        return ranged_actions_for_each_target(world, character, Freeze);
    }
};

