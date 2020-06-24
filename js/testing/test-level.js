

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int, index_from_position } from "../system/utility.js";
import { RandomActionEnemy } from "../enemies/test-enemy.js";

import * as tiles from "../definitions-tiles.js";
import { world_grid, default_rules } from "../definitions-world.js";
import { sprite_defs } from "../game-assets.js";

class CryptoFile extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.crypto_file,
        }
    };

};

class CryptoKey extends concepts.Item {
    assets = {
        graphics : {
            sprite_def : sprite_defs.crypto_key,
        }
    };

};


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

    function is_walkable(position){
        const tile_id = floor_tile_id(position);
        if(tile_id === undefined)
            return false;
        return tiles.defs[tile_id].is_walkable;
    }

    function random_position(){
        while(true){
            const position = { x:random_int(0, test_world_size.width - 1 ), y:random_int(0, test_world_size.height - 1 )};
            if(is_walkable(position))
                return new concepts.Position(position);
        }
    }

    // set floor/walls/holes
    let wallPct = .2;
    let holePct = .1;
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
            // otherwise ground
            } else {
                tileID = tiles.ID.GROUND;
            }
            // hole/ground/wall tiles get assigned to floor layer (wall gets assigned to both surface/floor)
            set_floor_tile(new concepts.Position({x:i, y:j}), tileID);
        }
    }

    const entry_point_position = set_surface_tile(random_position(), tiles.ID.ENTRY);
    console.assert(is_walkable(entry_point_position));

    for(let i = 0; i < grid_size / 500; ++i){
        const exit_pos = random_position();
        if(surface_tile_id(exit_pos) != tiles.ID.ENTRY) // Don't overwrite entries!
            set_surface_tile(exit_pos, tiles.ID.EXIT);
    }

    const world = new concepts.World( test_world_size.width, test_world_size.height, floor_tile_grid, surface_tile_grid );
    console.assert(world._surface_tile_grid.matching_positions(tileid=> tileid == tiles.ID.ENTRY).length > 0);

    world.set_rules(...default_rules);

    let ennemy_count = 20;
    while(ennemy_count > 0){
        const position = random_position();
        if(position.equals(entry_point_position)) // Don't place enemies on the entry point!
            continue;

        const enemy = new RandomActionEnemy();
        enemy.position = position;
        world.add(enemy);
        --ennemy_count;
    }

    let file_count = 4;
    while(file_count > 0){
        const position = random_position();
        if(world.is_blocked_position(position, tiles.is_walkable))
            continue;

        const file = new CryptoFile();
        file.position = position;
        world.add(file);
        --file_count;
    }

    let key_count = 4;
    while(key_count > 0){
        const position = random_position();
        if(world.is_blocked_position(position, tiles.is_walkable))
            continue;

        const key = new CryptoKey();
        key.position = position;
        world.add(key);
        --key_count;
    }

    return world;
}


