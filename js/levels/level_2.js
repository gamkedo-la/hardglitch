export {
    generate_world,
}

import * as debug from "../system/debug.js";
import * as tiles from "../definitions-tiles.js";
import * as tools from "./level-tools.js";
import { Position } from "../core/concepts.js";
import { random_int, random_sample } from "../system/utility.js";


const level_name = "Level 1: Random Access Memory";

const defaults = {
    floor : tiles.ID.LVL2A,
    floor_alt: tiles.ID.LVL2B,
    wall : tiles.ID.WALL2A,
    wall_alt : tiles.ID.WALL2B,
};

const rooms = {
    // test_room_1: {
    //     "name" : "Test Level 'testing' 9 x 9",
    //     "width" : 9,
    //     "height" : 9,
    //     "grids" : {"floor":[105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105,105],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    //     "entities" : []
    // },
    test_room_2: {
        "name" : "Test Level 'testing' 9 x 9",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,122,122,105,105,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    }
};

window.level_2_rooms = rooms;

function* generate_room_selection(room_count){
    debug.assertion(()=>Number.isInteger(room_count) && room_count >= 0);
    const possible_rooms = Object.values(rooms);
    while(room_count > 0){
        yield tools.random_variation(random_sample(possible_rooms));
        --room_count;
    }
}

function* generate_room_positions(horizontal_room_count, vertical_room_count){
    debug.assertion(()=>Number.isInteger(horizontal_room_count) && horizontal_room_count >= 0);
    debug.assertion(()=>Number.isInteger(vertical_room_count) && vertical_room_count >= 0);

    const room_size = { x: 9, y: 9 };

    const inter_room_space = { x: 2, y: 2 };
    for(let y = 0; y < vertical_room_count; ++y){
        for(let x = 0; x < horizontal_room_count; ++x){
            const normal_position = new Position({x: x * (room_size.x + inter_room_space.x), y: y * (room_size.y + inter_room_space.y)})
                .translate(inter_room_space); // top-left inter-room space.
            const tweaked_position = random_int(1, 100) < 20 ? normal_position : random_sample(normal_position.adjacents_diags);
            yield tweaked_position;
        }
    }
}

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
    const room_grid = { x: 6, y: 6 };
    const room_count = room_grid.x * room_grid.y;
    const room_positions_iter = generate_room_positions(room_grid.x, room_grid.y);
    const selected_rooms_iter = generate_room_selection(room_count);
    const positionned_selected_rooms = Array.from({length:room_count}, ()=> { return { position: room_positions_iter.next().value, world_desc: selected_rooms_iter.next().value } });

    const ram_world_with_rooms = tools.merge_world_chunks(level_name, defaults,
        { position: { x:0, y: 0}, world_desc: ram_world_chunk },
        ...positionned_selected_rooms
    );

    // Pass 3: fill the inter-room corridors with walls and entities

    const world_desc = tools.add_padding_around(ram_world_with_rooms, { floor: tiles.ID.VOID });// tools.random_variation(ram_world_with_rooms);
    const world = tools.deserialize_world(world_desc);

    return world;
}