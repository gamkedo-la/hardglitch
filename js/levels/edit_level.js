export {
    generate_empty_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules } from "../definitions-world.js";
import { Grid } from "../system/grid.js";

const default_defaults = {
    ground : tiles.ID.GROUND,
    wall : tiles.ID.WALL,
};

function generate_empty_world(name, width, height, defaults = default_defaults){

    const world_width = width;
    const world_height = height;
    const grid_size = world_width * world_height;
    const floor_tile_grid = new Grid(world_width, world_height).fill(defaults.ground);
    const surface_tile_grid = new Grid(world_width, world_height).fill(undefined);
    surface_tile_grid.set_at(tiles.ID.ENTRY, {x: 0, y:0 });
    surface_tile_grid.set_at(tiles.ID.EXIT, { x: world_width - 1, y: world_height - 1 });

    const world = new concepts.World(`Test Level \"${name}\" ${world_width} x ${world_height}`,
                                    world_width, world_height,
                                    [ floor_tile_grid, surface_tile_grid ]);
    world.set_rules(...default_rules);

    return world;
}