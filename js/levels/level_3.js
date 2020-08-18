export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { world_grid, default_rules } from "../definitions-world.js";

const defaults = {
    ground : tiles.ID.GROUND,
    wall : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 3:
    // CPU Caches: https://trello.com/c/wgMFsGbN/76-level-3-cpu-caches
    //

    const world_width = 30;
    const world_height = 30;
    const grid_size = world_width * world_height;
    const floor_tile_grid = new Array(grid_size).fill(defaults.ground);
    const surface_tile_grid = new Array(grid_size).fill(undefined);
    surface_tile_grid[0] = tiles.ID.ENTRY;
    surface_tile_grid[grid_size-1] = tiles.ID.EXIT;

    const world = new concepts.World( world_width, world_height, floor_tile_grid, surface_tile_grid );
    world.set_rules(...default_rules);

    return world;
}