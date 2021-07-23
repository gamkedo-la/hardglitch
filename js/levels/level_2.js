export {
    generate_world,

    process_procgen_tiles,
}

import * as debug from "../system/debug.js";
import * as tiles from "../definitions-tiles.js";
import * as tools from "./level-tools.js";
import { Position } from "../core/concepts.js";
import { copy_data, position_from_index, random_int, random_sample } from "../system/utility.js";
import { Vector2 } from "../system/spatial.js";


const level_name = "Level 2: Random Access Memory";

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
    // test_room_2: {
    //     "name" : "Test Level 'testing' 9 x 9",
    //     "width" : 9,
    //     "height" : 9,
    //     "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,105,105,105,105,105,105,105,122,122,122,122,105,105,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    //     "entities" : []
    // },
    room_0: {
        "name" : "room 0",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_1: {
        "name" : "room 1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,103,9001,103,9001,103,9001,9001,103,9001,103,103,103,103,103,9001,103,103,9001,9001,9001,103,9001,9001,9001,103,103,103,9001,103,103,103,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,103,103,103,9001,103,103,103,9001,9001,9001,103,9001,9001,9001,103,103,9001,103,103,103,103,103,9001,103,9001,9001,103,9001,103,9001,103,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_2: {
        "name" : "room 2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_3: {
        "name" : "room 3",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,103,103,103,103,103,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_4: {
        "name" : "room 4",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_5_1: {
        "name" : "room 5-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,123,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_5_2: {
        "name" : "room 5-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9000,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6_1: {
        "name" : "room 6-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,122,122,122,103,103,103,103,103,103,122,122,122,103,103,103,103,103,103,122,122,122,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6_2: {
        "name" : "room 6-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,103,103,103,103,103,103,9001,9001,9001,103,103,103,103,103,103,9001,9001,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6_3:{
        "name" : "room 6-3",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7_1: {
        "name" : "room 7-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,103,30,30,30,30,30,30,30,103,103,103,30,30,30,30,30,103,103,103,103,103,30,30,30,30,30,103,103,103,30,30,30,30,30,30,30,103,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7_2:{
        "name" : "room 7-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,9002,9002,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,103,103,103,103,103,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,9002,9002,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7_3:{
        "name" : "room 7-3",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,9002,9002,9002,9002,9002,9002,103,103,103,103,103,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,9002,103,9002,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_8_1: {
        "name" : "room 8-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_8_2:{
        "name" : "room 8-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_8_3:{
        "name" : "room 8-3",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9003,9003,9003,9003,9001,9001,9001,9001,9001,9003,9003,9003,9003,9001,9001,9001,9001,9001,9003,9003,9003,9003,9001,9001,9001,9001,9001,9003,9003,9003,9003,9003,9003,9001,9001,9001,9001,9001,9001,9003,9003,9003,9001,9001,9001,9001,9001,9001,9003,9003,9003,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_9: {
        "name" : "room 9",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,103,9001,9001,103,103,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_10: {
        "name" : "room 10-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_10_2:{
        "name" : "room 10-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,103,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,9001,9001,9001,9001,103,103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_11: {
        "name" : "room 11",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,122,122,122,122,122,122,122,102,102,122,103,103,103,103,103,122,102,102,122,103,122,122,103,103,122,102,102,122,103,103,122,103,103,122,102,122,122,122,103,122,122,103,122,102,102,103,122,103,103,122,103,122,122,122,103,122,122,122,122,103,122,122,122,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_12_1: {
        "name" : "room 12-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,122,122,122,122,122,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_12_2:{
        "name" : "room 12-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_13: {
        "name" : "room 13",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_14: {
        "name" : "room 14",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_15_1: {
        "name" : "room 15-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,123,103,123,102,102,102,102,102,123,123,103,123,123,102,102,102,123,123,103,103,103,123,123,102,123,123,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,123,123,102,123,123,103,103,103,123,123,102,102,102,123,123,103,123,123,102,102,102,102,102,123,103,123,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_15_2: {
        "name" : "room 15",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9004,9004,9004,9001,103,9001,9004,9004,9004,9004,9004,9001,9001,103,9001,9001,9004,9004,9004,9001,9001,103,103,103,9001,9001,9004,9001,9001,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,9001,9001,9004,9001,9001,103,103,103,9001,9001,9004,9004,9004,9001,9001,103,9001,9001,9004,9004,9004,9004,9004,9001,103,9001,9004,9004,9004],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_16: {
        "name" : "room 16",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,103,103,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_17: {
        "name" : "room 17",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,9002,9002,9002,9002,9002,103,103,103,103,9002,103,103,9002,9002,103,103,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,103,103,9002,103,103,9002,103,103,9002,103,103,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,103,103,9002,9002,9002,103,103,9002,9002,103,103,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_18: {
        "name" : "room 18",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_19: {
        "name" : "room 19",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,9001,102,9001,102,9001,102,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,102,9001,102,9001,102,9001,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_20: {
        "name" : "room 20",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_21: {
        "name" : "room 21",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,102,102,102,102,102,102,102,9002,9002,102,102,102,102,102,102,102,9002,9002,102,9002,9002,9002,9002,9002,9002,9002,9002,102,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_22: {
        "name" : "room 22",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,9001,9001,9001,102,103,9001,9001,9001,9001,9001,9001,102,103,102,9001,9001,9001,9001,9001,102,103,102,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,9004,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,9001,102,103,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_23: {
        "name" : "room 23",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,9003,102,102,102,102,102,9003,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9003,102,102,102,102,102,9003,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [ ]
    },
    room_24: {
        "name" : "room 24",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,103,102,102,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,9001,103,103,103,9001,102,102,102,103,103,103,103,103,103,103,102,102,102,9001,103,103,103,9001,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,102,102,103,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_25: {
        "name" : "room 25",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_26: {
        "name" : "room 26",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9000,103,102,102,102,9003,9003,9003,103,103,103,9001,9001,9001,102,102,103,103,9004,103,103,102,102,9001,9001,9001,103,9004,103,9003,9003,9003,102,102,103,103,9004,103,103,102,102,9003,9003,9003,103,9004,103,9001,9001,9001,102,102,103,103,9004,103,103,102,102,9001,9001,9001,103,103,103,9003,9003,9003,102,102,102,103,9000,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_27: {
        "name" : "room 27",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[123,123,123,123,123,123,123,102,102,103,103,103,103,103,103,103,103,102,123,9001,9001,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,103,103,123,123,123,9001,9001,9001,9001,103,103,102,102,102,103,103,103,103,103,103,102,102,102,102,123,123,123,123,123],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_28: {
        "name" : "room 28",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,9001,102,102,102,9003,102,9003,102,102,9001,9001,103,9003,9003,103,103,102,102,102,9001,103,103,103,103,103,103,102,102,9001,103,103,103,9003,9003,102,102,103,103,103,9003,103,103,103,102,102,9001,103,103,9003,103,103,9001,9001,102,9001,9001,103,9003,9003,103,103,102,102,102,9001,103,102,9003,103,9003,102,102,102,9001,102,102,102,103,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_29: {
        "name" : "room 29",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,103,122,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,103,122,122,103,122,122,122,103,103,103,122,103,103,103,122,103,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_30: {
        "name" : "room 30",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_31: {
        "name" : "room 31",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,102,102,102,122,122,122,122,122,102,103,102,102,122,103,103,103,122,102,102,102,103,103,103,103,103,122,102,102,102,102,123,103,103,103,122,102,103,102,102,123,103,103,103,122,122,103,123,123,123,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_32: {
        "name" : "room 32",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,102,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,102,103,103,103,103,103,103,103,102,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,102,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_33: {
        "name" : "room 33",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,102,102,103,102,102,9001,9001,9001,9001,102,103,102,103,102,9001,9001,9001,9001,103,103,102,102,102,9001,9001,9001,9001,102,103,103,102,102,9001,9001,9001,9001,103,103,102,103,102,9001,9001,9001,9001,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_34: {
        "name" : "room 34",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,103,103,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_35: {
        "name" : "room 35",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,103,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,103,103,102,9001,9001,9001,9001,9001,103,103,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_36: {
        "name" : "room 36",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,103,103,103,9001,9001,9001,102,102,103,103,103,9001,9001,9001,9001,102,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,102,9001,9001,9001,9001,103,103,103,102,102,9001,9001,9001,103,103,103,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_37_1: {
        "name" : "room 37-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,103,103,9001,103,103,102,102,102,103,103,9001,9001,9001,103,103,102,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,102,103,103,9001,9001,9001,103,103,102,102,102,103,103,9001,103,103,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_37_2: {
        "name" : "room 37-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9001,9001,9001,9004,9004,9004,9000,9000,9001,9001,9001,9001,9001,9004,9004,9000,9001,9001,9001,9001,9001,9001,9001,9004,9001,9001,9001,9001,9001,9001,9001,9001,9001,9004,9001,9001,9001,9001,9001,9001,9001,9000,9004,9004,9001,9001,9001,9001,9001,9000,9000,9004,9004,9004,9001,9001,9001,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_38_1: {
        "name" : "room 38-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,103,9001,103,102,102,102,102,102,103,103,9001,103,103,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,103,103,9001,103,103,102,102,102,102,102,103,9001,103,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },

    room_38_2: {
        "name" : "room 38-2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9000,9001,9004,9004,9004,9004,9001,9001,9001,9001,9001,9001,9001,9001,9001,9004,9004,9004,9004,9001,9000,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    }

};

window.level_2_rooms = rooms;

window.level_2_procgen_test_room = {
    "name" : "Test Level 'testing' 9 x 9",
    "width" : 9,
    "height" : 9,
    "grids" : {"floor":[104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9004,9004,9004,104,104,104,104,104,104,9004,9004,9004,104,104,104,104,104,104,9004,9004,9004,104,104,104],"surface":[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : []
};
window.level_2_process_procgen_tiles = process_procgen_tiles;

function process_procgen_tiles(world_desc){
    tools.check_world_desc(world_desc);
    const converted_desc = copy_data(world_desc);
    // We convert proc-gen tiles to some choices, the choices must be the same for the whole chunk being worked on.

    const make_tile_converter = (tile_match, possible_tiles) => {
        debug.assertion(()=>Number.isInteger(tile_match) && tile_match >= 0);
        debug.assertion(()=>possible_tiles instanceof Array && possible_tiles.every(tile=> Number.isInteger(tile) && tile >= 0));

        const selected_tile = random_sample(possible_tiles);
        return (tile) => {
            return tile === tile_match ? selected_tile : tile
        };
    }

    const tile_conversions = [
        // PROCGEN_TILE_1 : Ground or Wall
        make_tile_converter(tiles.ID.PROCGEN_TILE_1, [defaults.floor_alt, defaults.wall, defaults.wall]),

        // PROCGEN_TILE_2 : Wall or Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_2, [defaults.wall, defaults.wall, defaults.wall, tiles.ID.VOID, tiles.ID.HOLE]),

        // PROCGEN_TILE_3 : Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_3, [tiles.ID.VOID, tiles.ID.HOLE]),

        // PROCGEN_TILE_4 : Void or Wall
        make_tile_converter(tiles.ID.PROCGEN_TILE_4, [tiles.ID.VOID, defaults.wall, defaults.wall]),

        // PROCGEN_TILE_5 : Ground or Wall or Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_5, [defaults.floor_alt, defaults.wall,defaults.wall,defaults.wall,defaults.wall, tiles.ID.VOID, tiles.ID.HOLE]),

    ].reduce((acc, val) => (x => val(acc(x))), x => x); // Reduced to 1 function


    converted_desc.grids.floor = converted_desc.grids.floor.map(tile => tile_conversions(tile));

    return converted_desc;
}


function* generate_room_selection(room_count){
    debug.assertion(()=>Number.isInteger(room_count) && room_count >= 0);
    const possible_rooms = Object.values(rooms);
    while(room_count > 0){
        const selected_room = random_sample(possible_rooms);
        const procgen_processed_room = process_procgen_tiles(selected_room);
        const tweaked_room = tools.random_variation(procgen_processed_room)
        yield tweaked_room;
        --room_count;
    }
}

function* generate_room_positions(horizontal_room_count, vertical_room_count){
    debug.assertion(()=>Number.isInteger(horizontal_room_count) && horizontal_room_count >= 0);
    debug.assertion(()=>Number.isInteger(vertical_room_count) && vertical_room_count >= 0);

    const room_size = { x: 9, y: 9 };


    const rules = {
        spaced_grid: function*(){
            const inter_room_space = { x: 2, y: 2 };
            for(let y = 0; y < vertical_room_count; ++y){
                for(let x = 0; x < horizontal_room_count; ++x){
                    const normal_position = new Position({x: x * (room_size.x + inter_room_space.x), y: y * (room_size.y + inter_room_space.y)})
                        .translate(inter_room_space); // top-left inter-room space.
                    yield normal_position;
                }
            }
        },
        spaced_grid_tweaked: function*(){
            const inter_room_space = { x: 2, y: 2 };
            for(let y = 0; y < vertical_room_count; ++y){
                for(let x = 0; x < horizontal_room_count; ++x){
                    const normal_position = new Position({x: x * (room_size.x + inter_room_space.x), y: y * (room_size.y + inter_room_space.y)})
                        .translate(inter_room_space); // top-left inter-room space.
                    const tweaked_position = random_int(1, 100) < 10 ? normal_position : random_sample(normal_position.adjacents_diags);
                    yield tweaked_position;
                }
            }
        },
        big_blob: function*(){
            const inter_room_space = { x: random_int(3, 5), y: random_int(3, 5) };
            for(let y = 0; y < vertical_room_count; ++y){
                for(let x = 0; x < horizontal_room_count; ++x){
                    const normal_position = new Position({x: x * room_size.x, y: y * room_size.y}).translate(inter_room_space); // top-left inter-room space.
                    yield normal_position;
                }
            }
        },
        square_2x2_blobs: function*(){
            const inter_room_space = { x: random_int(2, 3), y: random_int(2, 3) };
            const drift = { x: 0, y: 0};
            for(let y = 0; y < vertical_room_count; ++y){
                if(y > 0 && y % 2 === 0){
                    drift.y += inter_room_space.y;
                }
                drift.x = 0;
                for(let x = 0; x < horizontal_room_count; ++x){
                    if(x > 0 && x % 2 === 0){
                        drift.x += inter_room_space.x;
                    }

                    const normal_position = new Position({x: x * room_size.x, y: y * room_size.y})
                        .translate(inter_room_space)
                        .translate(drift); // top-left inter-room space.

                    yield normal_position;
                }
            }
        },
        square_3x3_blobs: function*(){
            const inter_room_space = { x: random_int(2, 3), y: random_int(2, 3) };
            const drift = { x: 0, y: 0};
            for(let y = 0; y < vertical_room_count; ++y){
                if(y > 0 && y % 3 === 0){
                    drift.y += inter_room_space.y;
                }
                drift.x = 0;
                for(let x = 0; x < horizontal_room_count; ++x){
                    if(x > 0 && x % 3 === 0){
                        drift.x += inter_room_space.x;
                    }

                    const normal_position = new Position({x: x * room_size.x, y: y * room_size.y})
                        .translate(inter_room_space)
                        .translate(drift); // top-left inter-room space.

                    yield normal_position;
                }
            }
        },
        random_grid: function*(){
            const inter_room_space = { x: 2, y: 2 };
            const room_count = vertical_room_count * horizontal_room_count;
            const virtual_grid_size = {
                width: horizontal_room_count + 1,
                height: vertical_room_count + 1,
            };
            const virtual_grid = new Array(virtual_grid_size.width * virtual_grid_size.height).fill(false);
            for(let idx = 0; idx < room_count; ++idx){
                while(true){
                    const virtual_idx = random_int(0, virtual_grid.length - 1);
                    if(virtual_grid[virtual_idx] === false){
                        virtual_grid[virtual_idx] = true;
                        const virtual_pos = position_from_index(virtual_grid_size.width, virtual_grid_size.height, virtual_idx);
                        const pos = new Vector2(virtual_pos).multiply(room_size).translate(inter_room_space);
                        yield pos;
                        break;
                    }
                }
            }
        }
    }

    const selected_generation_rule = random_sample(Object.values(rules));
    yield* selected_generation_rule();
}

// Checks that the generated world matches our requirements for a decent level.
function validate(world){
    // At least one exit is "reachable".
    // etc.


    // All tests passed.
    return true;
}

function generate_world(){

    // LEVEL 2:
    // RAM: https://trello.com/c/wQCJeRfn/75-level-2-ram
    //

    const max_attempts = 20;
    let attempts = 0;
    while(true){
        // Lesson learn from level 1: it's far better to build in layers/pass than to predetermine details and assemble later.
        // Therefore, we'll fill the world with different passes.

        // Pass 1: empty world, with the appropriate size.
        const ram_world_chunk = tools.create_chunk(16, 16, defaults);
        ram_world_chunk.name = level_name;

        // Pass 2: put some rooms in a grid, with variations, including the exit and entry
        const room_grid = { x: 7, y: 4 };
        const room_count = room_grid.x * room_grid.y;
        const room_positions_iter = generate_room_positions(room_grid.x, room_grid.y);
        const selected_rooms_iter = generate_room_selection(room_count);
        const positionned_selected_rooms = Array.from({length:room_count}, ()=> {
            return {
                position: room_positions_iter.next().value,
                world_desc: process_procgen_tiles(selected_rooms_iter.next().value)
            };
        });

        const ram_world_with_rooms = tools.merge_world_chunks(level_name, defaults,
            { position: { x:0, y: 0}, world_desc: ram_world_chunk },
            ...positionned_selected_rooms
        );

        // Pass 3: fill the inter-room corridors with walls and entities

        const world_desc = tools.random_variation(tools.add_padding_around(ram_world_with_rooms, { floor: tiles.ID.VOID }));

        // Pass 4: add entities

        const world = tools.deserialize_world(world_desc);
        world.level_id = 2;

        if(validate(world))
            return world;

        ++attempts;
        if(attempts >= max_attempts){
            console.warn(`Failed to produce a valid level after ${attempts} attempts - we will  the last generated level. ;_; `);
            return world;
        }
    }
}