

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int, index_from_position } from "../system/utility.js";
import { RandomActionEnemy } from "../enemies/test-enemy.js";

import * as tiles from "../definitions-tiles.js";
import { world_grid, default_rules } from "../definitions-world.js";





function make_test_world(){ // The game assets must have been initialized first.
    const test_world_size = { width: 24, height: 24 }; // = world_grid;
    const grid_size = test_world_size.height * test_world_size.width;
    const floor_tile_grid = new Array(grid_size);
    floor_tile_grid.fill(tiles.ID.GROUND, grid_size /2, grid_size);

    const surface_tile_grid = new Array(grid_size);

    function set_surface_tile(position, tile_id){
        surface_tile_grid[index_from_position(test_world_size.width, test_world_size.height, position)] = tile_id;
    };

    function random_position(){
        return new concepts.Position(random_int(0, test_world_size.width - 1 ), random_int(0, test_world_size.height - 1 ));
    }

    set_surface_tile({x:6, y:6}, tiles.ID.WALL);
    set_surface_tile({x:7, y:6}, tiles.ID.WALL);
    set_surface_tile({x:6, y:7}, tiles.ID.WALL);

    set_surface_tile({x:2, y:0}, tiles.ID.WALL);
    set_surface_tile({x:3, y:0}, tiles.ID.WALL);
    set_surface_tile({x:4, y:0}, tiles.ID.WALL);

    set_surface_tile({x:0, y:0}, tiles.ID.ENTRY);
    set_surface_tile({x:11, y:11}, tiles.ID.ENTRY);
    set_surface_tile({x:4, y:4}, tiles.ID.ENTRY);
    set_surface_tile({x:4, y:8}, tiles.ID.ENTRY);
    set_surface_tile({x:8, y:8}, tiles.ID.EXIT);


    const world = new concepts.World( test_world_size.width, test_world_size.height, floor_tile_grid, surface_tile_grid );

    world.set_rules(...default_rules);

    for(let i = 0; i < 20; ++i){
        const enemy = new RandomActionEnemy();
        enemy.position = random_position();
        world.add(enemy);
    }

    return world;
}


