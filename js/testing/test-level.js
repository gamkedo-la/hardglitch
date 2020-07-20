

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int, index_from_position } from "../system/utility.js";
import { RandomActionEnemy } from "../enemies/test-enemy.js";

import * as tiles from "../definitions-tiles.js";
import { world_grid, default_rules } from "../definitions-world.js";
import { CryptoFile, CryptoKey } from "../definitions-items.js";

import { test_rules } from "./test-rules.js";
import * as visibility from "../core/visibility.js";

function make_test_world(){ // The game assets must have been initialized first.
    const test_world_size = world_grid;
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
            const position = { x:random_int(0, test_world_size.width - 2 ), y:random_int(0, test_world_size.height - 2 )};
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
                tileID = tiles.ID.WALL;
            // check hole pct
            } else if ( choice <= wallPct+holePct) {
                tileID = tiles.ID.HOLE;
            // check void pct
            } else if ( choice <= wallPct+holePct+voidPct) {
                tileID = tiles.ID.VOID;
            // otherwise ground
            } else {
                tileID = tiles.ID.GROUND;
            }
            // hole/ground/wall tiles get assigned to floor layer (wall gets assigned to both surface/floor)
            set_floor_tile(new concepts.Position({x:i, y:j}), tileID);
        }
    }

    const entry_point_position = set_surface_tile(random_position(), tiles.ID.ENTRY);
    console.assert(is_floor_walkable(entry_point_position));

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

    const world = new concepts.World( test_world_size.width, test_world_size.height, floor_tile_grid, surface_tile_grid );
    console.assert(world._surface_tile_grid.matching_positions(tileid=> tileid == tiles.ID.ENTRY).length > 0);

    world.set_rules(...default_rules, ...test_rules);

    function can_insert_something_there(position){
        return !position.equals(entry_point_position)
            && ( world.tiles_at(position).length == 0 || !world.is_blocked_position(position, tiles.is_safely_walkable) );
    }

    let ennemy_count = 60;
    while(ennemy_count > 0){
        const position = random_position();
        if(can_insert_something_there(position)){
            const enemy = new RandomActionEnemy();
            enemy.position = position;
            world.add(enemy);
            --ennemy_count;
        }
    }

    let file_count = 4;
    while(file_count > 0){
        const position = random_position();
        if(can_insert_something_there(position)){
            const file = new CryptoFile();
            file.position = position;
            world.add(file);
            --file_count;
        }
    }

    let key_count = 4;
    while(key_count > 0){
        const position = random_position();
        if(can_insert_something_there(position)){
            const key = new CryptoKey();
            key.position = position;
            world.add(key);
            --key_count;
        }
    }

    //////////////////////////////////////////////////////////////
    // Testing range view:
    const inner_range = { begin: 1, end: 2 };
    const space_between_inner_outter = 1;
    const outter_begin  = inner_range.end + space_between_inner_outter;
    const outter_range = { begin: outter_begin, end: outter_begin + 2 };
    const clean_range = { begin: 1, end: outter_range.end + 1 };
    const test_shape = visibility.Range_Square;

    const clean_shape = new visibility.Range_Square(clean_range.begin, clean_range.end);
    const inner_shape = new test_shape(inner_range.begin, inner_range.end);
    const outter_shape = new test_shape(outter_range.begin, outter_range.end);
    const valid_positions_filter = pos => world.is_valid_position(pos);

    // cleanup
    visibility.positions_in_range(entry_point_position, clean_shape, valid_positions_filter)
        .filter(position => world.is_valid_position(position))
        .forEach(position=>{
            set_floor_tile(position, tiles.ID.GROUND);
            set_surface_tile(position, undefined);
            world.remove_entity_at(position);
        });

    // closer stuffs
    visibility.positions_in_range(entry_point_position, inner_shape, valid_positions_filter)
        .filter(position => world.is_valid_position(position))
        .forEach(position=>{
            const item_type = random_int(0, 100) >= 50 ? CryptoFile : CryptoKey;
            const file = new item_type();
            file.position = position;
            world.add(file);
        });

    // farther voids
    visibility.positions_in_range(entry_point_position, outter_shape, valid_positions_filter)
        .filter(position => world.is_valid_position(position))
        .forEach(position=>{
            set_floor_tile(position, tiles.ID.VOID);
        });

    //// Border of the world
    const world_border_tile = undefined;
    for(let x = 0; x < world.width; ++x){
        set_floor_tile({x, y:0}, world_border_tile);
        set_floor_tile({x, y:world.height -1}, world_border_tile);
    }
    for(let y = 0; y < world.height; ++y){
        set_floor_tile({x:0, y}, world_border_tile);
        set_floor_tile({x: world.width - 1, y}, world_border_tile);
    }

    return world;
}


