export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import * as tools from "./level-tools.js";


const level_name = "Level 1: Random Access Memory";

const defaults = {
    floor : tiles.ID.LVL2A,
    floor_alt: tiles.ID.LVL2B,
    wall : tiles.ID.WALL2A,
    wall_alt : tiles.ID.WALL2B,
};

const rooms = {
    test_room: {
        "name" : "Test Level 'testing' 9 x 9",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    }
};



function generate_world(){

    // LEVEL 2:
    // RAM: https://trello.com/c/wQCJeRfn/75-level-2-ram
    //

    // Lesson learn from level 1: it's far better to build in layers/pass than to predetermine details and assemble later.
    // Therefore, we'll fill the world with different passes.

    // Pass 1: empty world, with the appropriate size.
    const ram_world_chunk = tools.create_chunk(64, 64, defaults);
    ram_world_chunk.name = level_name;

    // Pass 2: put some rooms in a grid, with variations, including the exit and entry

    // Pass 3: fill the inter-room corridors with walls and entities

    const world_desc = tools.random_variation(ram_world_chunk);
    const world = tools.deserialize_world(world_desc);

    return world;
}