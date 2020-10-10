
export {
    Rule_Unstability,
    Unstability,
    Destabilize,
    UnstabilitySpawned,
    UnstabilityVanished,
}

import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../system/animation.js";
import * as animation from "../game-animations.js";
import * as audio from "../system/audio.js";

import { lazy_call, position_from_index } from "../system/utility.js";
import { grid_ID } from "../definitions-world.js";
import { Character } from "../core/character.js";
import { Grid } from "../system/grid.js";
import { sprite_defs } from "../game-assets.js";
import { actions_for_each_target } from "./rules-common.js";
import { GameView } from "../game-view.js";
import { graphic_position, square_half_unit_vector } from "../view/entity-view.js";
import { random_jump } from "./rules-movement.js";
import { audiobuffer_loader } from "../system/assets.js";

const unstable_ap_cost = 10;
const destabilize_range = new visibility.Range_Square(0, 6);

class Unstability {
    name = "Unstable Memory";
    description =
`Unstable memory sections will
teleport any entity that enter them
to a random location, then the
memory section will stabilize.`;
    toJSON(key) { return {}; }
};

class UnstabilitySpawned extends concepts.Event {
    constructor(position, unstability, from){
        console.assert(unstability instanceof Unstability);
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
        console.assert(game_view instanceof GameView);

        const target_gfx_pos = graphic_position(this.position).translate(square_half_unit_vector);

        if(this.from){
            const unstable_missile_fx = game_view.fx_view.missile(graphic_position(this.from));
            const missile_speed = 8;
            yield* animation.missile(unstable_missile_fx, target_gfx_pos, missile_speed);
        }

        // TODO: consider adding a spawining effet just for now.
        this.unstability.fx = game_view.fx_view.unstable(target_gfx_pos);
        // TODO: add sound?
        audio.playEvent("destabilizeScan");
        yield* anim.wait(1000 / 64);
    }
};

class UnstabilityVanished extends concepts.Event {
    constructor(position, unstability){
        console.assert(unstability instanceof Unstability);
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
        console.assert(game_view instanceof GameView);
        console.assert(this.unstability.fx);
        // TODO: consider adding a "speeshhh" effet just for now.
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
        console.assert(game_view instanceof GameView);
        // TODO: add sound
        audio.playEvent("destabilizeShot");
        // TODO: add an animation here
        yield* anim.wait(1000 / 64);
    }
};

class Destabilize extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_corrupt; }
    static get action_type_name() { return "Destabilize"; }
    static get range() { return destabilize_range; }
    static get costs(){
        return {
            action_points: unstable_ap_cost,
        };
    }

    constructor(target){
        const action_id = `destabilize_${target.x}_${target.y}`;
        super(action_id, `Make this memory section Unstable`, target);
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        const unstable_grid = world.grids[grid_ID.unstable];
        console.assert(unstable_grid instanceof Grid);
        console.assert(!(unstable_grid.get_at(this.target_position) instanceof Unstability));
        const corruption = new Unstability();
        unstable_grid.set_at(corruption, this.target_position);
        return [
            new Destabilized(this.target_position, character.position),
            new UnstabilitySpawned(this.target_position, corruption, character.position),
        ];
    }
};


const unstable_random_jump_range = new visibility.Range_Square(2, 100);

function teleport_entities_in_unstable_tiles_and_vanish(world) {
    console.assert(world instanceof concepts.World);
    const unstable_grid = world.grids[grid_ID.unstable];
    console.assert(unstable_grid instanceof Grid);
    const events = [];
    unstable_grid.elements.forEach((unstability, idx)=>{
        console.assert(unstability instanceof Unstability);
        console.assert(unstability.fx);
        const position = position_from_index(world.width, world.height, idx);
        const entity = world.entity_at(position);
        if(entity){
            // Randomly teleport the entity
            events.push(...random_jump(world, entity, unstable_random_jump_range)); // If the entity is a character, they can be teleported outside their range of view.
            // Vanish the unstability
            delete unstable_grid.elements[idx];
            events.push(new UnstabilityVanished(position, unstability));
        }
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
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);

        const corruption_grid = world.grids[grid_ID.unstable];
        console.assert(corruption_grid instanceof Grid);

        const is_valid_target = (position) => world.is_valid_position(position)
                                        && !(corruption_grid.get_at(position) instanceof Unstability);

        const targets = lazy_call(visibility.positions_in_range, character.position, Destabilize.range, is_valid_target);
        return actions_for_each_target(character, Destabilize, targets);
    }
};




