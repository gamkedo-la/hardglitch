export {
    Invoke_AntiVirus,
    Invoke_Virus,
    InvokationSpawned,
    Rules_Invokation,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";

import * as anims from "../game-animations.js";
import * as tiles from "../definitions-tiles.js";

import { sprite_defs } from "../game-assets.js";
import { Character } from "../core/character.js";
import { GameView } from "../game-view.js";
import { EntityView } from "../view/entity-view.js";
import { get_any_serializable_type } from "../definitions-world.js";
import { actions_for_each_target } from "./rules-common.js";
import { auto_newlines, lazy_call } from "../system/utility.js";

const invokation_range = new visibility.Range_Diamond(1, 3);

class InvokationSpawned extends concepts.Event {

    constructor(entity, target_position, invoker_pos){
        debug.assertion(()=>entity instanceof concepts.Entity);
        debug.assertion(()=>target_position instanceof concepts.Position);
        debug.assertion(()=>invoker_pos instanceof concepts.Position);

        super({
            description: `Entity invoked and spawned at ${JSON.stringify(target_position)}`,
            allow_parallel_animation: false,
        });
        this.entity_id = entity.id;
        this.spawn_position = target_position;
        this.invoker_pos = invoker_pos;
    }

    get focus_positions() { return [ this.spawn_position, this.invoker_pos ]; }

    *animation(game_view){
        debug.assertion(()=> game_view instanceof GameView);

        const entity_view = game_view.add_entity_view(this.entity_id);
        debug.assertion(()=> entity_view instanceof EntityView);
        entity_view.game_position = this.spawn_position;

        yield* anims.invokation(game_view.fx_view, entity_view, this.invoker_pos);
    }
};

class InvokeCharacter extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_merge; }
    static get range() { return invokation_range; }
    static get costs(){
        return {
            action_points: { value: 20 },
        };
    }

    constructor(character_type, name, position){
        debug.assertion(()=> typeof name === "string" && name.length > 2);
        debug.assertion(()=> position instanceof concepts.Position);
        debug.assertion(()=>character_type.prototype instanceof Character);

        super(`invoke_${character_type.name}_at_${position.x}_${position.y}`,
            `Invokes a ${name}. Might be hostile or not depending on your current body.`,
            position
        );

        this.character_type = character_type;
    }

    execute(world, character){
        debug.assertion(()=> world instanceof concepts.World);
        debug.assertion(()=> character instanceof Character);

        const invoked = new this.character_type();
        invoked.position = this.target_position;
        world.add_entity(invoked);
        invoked.skip_turn = true;

        return [ new InvokationSpawned(invoked, invoked.position, character.position) ];
    }


};

class Invoke_AntiVirus extends InvokeCharacter {
    static get action_type_name() { return "Invoke Anti-Virus"; }
    static get action_type_description() { return auto_newlines("Invokes an Anti-Virus to invervene.\nAnti-Viruses will hunt for anything they consider an anomaly and try to protect normal programs.", 35); }

    constructor(position){
        const antivirus_type = get_any_serializable_type("AntiVirus");
        super(antivirus_type, "Anti-Virus", position);
    }
};

class Invoke_Virus extends InvokeCharacter {
    static get action_type_name() { return "Invoke Virus"; }
    static get action_type_description() { return auto_newlines("Invokes a Virus to disturb the computer.\nViruses hunt in gangs and will try to duplicate when the gang is not big enough. They like to merge into other entities to take control of their virtual bodies.", 35); }

    constructor(position){
        const virus_type = get_any_serializable_type("Virus");
        super(virus_type, "Virus", position);
    }
};

class Rules_Invokation extends concepts.Rule {

    get_actions_for(character, world){
        debug.assertion(()=>character instanceof Character);

        const valid_creation_position = () => lazy_call(visibility.valid_move_positions, world, character, InvokeCharacter.range, tiles.is_walkable);
        const invokation_actions = actions_for_each_target(character, InvokeCharacter, valid_creation_position, (action_type, target)=>{
            const action= new action_type(target);
            return action;
        });

        return invokation_actions;
    }

};


