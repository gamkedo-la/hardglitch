export {
    generate_empty_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules } from "../definitions-world.js";

const default_defaults = {
    ground : tiles.ID.GROUND,
    wall : tiles.ID.WALL,
};

function generate_empty_world(width, height, defaults = default_defaults){

    const world_width = width;
    const world_height = height;
    const grid_size = world_width * world_height;
    const floor_tile_grid = new Array(grid_size).fill(defaults.ground);
    const surface_tile_grid = new Array(grid_size).fill(undefined);
    surface_tile_grid[0] = tiles.ID.ENTRY;
    surface_tile_grid[grid_size-1] = tiles.ID.EXIT;

    const world = new concepts.World( world_width, world_height, floor_tile_grid, surface_tile_grid );
    world.set_rules(...default_rules);

    return world;
}