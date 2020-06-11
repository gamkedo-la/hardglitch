

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int, index_from_position } from "../system/utility.js";
import { RandomActionEnemy } from "../enemies/test-enemy.js";

import * as tiles from "../definitions-tiles.js";
import { world_grid, default_rules } from "../definitions-world.js";





function make_test_world(){ // The game assets must have been initialized first.
    const test_world_size = world_grid;
    const grid_size = test_world_size.height * test_world_size.width;

    const floor_tile_grid = new Array(grid_size);
    const surface_tile_grid = new Array(grid_size);

    function set_floor_tile(position, tile_id){
        floor_tile_grid[index_from_position(test_world_size.width, test_world_size.height, position)] = tile_id;
    };

    function set_surface_tile(position, tile_id){
        surface_tile_grid[index_from_position(test_world_size.width, test_world_size.height, position)] = tile_id;
    };

    function random_position(){
        return new concepts.Position(random_int(0, test_world_size.width - 1 ), random_int(0, test_world_size.height - 1 ));
    }

    // set floor/walls/holes
    let wallPct = .2;
    let voidPct = .1;
    for (let j=0; j<test_world_size.height; j++) {
        for (let i=0; i<test_world_size.width; i++) {
            // pick a random number
            let choice = Math.random();
            let tileID;
            // check wall pct
            if (choice <= wallPct) {
                tileID = tiles.ID.WALL;
            // check void pct
            } else if ( choice <= wallPct+voidPct) {
                tileID = tiles.ID.VOID;
            // otherwise ground
            } else {
                tileID = tiles.ID.GROUND;
            }
            // walls get assigned to both surface layers
            if (tileID == tiles.ID.WALL) {
                set_surface_tile(new concepts.Position(i, j), tileID);
            }
            // void/ground/wall tiles get assigned to floor layer (wall gets assigned to both surface/floor)
            set_floor_tile(new concepts.Position(i, j), tileID);
        }
    }

    /*
    for(let i = 0; i < grid_size / 0.8; ++ i){
        set_floor_tile(random_position(), tiles.ID.GROUND);
    }

    for(let i = 0; i < grid_size / 5; ++ i){
        set_surface_tile(random_position(), tiles.ID.WALL);
    }
    */

    for(let i = 0; i < grid_size / 200; ++i){
        set_surface_tile(random_position(), tiles.ID.ENTRY);
    }

    for(let i = 0; i < grid_size / 500; ++i){
        set_surface_tile(random_position(), tiles.ID.EXIT);
    }

    const world = new concepts.World( test_world_size.width, test_world_size.height, floor_tile_grid, surface_tile_grid );

    world.set_rules(...default_rules);

    for(let i = 0; i < 20; ++i){
        const enemy = new RandomActionEnemy();
        enemy.position = random_position();
        world.add(enemy);
    }

    return world;
}


