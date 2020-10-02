
export {
    Rule_Corruption,
    Corruption,
    Corrupt,
    CorruptionSpawned,
    CorruptionVanished,
}

import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../system/animation.js";
import * as animation from "../game-animations.js";

import { deal_damage } from "./destruction.js";
import { lazy_call, random_int } from "../system/utility.js";
import { grid_ID, is_valid_world } from "../definitions-world.js";
import { Character } from "../core/character.js";
import { Grid } from "../system/grid.js";
import { sprite_defs } from "../game-assets.js";
import { actions_for_each_target } from "./rules-common.js";
import { GameView } from "../game-view.js";
import { graphic_position, square_half_unit_vector } from "../view/entity-view.js";

function corruption_damage() {
    return random_int(1, 20);
}

const corrupt_ap_cost = 2;

class Corruption { // TODO: decide if there are "values?"
    name = "Corrupted";
    toJSON(key) { return {}; }
};

class CorruptionSpawned extends concepts.Event {
    constructor(position, corruption, from){
        console.assert(corruption instanceof Corruption);
        super({
            allow_parallel_animation: false,
            description: `Corruption spawned at ${JSON.stringify(position)}`,
        })
        this.position = new concepts.Position(position);
        this.corruption = corruption;
        this.from = from;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position, this.from ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);

        const target_gfx_pos = graphic_position(this.position).translate(square_half_unit_vector);

        if(this.from){
            const corrupt_missile_fx = game_view.fx_view.missile(graphic_position(this.from));
            const missile_speed = 8;
            yield* animation.missile(corrupt_missile_fx, target_gfx_pos, missile_speed);
        }

        // TODO: consider adding a spawining effet just for now.
        this.corruption.fx = game_view.fx_view.corrupt(target_gfx_pos);
        // TODO: add sound?
        yield* anim.wait(1000 / 64);
    }
};

class CorruptionVanished extends concepts.Event {
    constructor(position, corruption){
        console.assert(corruption instanceof Corruption);
        super({
            allow_parallel_animation: false,
            description: `Corruption vanished at ${JSON.stringify(position)}`,
        })
        this.position = new concepts.Position(position);
        this.corruption = corruption;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position ]; }


    *animation(game_view){
        console.assert(game_view instanceof GameView);
        console.assert(this.corruption.fx);
        // TODO: consider adding a "speeshhh" effet just for now.
        this.corruption.fx.done = true;
        // TODO: add sound?
        yield* anim.wait(1000 / 64);
    }

};

class Corrupted extends concepts.Event {
    constructor(position, from){
        super({
            allow_parallel_animation: false,
            description: `Corrupted ${JSON.stringify(position)}`,
        })
        this.position = new concepts.Position(position);
        this.from = from;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position, this.from ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        // TODO: add sound?
        // TODO: add an animation here
        yield* anim.wait(1000 / 64);
    }
};

class Corrupt extends concepts.Action {
    icon_def = sprite_defs.icon_action_corrupt;

    constructor(target){
        const action_id = `corrupt_${target.x}_${target.y}`;
        super(action_id, `Corrupt ${JSON.stringify(target)}`, target,
        { // costs
            action_points: corrupt_ap_cost,
        });
    }

    execute(world, character){
        console.assert(world instanceof concepts.World);
        const corruption_grid = world.grids[grid_ID.corruption];
        console.assert(corruption_grid instanceof Grid);
        console.assert(!(corruption_grid.get_at(this.target_position) instanceof Corruption));
        const corruption = new Corruption();
        corruption_grid.set_at(corruption, this.target_position);
        return [
            new Corrupted(this.target_position, character.position),
            new CorruptionSpawned(this.target_position, corruption, character.position),
        ];
    }
};

// This update the state of squares being corrupted or not by following the game of life's rules.
// See https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
function update_corruption_state(world){
    console.assert(world instanceof concepts.World);
    console.assert(is_valid_world(world));
    const events = [];

    const corruption_grid = world.grids[grid_ID.corruption];
    console.assert(corruption_grid instanceof Grid);

    const new_corruption_grid = new Grid(corruption_grid.width, corruption_grid.height);
    const count_neighbors = (position) => {
        let count = 0;
        for(let y = -1; y <= 1; ++y){
            for(let x = -1; x <= 1; ++x){

                if(x === 0 && y === 0)
                    continue;

                const neighbor_pos = {x: position.x + x, y: position.y + y};

                if(!world.is_valid_position(neighbor_pos))
                    continue;

                if(corruption_grid.get_at(neighbor_pos) instanceof Corruption){
                    ++count;
                }
            }
        }
        return count;
    };

    for(let y = 0; y < corruption_grid.height; ++y){
        for(let x = 0; x < corruption_grid.width; ++x){
            const position = {x, y};
            const corruption = corruption_grid.get_at(position);
            const neighbors_count = count_neighbors(position);
            if(corruption instanceof Corruption){
                // Celll is alive
                if(neighbors_count == 2 || neighbors_count == 3){
                    new_corruption_grid.set_at(corruption, position); // Cell kept alive.
                } else {
                    // Cell dies in all other cases.
                    events.push(new CorruptionVanished(position, corruption));
                }
            } else {
                // Cell is dead
                if(neighbors_count >= 3){
                    const new_corruption = new Corruption(); // New cell
                    new_corruption_grid.set_at(new_corruption, position);
                    events.push(new CorruptionSpawned(position, new_corruption));
                }
                // Kept dead in all other cases.
            }
        }
    }

    world.grids[grid_ID.corruption] = new_corruption_grid;
    console.assert(is_valid_world(world));

    return events;
}


function damage_anything_in_corrupted_tiles(world){
    console.assert(world instanceof concepts.World);
    console.assert(is_valid_world(world));
    const events = [];

    const corruption_grid = world.grids[grid_ID.corruption];
    console.assert(corruption_grid instanceof Grid);

    world.entities
        .filter(entity => corruption_grid.get_at(entity.position) instanceof Corruption)
        .map((entity) => {
            events.push(...deal_damage(entity, corruption_damage()));
        });

    return events;
}

class Rule_Corruption extends concepts.Rule {

    update_world_at_the_beginning_of_game_turn(world){
        if(world.turn_id <= 1) // Don't apply this rule on the first turn.
            return [];

        return [
            ...damage_anything_in_corrupted_tiles(world),
            ...update_corruption_state(world),
            ...damage_anything_in_corrupted_tiles(world),
        ];
    }

    range = new visibility.Range_Square(0, 6);

    get_actions_for(character, world){
        console.assert(world instanceof concepts.World);
        console.assert(character instanceof Character);

        const corruption_grid = world.grids[grid_ID.corruption];
        console.assert(corruption_grid instanceof Grid);

        const is_valid_target = (position) => world.is_valid_position(position)
                                        && !(corruption_grid.get_at(position) instanceof Corruption);

        const targets = lazy_call(visibility.positions_in_range, character.position, this.range, is_valid_target);
        return actions_for_each_target(character, Corrupt, targets);
    }
};




