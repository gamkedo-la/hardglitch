export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { world_grid, default_rules } from "../definitions-world.js";

const defaults = {
    ground : tiles.ID.GROUND2,
    wall : tiles.ID.WALL,
};

function generate_world(){

    // LEVEL 2:
    // RAM: https://trello.com/c/wQCJeRfn/75-level-2-ram
    //

    const world_width = 20;
    const world_height = 20;
    const grid_size = world_width * world_height;
    const floor_tile_grid = new Array(grid_size).fill(defaults.ground);
    const surface_tile_grid = new Array(grid_size).fill(undefined);
    surface_tile_grid[0] = tiles.ID.ENTRY;
    surface_tile_grid[grid_size-1] = tiles.ID.EXIT;

    const world = new concepts.World( world_width, world_height, floor_tile_grid, surface_tile_grid );
    world.set_rules(...default_rules);

    return world;
}