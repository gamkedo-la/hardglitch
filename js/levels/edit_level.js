export {
    generate_empty_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules } from "../definitions-world.js";
import { Grid } from "../system/grid.js";
//import * as audio from "../system/audio.js"; // inserted here to test with sound effects

const default_defaults = {
    ground : tiles.ID.CALCFLOORWARM,
    wall : tiles.ID.WALL,
};

function generate_empty_world(name, width, height, defaults = default_defaults){

    const floor_tile_grid = new Grid(width, height).fill(defaults.ground);
    const surface_tile_grid = new Grid(width, height);
    const corruption_tile_grid = new Grid(width, height);
    const unstable_tile_grid = new Grid(width, height);
    surface_tile_grid.set_at(tiles.ID.ENTRY, {x: 0, y:0 });
    surface_tile_grid.set_at(tiles.ID.EXIT, { x: width - 1, y: height - 1 });

    const world = new concepts.World(`Test Level \"${name}\" ${width} x ${height}`,
                                    width, height,
                                    [ floor_tile_grid, surface_tile_grid, corruption_tile_grid, unstable_tile_grid ]);
    world.set_rules(...default_rules);
    //audio.playEvent('HGBreakdown'); // inserted here to test with sound effects
    return world;
}