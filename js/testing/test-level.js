

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int, index_from_position, random_sample } from "../system/utility.js";
import { RandomActionEnemy } from "../characters/test-enemy.js";

import * as tiles from "../definitions-tiles.js";
import { world_grid, default_rules, is_blocked_position, grid_ID } from "../definitions-world.js";
import * as items from "../definitions-items.js";

import { test_rules } from "./test-rules.js";
import * as visibility from "../core/visibility.js";
import { LifeForm_Strong, LifeForm_Weak } from "../characters/lifeform.js";
import { Grid } from "../system/grid.js";
import { all_characters_types } from "../deflinitions-characters.js";
import { GlitchyGlitchMacGlitchy } from "../characters/glitch.js";
import { DEBUG_TOOLS_ENABLED } from "../editor.js";

const defaults = {
    ground : tiles.ID.CALCFLOORWARM,
    ground2 : tiles.ID.CALCFLOORCOOL,
    wall : tiles.ID.WALL,
    grounds : [
        tiles.ID.LVL1A,
        tiles.ID.LVL1B,
        tiles.ID.LVL2A,
        tiles.ID.LVL2B,
        tiles.ID.LVL3A,
        tiles.ID.LVL3B,
        tiles.ID.LVL4A,
        tiles.ID.LVL4B,
    ],
    walls : [
        tiles.ID.WALL1A,
        tiles.ID.WALL1B,
        tiles.ID.WALL2A,
        tiles.ID.WALL2B,
        tiles.ID.WALL3A,
        tiles.ID.WALL3B,
        tiles.ID.WALL4A,
        tiles.ID.WALL4B,
    ],

};


function make_test_world(test_world_size = world_grid){ // The game assets must have been initialized first.
    const grid_size = test_world_size.height * test_world_size.width;

    const floor_tile_grid = new Array(grid_size);
    const surface_tile_grid = new Array(grid_size);

    function index(position){
        return index_from_position(test_world_size.width, test_world_size.height, position)
    }

    function set_floor_tile(position, tile_id){
        floor_tile_grid[index(position)] = tile_id;
        return position;
    };

    function set_surface_tile(position, tile_id){
        surface_tile_grid[index(position)] = tile_id;
        return position;
    };

    function floor_tile_id(position){
        return floor_tile_grid[index(position)];
    }

    function surface_tile_id(position){
        return surface_tile_grid[index(position)];
    }

    function is_floor_walkable(position){
        const tile_id = floor_tile_id(position);
        return tiles.is_safely_walkable(tile_id);
    }

    function random_position(){
        while(true){
            const position = { x:random_int(1, test_world_size.width - 2 ), y:random_int(1, test_world_size.height - 2 )};
            if(is_floor_walkable(position))
                return new concepts.Position(position);
        }
    }

    // set floor/walls/holes
    let wallPct = .2;
    let holePct = .1;
    let voidPct = .05;
    for (let j=0; j<test_world_size.height; j++) {
        for (let i=0; i<test_world_size.width; i++) {
            // pick a random number
            const choice = Math.random();
            let tileID;
            // check wall pct
            if (choice <= wallPct) {
                //tileID = tiles.ID.WALL;
                tileID = random_sample(defaults.walls);
            // check hole pct
            } else if ( choice <= wallPct+holePct) {
                tileID = tiles.ID.HOLE;
            // check void pct
            } else if ( choice <= wallPct+holePct+voidPct) {
                tileID = tiles.ID.VOID;
            // otherwise ground
            } else {
                //tileID = (Math.random() > .8) ? defaults.ground2 : defaults.ground;
                tileID = random_sample(defaults.grounds);
            }
            // hole/ground/wall tiles get assigned to floor layer (wall gets assigned to both surface/floor)
            set_floor_tile(new concepts.Position({x:i, y:j}), tileID);
        }
    }

    const entry_point_position = set_surface_tile(random_position(), tiles.ID.ENTRY);
    console.assert(is_floor_walkable(entry_point_position));

    const world = new concepts.World(`Random Test Level ${test_world_size.width} x ${test_world_size.height}`,
        test_world_size.width, test_world_size.height,
        {
            [grid_ID.floor]:        new Grid(test_world_size.width, test_world_size.height, floor_tile_grid),
            [grid_ID.surface]:      new Grid(test_world_size.width, test_world_size.height, surface_tile_grid),
            [grid_ID.corruption]:   new Grid(test_world_size.width, test_world_size.height),
            [grid_ID.unstable]:     new Grid(test_world_size.width, test_world_size.height),
        }
        );
    console.assert(world.grids[grid_ID.surface].matching_positions(tileid=> tileid == tiles.ID.ENTRY).length > 0);

    world.set_rules(...default_rules, ...test_rules);

    function can_insert_something_there(position){
        return !position.equals(entry_point_position)
            && ( world.tiles_at(position).length == 0 || !is_blocked_position(world, position, tiles.is_safely_walkable) );
    }

    let ennemy_count = 40;
    while(ennemy_count > 0){
        const position = random_position();
        if(can_insert_something_there(position)){
            const enemy_type = random_int(0, 100) >= 50 ? random_sample(items.all_item_types()) : random_sample(all_characters_types().filter(type=>type !== GlitchyGlitchMacGlitchy));
            const enemy = new enemy_type();
            enemy.position = position;
            world.add_entity(enemy);
            --ennemy_count;
        }
    }

    const crypto_file_types = items.all_crypto_file_types();
    while(crypto_file_types.length !== 0){
        const position = random_position();
        if(can_insert_something_there(position)){
            const file_type = crypto_file_types.pop();
            const file = new file_type();
            file.position = position;
            world.add_entity(file);
        }
    }

    const crypto_key_types = items.all_crypto_key_types();
    while(crypto_key_types.length !== 0){
        const position = random_position();
        if(can_insert_something_there(position)){
            const key_type = crypto_key_types.pop();
            const key = new key_type();
            key.position = position;
            world.add_entity(key);
        }
    }

    //////////////////////////////////////////////////////////////
    // Testing range view:
    const inner_range = { begin: 1, end: 2 };
    const space_between_inner_outter = 1;
    const outter_begin  = inner_range.end + space_between_inner_outter;
    const outter_range = { begin: outter_begin, end: outter_begin + 2 };
    const rim_range = { begin: outter_range.end, end: outter_range.end + 1 };
    const clean_range = { begin: 1, end: rim_range.end + 1 };
    const test_shape = visibility.Range_Square;

    const clean_shape = new visibility.Range_Square(clean_range.begin, clean_range.end);
    const inner_shape = new test_shape(inner_range.begin, inner_range.end);
    const outter_shape = new test_shape(outter_range.begin, outter_range.end);
    const rim_shape = new test_shape(rim_range.begin, rim_range.end);
    const valid_positions_filter = pos => world.is_valid_position(pos);


    //// Border of the world
    const world_border_tile = tiles.ID.HOLE;
    for(let x = 0; x < world.width; ++x){
        set_floor_tile({x, y:0}, world_border_tile);
        set_floor_tile({x, y:world.height -1}, world_border_tile);
    }
    for(let y = 0; y < world.height; ++y){
        set_floor_tile({x:0, y}, world_border_tile);
        set_floor_tile({x: world.width - 1, y}, world_border_tile);
    }


    // cleanup
    visibility.positions_in_range(entry_point_position, clean_shape, valid_positions_filter)
        .filter(position => world.is_valid_position(position))
        .forEach(position=>{
            set_floor_tile(position, defaults.ground);
            world.remove_entity_at(position);
        });

    // closer stuffs
    let is_first_item = true;
    visibility.positions_in_range(entry_point_position, inner_shape, valid_positions_filter)
        .filter(position => world.is_valid_position(position))
        .forEach(position=>{
            const item_type = is_first_item ? items.Debug_AllActions :
                                              ( random_int(0, 100) >= 70 ? LifeForm_Weak : random_sample([...items.all_item_types()]) );
            const entity = new item_type();
            entity.position = position;
            world.add_entity(entity);
            is_first_item = false;
        });

    // farther voids
    visibility.positions_in_range(entry_point_position, outter_shape, valid_positions_filter)
        .filter(position => world.is_valid_position(position))
        .forEach(position=>{
            set_floor_tile(position, tiles.ID.VOID);
        });

    // rim
    visibility.positions_in_range(entry_point_position, rim_shape, valid_positions_filter)
    .filter(position => world.is_valid_position(position))
    .forEach(position=>{
        const item_type = random_sample(items.all_movable_walls());
        const file = new item_type();
        file.position = position;
        world.add_entity(file);
    });

    let exit_count = 8;
    while(exit_count > 0){
        const exit_pos = random_position();
        const tileid = surface_tile_id(exit_pos);
        if(tileid !== tiles.ID.EXIT  // Don't overwrite other exits!
        && tileid !== tiles.ID.ENTRY // Don't overwrite entries!
        && is_floor_walkable(exit_pos)) {
            set_surface_tile(exit_pos, tiles.ID.EXIT);
            --exit_count;
        }
    }

    return world;
}


