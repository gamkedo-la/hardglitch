export {
    generate_empty_world,
    serialize_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules, is_valid_world, grid_name } from "../definitions-world.js";
import { Grid } from "../system/grid.js";
import * as audio from "../system/audio.js"; // inserted here to test with sound effects

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
    audio.playEvent('HGBreakdown'); // inserted here to test with sound effects
    return world;
}


function serialize_world(world){
    console.assert(is_valid_world(world));

    // const spacing = 2;

    // let grids_serialized = "{ ";

    // world.grids.forEach((grid, idx) => {
    //     const name = grid_name(idx);

    //     let grid_str = "[ ";
    //     grid.elements.forEach((value, idx)=>{
    //         grid_str += JSON.stringify(value);

    //     });

    //     serialized.grids[name] = grid.elements;
    // });




    const world_serialized =
`{
    name: ${world.name},
    width: ${world.width},
    height: ${world.height},
    grids: ${JSON.stringify(world.grids)}
}`;

    return world_serialized;
}


