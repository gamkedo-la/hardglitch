
export {
    Rule_Corruption,
    Corruption,
    Corrupt,
    CorruptionSpawned,
    CorruptionVanished,
    corruption_turns_to_update,
}

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as visibility from "../core/visibility.js";
import * as anim from "../system/animation.js";
import * as animation from "../game-animations.js";
import * as audio from "../system/audio.js";

import { deal_damage } from "./destruction.js";
import { auto_newlines, lazy_call, random_int } from "../system/utility.js";
import { grid_ID, is_valid_world } from "../definitions-world.js";
import { Character } from "../core/character.js";
import { Grid } from "../system/grid.js";
import { sprite_defs } from "../game-assets.js";
import { actions_for_each_target } from "./rules-common.js";
import { GameView } from "../game-view.js";
import { EntityView, graphic_position, square_half_unit_vector } from "../view/entity-view.js";

const corruption_turns_to_update = 8;
const corruption_damage_min = 1;
const corruption_damage_max = 5;

function corruption_damage() {
    return random_int(corruption_damage_min, corruption_damage_max);
}

const corrupt_ap_cost = 2;
const corrupt_range = new visibility.Range_Square(0, 6);

const corruption_name = "Corrupted Memory";
const corruption_desc = auto_newlines(`Deals from ${corruption_damage_min} to ${corruption_damage_max} damages to entities here at the end of every Cycles. Every computer Cycle multiple of ${corruption_turns_to_update}, all corruption updates following the rules of Conway's Game Of Life.`, 33);

const corrupt_desc = auto_newlines(`Corrupts the target memory section.\nThe corrupted memory will deal damage every cycles to any entity in it. All corruption updates every computer Cycle multiple of ${corruption_turns_to_update} following the rules of Conway's Game Of Life.`, 35);

function play_corruption_update_sound(){
    if(Rule_Corruption.need_corruption_update_sound && audio.are_events_enabled()){ // We make sure that the sound will be heard if visible.
        Rule_Corruption.need_corruption_update_sound = false;
        audio.playEvent("spawnAnim");
    }
}

class Corruption {
    get name(){ return corruption_name; }
    get description(){ return corruption_desc };
    toJSON(key) { return {}; }
};

class CorruptionSpawned extends concepts.Event {
    constructor(position, corruption, from){
        debug.assertion(()=>corruption instanceof Corruption);
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
        debug.assertion(()=>game_view instanceof GameView);

        const target_gfx_pos = graphic_position(this.position).translate(square_half_unit_vector);

        if(this.from){
            const corrupt_missile_fx = game_view.fx_view.missile(graphic_position(this.from));
            const missile_speed = 8;
            yield* animation.missile(corrupt_missile_fx, target_gfx_pos, missile_speed);
        }

        // TODO: consider adding a spawining effet just for now.
        this.corruption.fx = game_view.fx_view.corrupt(target_gfx_pos);
        ++game_view._visible_corruptions;
        play_corruption_update_sound();
        yield* anim.wait(1000 / 32);
    }
};

class CorruptionVanished extends concepts.Event {
    constructor(position, corruption){
        debug.assertion(()=>corruption instanceof Corruption);
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
        debug.assertion(()=>game_view instanceof GameView);
        if(this.corruption.fx){
            // TODO: consider adding a "speeshhh" effet just for now.
            this.corruption.fx.done = true;
            --game_view._visible_corruptions;
            play_corruption_update_sound();
        }
        yield* anim.wait(1000 / 64);
    }

};

class CorruptionDamage extends concepts.Event {
    constructor(position, entity_id){
        debug.assertion(()=>Number.isInteger(entity_id));
        super({
            allow_parallel_animation: true,
            description: `Corruption deals damage at ${JSON.stringify(position)} to entity ${entity_id}`,
        })
        this.position = new concepts.Position(position);
        this.entity_id = entity_id;
    }

    get is_world_event() { return false; }
    get focus_positions() { return [ this.position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);

        const entity_view = game_view.get_entity_view(this.entity_id);
        if(entity_view instanceof EntityView){ // FIXME
            audio.playEvent("corruptAction");
            yield* animation.take_hit_damage(game_view.fx_view, entity_view);
        }
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
        debug.assertion(()=>game_view instanceof GameView);
        audio.playEvent("corruptAction");
        // TODO: add an animation here
        yield* anim.wait(1000 / 64);
    }
};

class Corrupt extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_corrupt; }
    static get action_type_name() { return "Corrupt"; }
    static get action_type_description() { return corrupt_desc; }
    static get costs(){
        return {
            action_points: { value: corrupt_ap_cost },
        };
    }
    static get range() { return corrupt_range; }

    constructor(target){
        const action_id = `corrupt_${target.x}_${target.y}`;
        super(action_id, `Make that memory section Corrupted`, target);
    }

    execute(world, character){
        debug.assertion(()=>world instanceof concepts.World);
        const corruption_grid = world.grids[grid_ID.corruption];
        debug.assertion(()=>corruption_grid instanceof Grid);
        debug.assertion(()=>!(corruption_grid.get_at(this.target_position) instanceof Corruption));
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
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>is_valid_world(world));
    const events = [];

    const corruption_grid = world.grids[grid_ID.corruption];
    debug.assertion(()=>corruption_grid instanceof Grid);

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
    debug.assertion(()=>is_valid_world(world));

    return events;
}


function damage_anything_in_corrupted_tiles(world){
    debug.assertion(()=>world instanceof concepts.World);
    debug.assertion(()=>is_valid_world(world));
    const events = [];

    const corruption_grid = world.grids[grid_ID.corruption];
    debug.assertion(()=>corruption_grid instanceof Grid);

    world.entities
        .filter(entity => corruption_grid.get_at(entity.position) instanceof Corruption)
        .forEach(entity => {
            if((!entity.immunity || !entity.immunity.corruption)
            && !(entity instanceof concepts.Item)){ // Disable corruption effects on Items.
                events.push( new CorruptionDamage(entity.position, entity.id)
                           , ...deal_damage(entity, corruption_damage())
                           );
            }
        });

    return events;
}

class Rule_Corruption extends concepts.Rule {

    static need_corruption_update_sound = false;

    turns_since_last_corruption_update = 0;

    constructor(){
        super();
        Rule_Corruption.need_corruption_update_sound = false;
    }

    update_world_at_the_beginning_of_game_turn(world){
        ++this.turns_since_last_corruption_update;

        if(world.turn_id <= 1) // Don't apply this rule on the first turn.
            return [];


        const events = [];

        if(this.turns_since_last_corruption_update >= corruption_turns_to_update){ // We update the corruption positions.
            const corruption_update_events = update_corruption_state(world);
            events.push(...corruption_update_events);
            this.turns_since_last_corruption_update = 0;
            if(corruption_update_events.length > 0){
                Rule_Corruption.need_corruption_update_sound = true;
            }
        }

        events.push(...damage_anything_in_corrupted_tiles(world));

        return events;
    }


    get_actions_for(character, world){
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);

        const corruption_grid = world.grids[grid_ID.corruption];
        debug.assertion(()=>corruption_grid instanceof Grid);

        const is_valid_target = (position) => world.is_valid_position(position)
                                        && !(corruption_grid.get_at(position) instanceof Corruption);

        const targets = (range) => lazy_call(visibility.positions_in_range, character.position, range, is_valid_target);
        return actions_for_each_target(character, Corrupt, targets);
    }
};




