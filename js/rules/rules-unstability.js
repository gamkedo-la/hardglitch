
export {
    Rule_Unstability,
    Unstability,
    Destabilize,
    UnstabilitySpawned,
    UnstabilityVanished,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../system/animation.js";
import * as animation from "../game-animations.js";
import * as audio from "../system/audio.js";
import * as tiles from "../definitions-tiles.js";

import { auto_newlines, lazy_call, position_from_index } from "../system/utility.js";
import { grid_ID, is_blocked_position } from "../definitions-world.js";
import { Character } from "../core/character.js";
import { Grid } from "../system/grid.js";
import { sprite_defs } from "../game-assets.js";
import { actions_for_each_target } from "./rules-common.js";
import { GameView } from "../game-view.js";
import { graphic_position, square_half_unit_vector } from "../view/entity-view.js";
import { random_jump } from "./rules-movement.js";

const unstable_ap_cost = 10;
const destabilize_range = new visibility.Range_Square(0, 6);

const unstability_name = "Unstable Memory";
const unstability_description = `Unstable memory sections will
teleport any entity that enter them
to a random location, then the
memory section will stabilize.`;


class Unstability {
    get name(){ return unstability_name; }
    get description() { return unstability_description; }
    toJSON(key) { return {}; }
};

class UnstabilitySpawned extends concepts.Event {
    constructor(position, unstability, from){
        debug.assertion(()=>unstability instanceof Unstability);
        super({
            allow_parallel_animation: false,
            description: `Unstability spawned at ${JSON.stringify(position)}`,
        })
        this.position = new concepts.Position(position);
        this.unstability = unstability;
        this.from = from;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position, this.from ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);

        const target_gfx_pos = graphic_position(this.position).translate(square_half_unit_vector);

        if(this.from){
            audio.playEvent("destroyAction");
            const unstable_missile_fx = game_view.fx_view.missile(graphic_position(this.from));
            const missile_speed = 8;
            yield* animation.missile(unstable_missile_fx, target_gfx_pos, missile_speed);
        }

        this.unstability.fx = game_view.fx_view.unstable(target_gfx_pos);
        debug.assertion(()=>this.unstability.fx);

        audio.playEvent("destabilizeScan");
        yield* anim.wait(1000 / 64);
    }
};

class UnstabilityVanished extends concepts.Event {
    constructor(position, unstability){
        debug.assertion(()=>unstability instanceof Unstability);
        super({
            allow_parallel_animation: false,
            description: `Unstability vanished at ${JSON.stringify(position)}`,
        })
        this.position = new concepts.Position(position);
        this.unstability = unstability;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position ]; }


    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        // TODO: consider adding a "speeshhh" effet just for now.
        if(this.unstability.fx)
            this.unstability.fx.done = true;
        // TODO: add sound?
        yield* anim.wait(1000 / 64);
    }

};


class Destabilized extends concepts.Event {
    constructor(position, from){
        super({
            allow_parallel_animation: false,
            description: `Destabilized ${JSON.stringify(position)}`,
        })
        this.position = new concepts.Position(position);
        this.from = from;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position, this.from ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        audio.playEvent("destabilizeShot");
        // TODO: add an animation here
        yield* anim.wait(1000 / 64);
    }
};

class Destabilize extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_corrupt; }
    static get action_type_name() { return "Destabilize"; }
    static get action_type_description() { return auto_newlines("Makes the target memory section unstable, making it teleport data it contains to a random location.", 35); }
    static get range() { return destabilize_range; }
    static get costs(){
        return {
            action_points: { value: unstable_ap_cost },
        };
    }

    constructor(target){
        const action_id = `destabilize_${target.x}_${target.y}`;
        super(action_id, `Make this memory section Unstable`, target);
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        const unstable_grid = world.grids[grid_ID.unstable];
        debug.assertion(()=>unstable_grid instanceof Grid);
        debug.assertion(()=>!(unstable_grid.get_at(this.target_position) instanceof Unstability));
        const unstability = new Unstability();
        unstable_grid.set_at(unstability, this.target_position);
        return [
            new Destabilized(this.target_position, character.position),
            new UnstabilitySpawned(this.target_position, unstability, character.position),
        ];
    }
};


const unstable_random_jump_range = new visibility.Range_Square(2, 100);

function teleport_entities_in_unstable_tiles_and_vanish(world) {
    debug.assertion(()=>world instanceof concepts.World);
    const unstable_grid = world.grids[grid_ID.unstable];
    debug.assertion(()=>unstable_grid instanceof Grid);

    const events = [];
    const valid_positions = (pos) => !is_blocked_position(world, pos, tiles.is_safely_walkable);

    world.entities.forEach(entity => {
        const pos = entity.position;
        const unstability = unstable_grid.get_at(pos);
        if(!(unstability instanceof Unstability))
            return;

        // Randomly teleport the entity
        events.push(...random_jump(world, entity, unstable_random_jump_range, valid_positions)); // If the entity is a character, they can be teleported outside their range of view.
        // Vanish the unstability
        unstable_grid.remove_at(pos);
        events.push(new UnstabilityVanished(pos, unstability));
    });

    return events;
}



class Rule_Unstability extends concepts.Rule {

    update_world_at_the_beginning_of_game_turn(world){
        if(world.turn_id <= 1) // Don't apply this rule on the first turn.
            return [];

        return teleport_entities_in_unstable_tiles_and_vanish(world);
    }

    update_world_after_character_turn(world, character){
        return teleport_entities_in_unstable_tiles_and_vanish(world);
    }


    get_actions_for(character, world){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);

        const corruption_grid = world.grids[grid_ID.unstable];
        debug.assertion(()=>corruption_grid instanceof Grid);

        const is_valid_target = (position) => world.is_valid_position(position)
                                        && character.can_see(position)
                                        && !(corruption_grid.get_at(position) instanceof Unstability);

        const targets_for_action = (range) => lazy_call(visibility.positions_in_range, character.position, range, is_valid_target);
        return actions_for_each_target(character, Destabilize, targets_for_action);
    }
};




