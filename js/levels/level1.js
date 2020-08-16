export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { world_grid, default_rules } from "../definitions-world.js";
import * as audio from "../system/audio.js";

function generate_world(){
    const world_width = 10;
    const world_height = 10;
    const grid_size = world_width * world_height;
    const floor_tile_grid = new Array(grid_size).fill(tiles.ID.GROUND);
    const surface_tile_grid = new Array(grid_size).fill(undefined);
    surface_tile_grid[0] = tiles.ID.ENTRY;
    surface_tile_grid[grid_size-1] = tiles.ID.EXIT;

    const world = new concepts.World( 10, 10, floor_tile_grid, surface_tile_grid );
    world.set_rules(...default_rules);

    audio.playEvent('GlitchyLife');

    return world;
}