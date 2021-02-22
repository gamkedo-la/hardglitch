export {
    generate_world,

    process_procgen_tiles,
}

import * as debug from "../system/debug.js";
import * as tiles from "../definitions-tiles.js";
import * as tools from "./level-tools.js";
import { Position } from "../core/concepts.js";
import { copy_data, random_int, random_sample } from "../system/utility.js";


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
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_1: {
        "name" : "room 1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,102,122,102,122,102,122,122,102,122,102,102,102,102,102,122,102,102,122,122,122,102,122,122,122,102,102,102,122,102,102,102,122,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,122,102,102,102,122,122,122,102,122,122,122,102,102,122,102,102,102,102,102,122,102,122,122,102,122,102,122,102,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_2: {
        "name" : "room 2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_3: {
        "name" : "room 3",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,102,102,102,102,102,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_4: {
        "name" : "room 4",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,102,102,122,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,122,122,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,102,102,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_5: {
        "name" : "room 5",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6: {
        "name" : "room 6",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7: {
        "name" : "room 7",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_8: {
        "name" : "room 8",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_9: {
        "name" : "room 9",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_10: {
        "name" : "room 10",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_11: {
        "name" : "room 11",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,122,122,122,122,122,122,122,102,102,122,102,102,102,102,102,122,102,102,122,102,122,122,102,102,122,102,102,122,102,102,122,102,102,122,102,122,122,122,102,122,122,102,122,102,102,102,122,102,102,122,102,122,122,122,102,122,122,122,122,102,122,122,122,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_12: {
        "name" : "room 12",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,122,122,122,122,122,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_13: {
        "name" : "room 13",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_14: {
        "name" : "room 14",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_15: {
        "name" : "room 15",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,122,102,122,102,102,102,102,102,122,122,102,122,122,102,102,102,122,122,102,102,102,122,122,102,122,122,102,102,102,102,102,122,122,102,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,122,122,102,122,122,102,102,102,122,122,102,102,102,122,122,102,122,122,102,102,102,102,102,122,102,122,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_16: {
        "name" : "room 16",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,122,102,122,102,102,102,102,102,122,122,102,122,122,102,102,102,122,122,102,102,102,122,122,102,122,122,102,102,102,102,102,122,122,102,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,122,122,102,122,122,102,102,102,122,122,102,102,102,122,122,102,122,122,102,102,102,102,102,122,102,122,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_17: {
        "name" : "room 17",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,122,122,122,122,122,102,102,102,102,122,102,102,122,122,102,102,122,122,122,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,102,102,122,102,102,122,102,102,122,102,102,122,102,102,122,102,102,122,122,122,122,122,122,122,122,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_18: {
        "name" : "room 18",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102,102,102,102,122,122,122,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_19: {
        "name" : "room 19",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102,122,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_20: {
        "name" : "room 20",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_21: {
        "name" : "room 21",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_22: {
        "name" : "room 22",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_23: {
        "name" : "room 23",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,122,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_24: {
        "name" : "room 24",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,102,122,122,102,102,102,102,122,102,102,102,122,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,122,102,102,102,102,122,122,102,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_25: {
        "name" : "room 25",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,102,122,122,102,102,102,102,122,102,102,102,122,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,122,102,102,102,102,122,122,102,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_26: {
        "name" : "room 26",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,102,102,102,102,122,122,122,102,102,102,122,122,122,102,102,102,102,122,102,102,102,102,122,122,122,102,122,102,122,122,122,102,102,102,102,122,102,102,102,102,122,122,122,102,122,102,122,122,122,102,102,102,102,122,102,102,102,102,122,122,122,102,102,102,122,122,122,102,102,102,102,122,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_27: {
        "name" : "room 27",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,102,102,102,102,102,102,102,102,102,102,102,122,122,122,102,102,102,102,122,122,102,102,102,102,102,102,102,102,102,102,102,102,122,122,122,122,122,122,102,102,102,102,102,102,102,102,102,122,122,122,122,122,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_28: {
        "name" : "room 28",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,122,102,102,102,122,102,122,102,102,122,122,102,122,122,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,122,122,102,102,102,102,102,122,102,102,102,102,102,122,102,102,122,102,102,122,122,102,122,122,102,122,122,102,102,102,102,102,122,102,102,122,102,122,102,102,102,122,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_29: {
        "name" : "room 29",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,102,122,102,102,102,122,102,102,102,122,122,102,102,102,122,102,102,102,122,122,122,122,102,122,122,102,122,122,122,102,102,102,122,102,102,102,122,102,102,102,102,122,102,102,102,122,122,102,102,102,122,102,102,102,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_30: {
        "name" : "room 30",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,122,122,122,122,102,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_31: {
        "name" : "room 31",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,102,122,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,122,102,102,102,122,102,102,102,102,122,102,102,102,122,122,102,122,122,122,102,102,102,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_32: {
        "name" : "room 32",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122,102,102,102,102,102,102,102,102,102,122,122,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,102,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_33: {
        "name" : "room 33",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_34: {
        "name" : "room 34",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_35: {
        "name" : "room 25",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_36: {
        "name" : "room 36",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,122,122,122,102,102,102,102,102,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_37: {
        "name" : "room 37",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,102,102,102,102,102,102,102,122,122,122,102,102,102,102,102,122,122,122,122,122,102,102,102,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,102,102,102,122,122,122,122,122,102,102,102,102,102,122,122,122,102,102,102,102,102,102,102,122,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_38: {
        "name" : "room 38",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,122,122,122,122,122,122,122,122,122,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },

};

window.level_2_rooms = rooms;

window.level_2_procgen_test_room = {
    "name" : "Test Level 'testing' 9 x 9",
    "width" : 9,
    "height" : 9,
    "grids" : {"floor":[104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9004,9004,9004,104,104,104,104,104,104,9004,9004,9004,104,104,104,104,104,104,9004,9004,9004,104,104,104],"surface":[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : [{"type":"GlitchyGlitchMacGlitchy","position":{"x":0,"y":0}}]
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
        make_tile_converter(tiles.ID.PROCGEN_TILE_1, [defaults.floor, defaults.wall]),

        // PROCGEN_TILE_2 : Wall or Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_2, [defaults.wall, tiles.ID.VOID, tiles.ID.HOLE]),

        // PROCGEN_TILE_3 : Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_3, [tiles.ID.VOID, tiles.ID.HOLE]),

        // PROCGEN_TILE_4 : Ground or Void
        make_tile_converter(tiles.ID.PROCGEN_TILE_4, [tiles.ID.VOID, defaults.floor]),

    ].reduce((acc, val) => (x => val(acc(x))), x => x); // Reduced to 1 function


    converted_desc.grids.floor = world_desc.grids.floor.map(tile => tile_conversions(tile));

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

    const world_desc = tools.add_padding_around(ram_world_with_rooms, { floor: tiles.ID.VOID });// tools.random_variation(ram_world_with_rooms);
    const world = tools.deserialize_world(world_desc);

    return world;
}