export {
    generate_world,

    process_procgen_tiles,
}

import * as debug from "../system/debug.js";
import * as tiles from "../definitions-tiles.js";
import * as tools from "./level-tools.js";
import { all_entity_types } from "../definitions-world.js";
import { Position, World } from "../core/concepts.js";
import { copy_data, position_from_index, random_int, random_sample } from "../system/utility.js";
import { Vector2 } from "../system/spatial.js";
import { all_characters_types } from "../deflinitions-characters.js";
import { crypto_names } from "../definitions-items.js";


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
    // room_0: {
    //     "name" : "room 0",
    //     "level_id": null,
    //     "width" : 9,
    //     "height" : 9,
    //     "grids" : {"floor":[9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    //     "entities" : []
    // },
    room_1: {
        "name" : "room 1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,103,9001,103,9001,103,9001,9001,103,9001,103,103,103,103,103,9001,103,103,9001,9001,9001,103,9001,9001,9001,103,103,103,9001,103,103,103,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,103,103,103,9001,103,103,103,9001,9001,9001,103,9001,9001,9001,103,103,9001,103,103,103,103,103,9001,103,9001,9001,103,9001,103,9001,103,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,9101,9101,9101,null,null,null,null,null,null,null,null,null,null,null,null,null,9101,null,null,null,null,null,9101,null,null,9101,null,null,9105,null,null,9101,null,null,9101,null,9118,null,null,null,9101,null,null,null,null,null,null,null,null,null,null,null,null,null,9101,9101,9101,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_2_1: {
        "name" : "room 2-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,9103,null,null,null,null,null,null,null,null,null,null,null,null,9103,null,null,9101,9102,null,null,9103,null,null,null,null,9102,9101,null,null,null,null,9103,null,null,9101,9102,null,null,null,null,9103,null,null,null,null,null,null,9103,null,null,null,null,null,null,null,null,null,null,9118,9107,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_2_2: {
        "name" : "room 2-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,9106,null,null,null,null,null,9110,null,null,null,null,null,9116,9106,9116,null,null,9120,null,9116,9116,9116,9116,9116,9106,null,9120,null,9116,9116,9106,9116,9106,null,null,9120,null,9116,9116,9116,9106,9116,null,null,null,null,null,null,9116,9116,9116,null,null,null,9106,null,null,null,9106,null,9110,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_3_1: {
        "name" : "room 3-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,103,103,103,103,103,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,9100,null,null,null,null,null,null,null,9100,9100,null,null,null,null,9118,null,null,9100,9100,null,9104,null,9104,null,null,null,9100,9100,null,null,null,null,9104,null,null,9100,9100,9100,null,null,null,null,null,null,9100,9100,9100,9100,null,null,null,null,null,null,9100,9100,9100,9100,9100,9100,9100,null,null,null,9100,9100,9100,9100,9100,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_3_2: {
        "name" : "room 3-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,103,103,103,103,103,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,9100,9100,null,9108,null,null,null,null,null,9100,9100,null,null,9103,9103,null,null,9101,9100,9100,9100,null,9103,9103,9109,null,9101,null,9100,9100,9100,null,null,null,null,9101,9104,null,9100,9100,9100,9100,9100,null,9101,null,9104,null,9100,9100,9100,9100,null,null,9103,null,null,null,null,null,null,null,null,null,9101,9101,9101,9101,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_3_3: {
        "name" : "room 3-3",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,103,103,103,103,103,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,9100,9100,null,null,9118,null,null,null,null,9100,null,null,9118,9118,null,null,9103,null,9100,null,null,null,null,null,9103,null,9100,9100,null,9105,null,9100,null,null,9100,9100,null,null,null,null,9100,null,null,9100,null,9100,9100,9100,9100,9100,null,null,9100,9100,9100,null,null,null,null,null,null,null,null,null,9103,9103,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_4_1: {
        "name" : "room 4-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9114,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_4_2: {
        "name" : "room 4-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9100,9100,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9100,null,9105,null,null,9100,null,null,null,9100,9118,null,null,null,9100,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9100,9100,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_5_1: {
        "name" : "room 5-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,123,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9104,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_5_2: {
        "name" : "room 5-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9000,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004,9004],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9100,9100,9100,9100,9100,null,null,null,null,9100,9118,9116,9104,9100,null,null,null,null,9100,9101,null,9101,9100,null,null,null,null,9100,9118,9116,9105,9100,null,null,null,null,9100,9100,9100,9100,9100,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6_1: {
        "name" : "room 6-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,122,122,122,103,103,103,103,103,103,122,122,122,103,103,103,103,103,103,122,122,122,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9103,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6_2: {
        "name" : "room 6-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,103,103,103,103,103,103,9001,9001,9001,103,103,103,103,103,103,9001,9001,9001,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9100,null,null,9100,9100,null,null,null,9100,9100,null,null,9100,null,9104,null,9118,null,9100,null,null,null,9100,9100,null,9104,9100,9100,null,null,9100,9100,null,9100,9100,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_6_3: {
        "name" : "room 6-3",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9115,null,null,null,null,9116,null,null,null,null,null,null,null,9116,9116,9116,9116,null,null,null,9116,9116,9116,9116,9116,9116,null,null,null,9116,9116,9116,9116,9116,9116,null,null,null,9116,9116,9116,9116,null,null,null,null,null,null,null,9116,null,null,null,null,9115,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7_1: {
        "name" : "room 7-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,103,30,30,30,30,30,30,30,103,103,103,30,30,30,30,30,103,103,103,103,103,30,30,30,30,30,103,103,103,30,30,30,30,30,30,30,103,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7_2: {
        "name" : "room 7-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,9002,9002,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,103,103,103,103,103,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,9002,9002,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_7_3: {
        "name" : "room 7-3",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,9002,9002,9002,9002,9002,9002,103,103,103,103,103,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,9002,103,103,103,9002,9002,9002,9002,9002,9002,103,9002,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9118,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_8_1: {
        "name" : "room 8-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,102,102,102,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,102,102,102,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9115,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_8_2: {
        "name" : "room 8-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9115,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
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
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,103,9001,9001,103,103,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9103,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_10_1: {
        "name" : "room 10-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,102,102,102,102,102,122,122,122,122,122,102,102,102,102,122,122,122,122,122,122,122,102,102,122,122,122,122,122,122,122,122,102,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,9116,9116,9116,null,null,null,null,null,null,9116,null,9116,9116,null,null,null,null,null,null,null,null,9116,9116,9116,null,null,null,9104,null,null,null,9116,9116,null,null,null,null,9104,9104,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_10_2: {
        "name" : "room 10-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,9001,103,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,9001,9001,9001,9001,103,103,103,103,103,9001,9001,9001,9001,9001,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,9116,9116,9116,null,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,null,null,null,9116,9116,9116,null,null,null,9104,9104,null,null,9116,9116,null,null,null,null,9104,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_11: {
        "name" : "room 11",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,122,122,122,122,122,122,122,102,102,122,103,103,103,103,103,122,102,102,122,103,122,122,103,103,122,102,102,122,103,103,122,103,103,122,102,122,122,122,103,122,122,103,122,102,102,103,122,103,103,122,103,122,122,122,103,122,122,122,122,103,122,122,122,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9105,null,null,null,null,null,9114,null,null,null,null,null,null,null,null,null,9116,null,null,9116,null,null,9111,null,null,9116,9110,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9104,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_12_1: {
        "name" : "room 12-1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,122,122,122,122,122,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122,122,102,102,122,122,102,102,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_12_2: {
        "name" : "room 12-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001,9001,9004,9004,9001,9001,9004,9004,9001,9001],"surface":[null,null,9116,9116,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9115,9115,null,null,9118,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9118,9105,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,9116,9116,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_13: {
        "name" : "room 13",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,9115,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_14_1: {
        "name" : "room 14-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9115,9116,null,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_14_2: {
        "name" : "room 14-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,9001,9001,9001,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,9116,9116,9116,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,9106,9106,9118,9116,null,9116,null,null,null,9106,9106,9106,null,9116,9116,null,null,null,9118,9106,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_15_1: {
        "name" : "room 15-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,123,103,123,102,102,102,102,102,123,123,103,123,123,102,102,102,123,123,103,103,103,123,123,102,123,123,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,123,123,102,123,123,103,103,103,123,123,102,102,102,123,123,103,123,123,102,102,102,102,102,123,103,123,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,9114,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_15_2: {
        "name" : "room 15",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9004,9004,9004,9001,103,9001,9004,9004,9004,9004,9004,9001,9001,103,9001,9001,9004,9004,9004,9001,9001,103,103,103,9001,9001,9004,9001,9001,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,9001,9001,9004,9001,9001,103,103,103,9001,9001,9004,9004,9004,9001,9001,103,9001,9001,9004,9004,9004,9004,9004,9001,103,9001,9004,9004,9004],"surface":[null,null,null,null,9116,null,null,9116,9116,null,null,null,null,9116,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,9105,null,null,9116,9116,null,null,9110,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,9114,9114,null,null,9116,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_16_1: {
        "name" : "room 16-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,103,103,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,9001,9001,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,9116,null,null,9116,null,null,9116,null,9116,null,null,null,9116,null,null,null,null,null,9104,9104,null,null,null,9116,null,null,9104,null,null,null,9104,null,null,9116,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9103,null,9103,null,null,9107,null,null,null,null,null,9103,null,9103,9118,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_16_2: {
        "name" : "room 16-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,122,103,103,122,122,122,122,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,9116,null,null,null,9116,null,9116,null,null,9103,null,9116,null,9116,9116,9116,null,9116,9116,null,9103,null,9103,9116,null,9116,null,9116,9116,9116,9116,null,null,null,null,null,null,9111,9111,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,9116,null,null,9105,null,9110,null,null,null,null,null,9105,null,null,9118,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_17: {
        "name" : "room 17",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,103,9002,9002,9002,9002,9002,103,103,103,103,9002,103,103,9002,9002,103,103,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,103,103,9002,103,103,9002,103,103,9002,103,103,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,103,103,9002,9002,9002,103,103,9002,9002,103,103,9002],"surface":[null,9116,null,null,null,null,null,9116,null,null,9116,null,9116,null,null,null,null,9116,null,null,null,9116,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9117,null,9117,9116,null,null,9116,null,null,9116,null,9116,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,9116,9116,null,null,null,null,9116,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_18_1: {
        "name" : "room 18-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,9116,null,null,null,9116,9116,null,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,null,9116,9116,null,null,null,9116,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_18_2: {
        "name" : "room 18-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102,102,102,102,9001,9001,9001,102,102,102],"surface":[9116,9116,null,null,null,null,null,9116,9116,9116,null,9116,null,null,null,9116,null,9116,null,9116,9116,null,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9110,null,null,null,null,null,null,null,null,9105,null,null,null,null,null,9116,9116,null,null,null,9116,9116,null,9116,null,9116,null,null,null,9116,null,9116,9116,9116,null,null,null,null,null,9116,9116],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_19: {
        "name" : "room 19",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,9001,102,9001,102,9001,102,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,102,9001,103,9001,103,9001,103,9001,103,9001,102,9001,102,9001,102,9001,102,9001,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9115,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9114,null,null,null,null,null,9114,null,null,null,null,null,null,null,null,null,null,null,9118,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_20_1: {
        "name" : "room 20-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_20_2: {
        "name" : "room 20-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102,9001,9001,9001,9001,9001,102,102,102,102],"surface":[9101,9101,9101,9101,null,null,null,null,null,9101,9101,9101,9101,null,null,null,null,null,9101,null,null,null,null,null,null,null,null,9101,null,null,9110,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9110,null,null,9101,null,null,null,null,null,null,null,null,9101,null,null,null,null,null,9101,9101,9101,9101,null,null,null,null,null,9101,9101,9101,9101],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"AntiVirus","position":{"x":4,"y":4}}]
    },
    room_21_1: {
        "name" : "room 21-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,102,102,102,102,102,102,102,9002,9002,102,102,102,102,102,102,102,9002,9002,102,9002,9002,9002,9002,9002,9002,9002,9002,102,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_21_2: {
        "name" : "room 21-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9002,9002,102,102,102,102,102,102,102,9002,9002,102,102,102,102,102,102,102,9002,9002,102,9002,9002,9002,9002,9002,9002,9002,9002,102,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,103,103,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002,9002],"surface":[null,null,9116,9116,9116,9104,9104,null,null,null,null,9116,null,9116,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,9105,9110,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_22: {
        "name" : "room 22",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,9001,9001,9001,102,103,9001,9001,9001,9001,9001,9001,102,103,102,9001,9001,9001,9001,9001,102,103,102,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,9004,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,9001,102,103,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,9114,9116,9116,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,9116,null,9116,null,null,null,null,null,9114,9116,9116,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_23_1: {
        "name" : "room 23-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,9003,102,102,102,102,102,9003,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9003,102,102,102,102,102,9003,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9114,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_23_2: {
        "name" : "room 23-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,9003,102,102,102,102,102,9003,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9003,102,102,102,102,102,9003,102,102,102,102,102,102,102,102,102,102],"surface":[9116,9116,9116,9116,9116,9116,9116,9116,9116,9116,null,9101,9101,9101,9101,9101,null,9116,9116,9101,9105,null,null,null,null,9101,9116,9116,9101,null,null,null,null,null,9101,9116,9116,9101,null,null,9110,null,null,9101,9116,9116,9101,null,null,null,null,null,9101,9116,9116,9101,null,null,null,null,null,9101,9116,9116,null,9116,9116,9116,9116,9116,null,9116,9116,9116,9116,9116,9116,9116,9116,9116,9116],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_24_1: {
        "name" : "room 24-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,103,102,102,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,9001,103,103,103,9001,102,102,102,103,103,103,103,103,103,103,102,102,102,9001,103,103,103,9001,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,102,102,103,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,9114,null,9116,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_24_2: {
        "name" : "room 24-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,103,102,102,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,9001,103,103,103,9001,102,102,102,103,103,103,103,103,103,103,102,102,102,9001,103,103,103,9001,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,102,102,103,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,9101,9101,9101,9101,9101,9101,9101,null,null,9101,null,null,9101,null,null,9101,null,null,9101,null,null,null,null,null,9101,null,null,9101,9101,null,9110,null,9101,9101,null,null,9101,null,9105,null,null,null,9101,null,null,9101,null,null,9101,null,null,9101,null,null,9101,9101,9101,9101,9101,9101,9101,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_24_3: {
        "name" : "room 24-3",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,102,102,102,103,102,102,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,9001,103,103,103,9001,102,102,102,103,103,103,103,103,103,103,102,102,102,9001,103,103,103,9001,102,102,102,102,9001,9001,103,9001,9001,102,102,102,102,102,102,103,102,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,53,53,53,null,53,53,50,null,null,51,null,null,9111,null,null,50,null,null,51,null,9110,null,null,null,50,null,null,null,9111,null,9105,null,9111,null,null,null,51,null,null,null,null,null,50,null,null,51,null,null,9111,null,null,50,null,null,51,52,52,null,52,52,52,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_25_1: {
        "name" : "room 25-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,9116,9116,null,null,null,null,null,9116,9116,9116,9116,null,null,null,null,null,null,null,null,null,9116,null,null,9116,9116,9104,9104,null,null,9116,null,9116,9116,9116,null,null,9116,9116,9116,null,9116,9116,9116,9116,null,9116,9116,null,null,null,9116,9116,null,null,9116,9116,null,null,null,null,null,9116,9116,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_25_2: {
        "name" : "room 25-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,102,102,9001,9001,9001,9001,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,9001,9001,102,102,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9101,9101,9101,9101,null,null,null,null,null,null,null,null,9101,null,null,null,null,null,9106,9106,null,null,null,null,9101,null,9106,9118,9106,null,null,null,null,9101,null,9106,9106,9106,null,9101,null,null,9101,null,null,null,null,null,9101,null,null,9101,9101,9101,null,null,9101,9101,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_26: {
        "name" : "room 26",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9000,103,102,102,102,9003,9003,9003,103,103,103,9001,9001,9001,102,102,103,103,9004,103,103,102,102,9001,9001,9001,103,9004,103,9003,9003,9003,102,102,103,103,9004,103,103,102,102,9003,9003,9003,103,9004,103,9001,9001,9001,102,102,103,103,9004,103,103,102,102,9001,9001,9001,103,103,103,9003,9003,9003,102,102,102,103,9000,102,102,102,102],"surface":[null,null,9101,9101,null,9101,9101,null,null,null,null,null,null,null,null,null,null,null,9116,9117,null,null,null,null,null,9117,9116,null,null,null,9115,null,9115,null,null,null,9116,9117,null,null,null,null,null,9117,9116,null,null,null,9115,null,9115,null,null,null,9116,9117,null,null,null,null,null,9117,9116,null,null,null,null,null,null,null,null,null,null,null,9101,9101,null,9101,9101,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_27: {
        "name" : "room 27",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[123,123,123,123,123,123,123,102,102,103,103,103,103,103,103,103,103,102,123,9001,9001,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,103,103,123,123,123,9001,9001,9001,9001,103,103,102,102,102,103,103,103,103,103,103,102,102,102,102,123,123,123,123,123],"surface":[null,null,null,null,null,null,null,9116,9116,9116,null,9114,null,null,null,null,null,9116,null,null,null,9116,null,null,null,null,null,9116,null,null,9116,null,null,9115,null,9116,9116,null,9115,null,null,null,null,null,null,null,null,null,null,null,null,9115,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,null,null,9115,null,null,9116,9116,9116,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_28: {
        "name" : "room 28",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,9001,102,102,102,9003,102,9003,102,102,9001,9001,103,9003,9003,103,103,102,102,102,9001,103,103,103,103,103,103,102,102,9001,103,103,103,9003,9003,102,102,103,103,103,9003,103,103,103,102,102,9001,103,103,9003,103,103,9001,9001,102,9001,9001,103,9003,9003,103,103,102,102,102,9001,103,102,9003,103,9003,102,102,102,9001,102,102,102,103,102,102],"surface":[null,null,null,9116,null,null,null,null,null,null,null,null,9116,null,null,9116,9116,9116,null,null,null,null,null,null,null,9116,9116,null,9116,null,null,9115,null,null,null,null,null,9116,null,9115,null,null,null,9116,9116,null,null,null,null,null,9117,null,null,null,null,null,null,null,null,null,null,9116,9116,null,null,null,9116,9116,null,9116,null,null,null,null,null,null,null,null,9116,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_29_1: {
        "name" : "room 29-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,103,122,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,103,122,122,103,122,122,122,103,103,103,122,103,103,103,122,103,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9120,null,null,null,9111,null,9104,9104,null,null,null,9105,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9120,null,null,9120,null,null,null,null,null,null,null,null,null,null,null,9111,null,9104,null,null,null,9110,null,null,null,null,null,null,null,null,9104,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_29_2: {
        "name" : "room 29-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,103,122,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,103,122,122,103,122,122,122,103,103,103,122,103,103,103,122,103,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,9101,9101,9101,9101,9101,null,9114,9114,null,null,9101,9101,9101,null,null,null,null,null,null,9101,9101,9101,null,null,null,null,9120,null,null,9101,null,null,null,null,null,null,null,null,null,null,null,9111,null,9114,null,null,null,9110,null,null,null,null,9114,null,null,null,9105,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_29_3: {
        "name" : "room 29-3",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,103,122,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,103,122,122,103,122,122,122,103,103,103,122,30,30,30,122,103,103,103,103,122,103,103,103,122,122,103,103,103,122,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9120,null,9105,null,null,null,53,53,53,null,null,null,null,52,null,51,53,50,null,null,null,null,52,null,null,53,null,null,null,null,null,52,null,null,null,null,null,9120,null,null,null,null,null,null,null,null,null,null,null,null,null,9110,9110,9104,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_30: {
        "name" : "room 30",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,103,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,9110,null,9116,9116,null,9105,null,null,null,9109,null,9116,9105,9105,null,9116,null,null,9110,9116,9116,9116,null,9116,null,null,null,null,null,null,null,null,null,9120,null,null,null,9106,null,null,9106,null,null,null,null,null,null,9106,null,null,9106,null,null,9111,9106,null,9106,null,9106,null,9106,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_31_1: {
        "name" : "room 31-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,102,102,102,122,122,122,122,122,102,103,102,102,122,103,103,103,122,102,102,102,103,103,103,103,103,122,102,102,102,102,123,103,103,103,122,102,103,102,102,123,103,103,103,122,122,103,123,123,123,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[9116,9116,9115,null,null,null,null,null,null,9116,9120,9116,null,null,null,null,9110,null,9116,null,9116,9120,9120,9116,null,null,null,9115,9116,9116,null,null,9116,9104,null,null,null,9120,null,null,null,null,9104,null,null,null,9120,null,null,null,9116,null,9104,null,null,9116,9103,null,9103,9116,9110,null,null,null,null,9103,9103,null,9116,null,9116,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_31_2: {
        "name" : "room 31-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[103,102,102,102,122,122,122,122,122,102,103,102,102,122,103,103,103,122,102,102,102,103,103,103,103,103,122,102,102,102,102,123,103,103,103,122,102,103,102,102,123,103,103,103,122,122,103,123,123,123,103,103,103,122,122,103,103,103,103,103,103,103,122,122,103,103,103,103,103,103,103,122,122,122,122,122,122,122,122,122,122],"surface":[null,null,9116,9116,null,null,null,null,null,null,9116,9116,9116,null,null,null,null,null,9116,9116,9116,9116,9111,null,9106,null,null,9116,9116,9116,9116,null,null,null,9106,null,9116,9116,9116,9116,null,null,9106,null,null,null,9111,null,null,null,null,null,9110,null,null,null,null,9106,null,9106,null,9106,null,null,null,9106,9106,9106,null,9106,9110,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_32: {
        "name" : "room 32",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,9001,9001,102,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,102,103,103,103,103,103,103,103,102,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,102,9001,9001,9001,9001],"surface":[null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,9117,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_33: {
        "name" : "room 33",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9001,9001,102,102,103,102,102,9001,9001,9001,9001,102,103,102,103,102,9001,9001,9001,9001,103,103,102,102,102,9001,9001,9001,9001,102,103,103,102,102,9001,9001,9001,9001,103,103,102,103,102,9001,9001,9001,9001,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001],"surface":[null,null,9116,9116,9116,9116,9116,null,null,null,null,9116,9114,9116,9116,9116,null,null,null,null,9116,9116,9116,9116,9116,null,null,null,null,null,9114,null,null,null,null,null,null,null,null,null,null,9114,9114,null,null,null,null,9110,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_34_1: {
        "name" : "room 34-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,103,103,102,102,102,102,102,102,102,102,102],"surface":[53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,53,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,52,52,52,52,52,52,52,52,52,52,52,52,52,52,52,52,52,52],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_34_2: {
        "name" : "room 34-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,103,103,103,103,103,103,103,103,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,103,103,103,103,103,103,103,103,102,102,102,102,102,102,102,102,102],"surface":[9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113,9113],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_35: {
        "name" : "room 35",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,103,103,9001,9001,9001,9001,9001,102,103,103,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,103,103,9001,9001,9001,9001,9001,9001,103,103,102,9001,9001,9001,9001,9001,103,103,102,102],"surface":[null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,null,9113,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9113,null,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,9114],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_36_1: {
        "name" : "room 36-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,103,103,103,9001,9001,9001,102,102,103,103,103,9001,9001,9001,9001,102,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,102,9001,9001,9001,9001,103,103,103,102,102,9001,9001,9001,103,103,103,102,102,102],"surface":[null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,9113,9113,9113,null,null,null,null,null,9113,9113,9113,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null,null,null,9113,9113,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_36_2: {
        "name" : "room 36-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,103,103,103,9001,9001,9001,102,102,103,103,103,9001,9001,9001,9001,102,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,103,102,9001,9001,9001,9001,103,103,103,102,102,9001,9001,9001,103,103,103,102,102,102],"surface":[9116,9116,9116,9116,9113,9113,null,null,null,9116,9116,9116,9113,9113,null,null,null,null,9116,9116,9113,9113,null,null,null,null,null,9116,9113,9113,null,null,null,null,null,9113,9113,9113,null,null,null,null,null,9113,9116,9113,null,null,null,null,null,9113,9116,9116,null,null,null,null,null,9113,9116,9114,9116,null,null,null,null,9113,9116,9114,9114,9116,null,null,null,9113,9116,9114,9116,9116,9116],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_37_1: {
        "name" : "room 37-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,103,103,9001,103,103,102,102,102,103,103,9001,9001,9001,103,103,102,103,103,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,9001,9001,103,9001,9001,9001,9001,9001,9001,9001,103,103,103,9001,9001,9001,9001,9001,103,103,102,103,103,9001,9001,9001,103,103,102,102,102,103,103,9001,103,103,102,102],"surface":[9116,null,9116,null,null,null,null,null,null,9116,9116,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,null,null,null,null,null,null,null,9116,9116,9117,null,null,null,null,null,9116,9116,9116,9116,9117,null,null,null,9116,9116,9116,9116,9116,9116,9116,null,9116,9116,9116,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_37_2: {
        "name" : "room 37-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9001,9001,9001,9004,9004,9004,9000,9000,9001,9001,9001,9001,9001,9004,9004,9000,9001,9001,9001,9001,9001,9001,9001,9004,9001,9001,9001,9001,9001,9001,9001,9001,9001,9004,9001,9001,9001,9001,9001,9001,9001,9000,9004,9004,9001,9001,9001,9001,9001,9000,9000,9004,9004,9004,9001,9001,9001,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000],"surface":[null,null,9113,9113,null,9113,9113,null,null,null,9113,9113,null,null,null,9113,9113,null,9113,9113,null,null,null,null,null,9113,9113,9113,null,null,null,null,null,null,null,9113,null,null,null,null,null,null,null,null,null,9113,null,null,null,null,null,null,null,9113,9113,9113,null,null,null,null,null,9113,9113,null,9113,9113,null,null,null,9113,9113,null,null,null,9113,9113,null,9113,9113,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_38_1: {
        "name" : "room 38-1",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,103,9001,103,102,102,102,102,102,103,103,9001,103,103,102,102,9001,9001,9001,9001,9001,9001,9001,9001,9001,102,102,103,103,9001,103,103,102,102,102,102,102,103,9001,103,102,102,102,102,102,102,102,9001,102,102,102,102,102,102,102,102,9001,102,102,102,102],"surface":[null,null,null,null,null,9113,null,null,null,null,null,null,null,null,9113,9113,9113,null,null,null,null,9113,null,null,9113,9113,null,null,null,9113,9113,null,9107,null,9113,9113,null,null,null,null,null,null,null,null,null,9116,9116,null,9110,null,9113,9113,null,null,9116,9104,9104,null,null,9113,null,null,null,9116,9116,9116,9104,null,null,null,null,null,9116,9116,9116,9116,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    },
    room_38_2: {
        "name" : "room 38-2",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9000,9001,9004,9004,9004,9004,9000,9000,9000,9000,9001,9004,9004,9004,9004,9001,9001,9001,9001,9001,9001,9001,9001,9001,9004,9004,9004,9004,9001,9000,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000,9004,9004,9004,9004,9001,9000,9000,9000,9000],"surface":[null,null,null,9113,null,9113,null,null,null,null,null,null,9113,null,9113,null,null,null,null,null,null,9113,null,9113,null,null,null,9113,9113,9113,9113,null,9113,9113,9113,9113,null,null,null,null,null,null,null,null,null,9113,9113,9113,9113,null,9113,9113,9113,9113,null,null,null,9113,null,9113,null,null,null,null,null,null,9113,null,9113,null,null,null,null,null,null,9113,null,9113,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    }

};

const starting_rooms = {
    block_master: {
        is_start: true,
        "name" : "Level 2 Starting Room 0",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,102,122,122,122,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,102,102,102,122,102,102,102,122,102,102,102,122,122,122,102,102,102,122,102,102,102,122,102,102,102,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,102,102,122,122,122,122,122,102,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"Program","position":{"x":6,"y":3}},{"type":"Item_BlockMaster","position":{"x":1,"y":6}},{"type":"MovableWall_Blue","position":{"x":4,"y":0}},{"type":"MovableWall_Green","position":{"x":0,"y":4}},{"type":"MovableWall_Purple","position":{"x":4,"y":8}},{"type":"MovableWall_Orange","position":{"x":8,"y":4}}]
    },

    critical_section: {
        is_start: true,
        "name" : "Level 2 Starting Room 1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,122,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,102,122,102,102,102,102,102,122,102,102,102,102,102,102,102,102,102,102],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"Program","position":{"x":4,"y":5}},{"type":"MovableWall_Blue","position":{"x":2,"y":1}},{"type":"MovableWall_Blue","position":{"x":1,"y":2}},{"type":"MovableWall_Blue","position":{"x":3,"y":2}},{"type":"MovableWall_Blue","position":{"x":4,"y":1}},{"type":"MovableWall_Blue","position":{"x":5,"y":2}},{"type":"MovableWall_Blue","position":{"x":6,"y":3}},{"type":"MovableWall_Blue","position":{"x":6,"y":4}},{"type":"MovableWall_Blue","position":{"x":6,"y":5}},{"type":"MovableWall_Blue","position":{"x":6,"y":6}},{"type":"MovableWall_Blue","position":{"x":6,"y":7}},{"type":"MovableWall_Blue","position":{"x":7,"y":5}},{"type":"MovableWall_Blue","position":{"x":5,"y":8}},{"type":"MovableWall_Blue","position":{"x":4,"y":7}},{"type":"MovableWall_Blue","position":{"x":3,"y":7}},{"type":"MovableWall_Blue","position":{"x":5,"y":7}},{"type":"MovableWall_Blue","position":{"x":3,"y":6}},{"type":"MovableWall_Blue","position":{"x":3,"y":5}},{"type":"MovableWall_Blue","position":{"x":2,"y":5}},{"type":"MovableWall_Blue","position":{"x":3,"y":4}},{"type":"MovableWall_Blue","position":{"x":1,"y":4}},{"type":"MovableWall_Blue","position":{"x":1,"y":3}},{"type":"MovableWall_Blue","position":{"x":0,"y":4}},{"type":"MovableWall_Blue","position":{"x":7,"y":2}},{"type":"Item_CriticalSection","position":{"x":2,"y":4}}]
    },

    jump: {
        is_start: true,
        "name" : "Level 2 Starting Room 2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,102,122,122,102,102,102,102,102,30,30,122,122,102,102,102,102,102,122,102,102,122,102,102,122,122,122,122,102,102,122,102,102,102,122,102,102,102,102,122,122,102,30,122,102,102,102,122,122,102,102,30,102,102,102,102,122,122,122,122,102,102,102,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"Program","position":{"x":3,"y":3}},{"type":"Item_Jump","position":{"x":1,"y":7}}]
    },

    crypto: {
        is_start: true,
        "name" : "Level 2 Starting Room 3",
        "level_id": null,
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[122,122,122,122,122,122,122,122,122,122,102,102,102,102,102,102,30,122,122,102,30,102,102,102,102,30,122,122,30,102,102,102,122,122,102,122,102,30,30,102,102,102,102,102,102,122,30,122,102,102,102,102,102,122,122,102,102,102,30,102,102,102,122,122,102,102,30,30,30,102,102,122,122,122,122,122,102,122,122,122,122],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9110,null,null,null,null,null,null,null,null,null,null,9109,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"Program","position":{"x":6,"y":1}},{"type":"GlitchyGlitchMacGlitchy","position":{"x":5,"y":1}},{"type":"MovableWall_Red","position":{"x":0,"y":4}},{"type":"MovableWall_Orange","position":{"x":4,"y":8}}]
    }

};


const exit_rooms = {
    dummy: {
        "name" : "Dummy Exit Room",
        "level_id": null,
        "width" : 27,
        "height" : 12,
        "grids" : {"floor":[123,123,123,123,103,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,103,103,123,103,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,103,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123,123],"surface":[null,null,null,null,9111,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9105,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9120,null,9120,null,9120,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : []
    }
};


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
        make_tile_converter(tiles.ID.PROCGEN_TILE_2, [defaults.wall, tiles.ID.VOID, tiles.ID.HOLE]),

        // PROCGEN_TILE_3 : Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_3, [tiles.ID.VOID, tiles.ID.HOLE]),

        // PROCGEN_TILE_4 : Void or Wall
        make_tile_converter(tiles.ID.PROCGEN_TILE_4, [tiles.ID.VOID, defaults.wall, defaults.wall]),

        // PROCGEN_TILE_5 : Ground or Wall or Void or Hole
        make_tile_converter(tiles.ID.PROCGEN_TILE_5, [defaults.floor_alt, defaults.floor_alt, defaults.floor_alt, defaults.floor_alt, defaults.floor_alt, defaults.wall, tiles.ID.VOID, tiles.ID.HOLE]),

    ].reduce((acc, val) => (x => val(acc(x))), x => x); // Reduced to 1 function


    converted_desc.grids.floor = converted_desc.grids.floor.map(tile_conversions);

    return converted_desc;
}


function* generate_room_selection(room_count){
    debug.assertion(()=>Number.isInteger(room_count) && room_count >= 0);
    const possible_rooms = [ ...Object.values(rooms), ...Object.values(starting_rooms) ];;
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

    class InterRoomRandom
    {
        constructor(min, max){
            this.min = min;
            this.max = max;
        }
        get x(){ return random_int(this.min, this.max); }
        get y(){ return random_int(this.min, this.max); }

    };

    const rules = {
        spaced_grid: function*(){
            const inter_room_space = new InterRoomRandom(1, 2);
            for(let y = 0; y < vertical_room_count; ++y){
                for(let x = 0; x < horizontal_room_count; ++x){
                    const normal_position = new Position({x: x * (room_size.x + inter_room_space.x), y: y * (room_size.y + inter_room_space.y)})
                        .translate(inter_room_space); // top-left inter-room space.
                    yield normal_position;
                }
            }
        },
        spaced_grid_tweaked: function*(){
            const inter_room_space = new InterRoomRandom(1, 2);
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
            const inter_room_space = new InterRoomRandom(0, 1);
            for(let y = 0; y < vertical_room_count; ++y){
                for(let x = 0; x < horizontal_room_count; ++x){
                    const normal_position = new Position({x: x * room_size.x, y: y * room_size.y}).translate(inter_room_space); // top-left inter-room space.
                    yield normal_position;
                }
            }
        },
        square_2x2_blobs: function*(){
            const inter_room_space = new InterRoomRandom(0, 1);
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
            const inter_room_space = new InterRoomRandom(0, 1);
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
            const inter_room_space = new InterRoomRandom(0, 2);
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
                        const pos = new Position(new Vector2(virtual_pos).multiply(room_size).translate(inter_room_space));
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

function as_entity(entity_type_name){
    debug.assertion(()=> typeof entity_type_name === 'string' || entity_type_name == null);
    debug.assertion(()=> entity_type_name != "GlitchyGlitchMacGlitchy");
    if(entity_type_name == null){
        return null;
    }
    return {
        type: entity_type_name,
    };
}

function make_random_entity_gen_from(possible_type_names){
    debug.assertion(()=> possible_type_names instanceof Array);
    debug.assertion(()=> possible_type_names.every(name => (typeof name === 'string' && name.length > 1) || name == null) );
    return ()=> as_entity(random_sample(possible_type_names));
}


function populate_entities(room_info, exit_crypto_kind, is_exit=false){
    debug.assertion(()=> room_info instanceof Object);
    debug.assertion(()=> room_info.world_desc instanceof Object);
    debug.assertion(()=> room_info.position instanceof Position);
    debug.assertion(()=> Object.values(crypto_names).includes(exit_crypto_kind));
    debug.assertion(()=> typeof is_exit === 'boolean');


    const any_valid_entity = Object.keys(all_entity_types()).filter(type_name => !type_name.startsWith("Debug_") && type_name != "GlitchyGlitchMacGlitchy");
    const any_opaque_block = [ "MovableWall_Blue", "MovableWall_Green", "MovableWall_Orange", "MovableWall_Purple", "MovableWall_Red" ];
    const any_transparent_block = [ "MovableWall_Glass_Blue", "MovableWall_Glass_Green", "MovableWall_Glass_Orange", "MovableWall_Glass_Purple", "MovableWall_Glass_Red" ];
    const any_block = [...any_opaque_block, ...any_transparent_block];
    const any_random_crypto_file = function() {
        if(is_exit)
            return [ `CryptoFile_${exit_crypto_kind}` ];

        const valid_crypto_file = any_valid_entity.filter(type_name => type_name.startsWith("CryptoFile_") && !type_name.endsWith(exit_crypto_kind));

        if(room_info.world_desc.is_start){
            return [ random_sample(valid_crypto_file) ];
        }

        return valid_crypto_file;
    }();

    const any_random_crypto_keys = room_info.world_desc.is_start ? any_random_crypto_file.map(file_name => file_name.replace("CryptoFile_", "CryptoKey_"))
                                 : any_valid_entity.filter(type_name => type_name.startsWith("CryptoKey_") && !type_name.endsWith(exit_crypto_kind));

    debug.assertion(()=> !room_info.is_start || (any_random_crypto_file.length === 1 && any_random_crypto_keys.length === 1 && [...any_random_crypto_keys, ...any_random_crypto_file ].every(name => name.startsWith("Crypto"))));

    const any_stream_buffer_id = [ tiles.ID.STREAM_DOWN, tiles.ID.STREAM_UP, tiles.ID.STREAM_LEFT, tiles.ID.STREAM_RIGHT ];
    const any_random_usable_item = any_valid_entity.filter(type_name => type_name.startsWith("Item_"));
    const any_nonplayer_character_types_names = all_characters_types().map(type=> type.name).filter(type_name => type_name != "GlitchyGlitchMacGlitchy");
    const all_non_crypto_types_names = any_valid_entity.filter(type_name => !type_name.startsWith("Crypto") && type_name != "BlackBox");


    const room_desc = room_info.world_desc;
    tools.check_world_desc(room_desc);
    const converted_desc = copy_data(room_desc);
    // We convert proc-gen tiles to some choices, the choices must be the same for the whole chunk being worked on.

    const spawn = (entity_template, position)=>{
        debug.assertion(()=> (entity_template instanceof Object && typeof entity_template.type === 'string') || entity_template instanceof Function || entity_template.next instanceof Function);
        debug.assertion(()=> position instanceof Position);
        let entity;
        if(entity_template instanceof Function){
            entity = entity_template();
            if(entity == null) return;
        } else if(entity_template.next instanceof Function) {
            entity = entity_template.next().value;
            if(entity == null) return;
        } else {
            entity = copy_data(entity_template);
        }

        debug.assertion(()=> entity instanceof Object);
        debug.assertion(()=> entity.type !== "GlitchyGlitchMacGlitchy");
        const final_entity = Object.assign(entity, {
            position: position,
        });

        debug.assertion(() => tools.is_entity_desc(final_entity));
        converted_desc.entities.push(final_entity);
    };

    const spawn_tile_converter = (tile_match, entity_generator) => {
        debug.assertion(()=>Number.isInteger(tile_match) && tile_match >= 0);
        debug.assertion(()=>entity_generator instanceof Function || entity_generator.next instanceof Function);

        const entity_template = entity_generator instanceof Function ? entity_generator() : entity_generator.next().value;
        if(entity_template == null){
            return (tile) => tile === tile_match ? null : tile;
        }

        debug.assertion(()=> entity_template instanceof Object || Number.isInteger(entity_template));

        return (tile, tile_idx) => {
            if(tile === tile_match){
                if(Number.isInteger(entity_template)){ // We got a tile id instead of an entity: replace the previous tile by that one.
                    if(tiles.is_stream_tile(entity_template) && !tiles.is_safely_walkable(room_desc.grids.floor[tile_idx]))
                        return null; // Ignore stream-buffer tiles when over an unwalkable position.
                    return entity_template;
                }

                debug.assertion(()=> entity_template instanceof Object);
                // We got an entity.

                if(tiles.is_safely_walkable(room_desc.grids.floor[tile_idx])){ // Ignore spawn tiles when they are on unwalkable places
                    const position = new Position(position_from_index(room_desc.width, room_desc.height, tile_idx));
                    spawn(entity_template, position);
                }

                return null;
            } else {
                return tile; // No match: keep the same tile id.
            }
        };
    }


    const spawn_tile_conversions = [
        // SPAWN: Any movable block (opaque or not) or none
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_1, make_random_entity_gen_from([ ...any_block, null ])),

        // SPAWN: opaque blocks
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_2, make_random_entity_gen_from(any_opaque_block)),

        // SPAWN: transparent blocks
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_3, make_random_entity_gen_from(any_transparent_block)),

        // SPAWN: peaceful characters
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_4, make_random_entity_gen_from([ "LifeForm_Weak", "LifeForm_Strong", "Program", "WaitingNPC", "RandomActionEnemy" ])),

        // SPAWN: slightly dangerous characters
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_5, make_random_entity_gen_from([ "LifeForm_Aggressive", "LifeForm_Strong", "Microcode", "Program" ])),

        // SPAWN: very dangerous characters
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_6, make_random_entity_gen_from([ "Virus", "AntiVirus", "Microcode", "LifeForm_Berserk" ])),

        // SPAWN: AntiVirus or Program (used to put them together)
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_7, ()=>{
            function* generator(){
                while(true){
                    if(random_int(1, 100) < 10){
                        yield as_entity("AntiVirus");
                    } else {
                        yield as_entity("Program");
                    }
                }
            }; // call to get an Iterator
            return generator();
        }),

        // SPAWN: useful items or none
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_8, ()=> {
            return function*(){
                while(true) {
                    if(random_int(1, 100) < 66){
                        yield as_entity(random_sample(any_random_usable_item));
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: crypto-keys
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_10, ()=> {
            const generator = function*(){
                while(true) yield as_entity(random_sample(any_random_crypto_keys));
            };
            return generator();
        }),

        // SPAWN : chest - crypto-files or black-box with powerful items in them
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_11, ()=> {
            const  generator = function*(){
                const type_names = room_info.world_desc.is_start ? any_random_crypto_file : [ ...any_random_crypto_file, "BlackBox" ];
                while(true) yield as_entity(random_sample(type_names));
            };
            return generator();
        }),

        // SPAWN : doors - empty crypto-files
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_12, ()=>{
            const generator = function*(){
                while(true) yield Object.assign(as_entity(random_sample(any_random_crypto_file), { drops: [] }));
            };
            return generator();
        }),

        // SPAWN: maybe a black box or none (contain powerful item)
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_13, ()=>{
            return function*() {
                while(true) {
                    if(random_int(1, 100) < 66){
                        yield as_entity("BlackBox");
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: stream buffers (in one direction) or none
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_14, ()=> random_sample([ ...any_stream_buffer_id, null ])),

        // SPAWN: maybe any entity that is not a key/file o
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_15, ()=>{
            return function*() {
                while(true) {
                    if(random_int(1, 100) < 50){
                        const selection = random_sample(all_non_crypto_types_names);
                        yield as_entity(selection);
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: maybe any character
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_16, ()=>{
            return function*() {
                while(true) {
                    if(random_int(1, 100) < 50){
                        const selection = random_sample(any_nonplayer_character_types_names);
                        yield as_entity(selection);
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: maybe any block
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_17, ()=>{
            return function*() {
                while(true) {
                    if(random_int(1, 100) < 66){
                        const selection = random_sample(any_block);
                        yield as_entity(selection);
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: maybe any entity (crypto-files/keys too)
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_18, ()=>{
            return function*() {
                while(true) {
                    if(random_int(1, 100) < 66){
                        const selection = random_sample(any_valid_entity);
                        yield as_entity(selection);
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: maybe any crypto-file or crypto-key or useful item
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_19, ()=>{
            return function*() {
                const all_entity_types_names = [
                    "BlackBox",
                    ...any_random_crypto_file,
                    ...any_random_crypto_keys,
                    ...any_random_usable_item
                 ];
                 while(true) {
                    if(random_int(1, 100) < 66){
                        const selection = random_sample(all_entity_types_names);
                        yield as_entity(selection);
                    } else {
                        yield null;
                    }
                }
            }();
        }),

        // SPAWN: maybe any crypto-file (empty) or blackbox, or random block
        spawn_tile_converter(tiles.ID.PROCGEN_SPAWN_20, ()=>{
            return function*() {
                const all_entity_types_names = [
                    "BlackBox",
                    ...any_random_crypto_file,
                    ...any_block,
                 ];
                 while(true) {
                    if(random_int(1, 100) < 66){
                        const selection = random_sample(all_entity_types_names);
                        const need_empty_drop = selection.startsWith("Crypto");
                        const entity = as_entity(selection);
                        if(need_empty_drop)
                            entity.drops = [];
                        yield entity;
                    } else {
                        yield null;
                    }
                }
            }();
        }),

    ].reduce((acc, val) => ((x, idx) => val(acc(x, idx), idx)), x => x); // Reduced to 1 function

    converted_desc.grids.surface = converted_desc.grids.surface.map((tile_id, tile_idx)=>{
        const new_tile_id = spawn_tile_conversions(tile_id, tile_idx);
        debug.assertion(()=> converted_desc.entities.length === 0 || tools.is_entity_desc(converted_desc.entities[converted_desc.entities.length - 1]))
        return new_tile_id
    });

    room_info.world_desc = converted_desc;
    return room_info;
}

function clear_room(room_info){
    const room_desc = room_info.world_desc;
    tools.check_world_desc(room_desc);
    const converted_desc = copy_data(room_desc);

    // Replace procgen floor tiles by default tiles.
    converted_desc.grids.floor = converted_desc.grids.floor.map(tile_id => tiles.procgen_floor_tiles.includes(tile_id) ? defaults.floor : tile_id);

    // Remove procgen surface tiles.
    converted_desc.grids.surface = converted_desc.grids.surface.map(tile_id => tiles.procgen_surface_tiles.includes(tile_id) ? null : tile_id);

    room_info.world_desc = converted_desc;
    return room_info;
}

function generate_exit_room(exit_crypto_kind) {
    debug.assertion(()=> Object.values(crypto_names).includes(exit_crypto_kind));

    let room = random_sample(Object.values(exit_rooms));
    room = process_procgen_tiles(room);
    const room_info = populate_entities({ position: new Position(),world_desc: room }, exit_crypto_kind, true);
    return room_info.world_desc;
};

// Checks that the generated world matches our requirements for a decent level.
function validate(world){
    debug.assertion(()=> world instanceof World);


    // At least one entry point.
    if(!world.grids.surface.elements.includes(tiles.ID.ENTRY)) return false;


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


        // Pass 3: add entities in each room
        // Some entities need to know which key should be used for the door of the exit.
        const selected_exit_crypto_kind = random_sample(Object.values(crypto_names));
        debug.log(`EXIT ROOM CRYPTO KIND: ${selected_exit_crypto_kind}`);

        // Probability of populating a room is not 100%
        const probability_of_a_room_to_be_populated = 80;
        positionned_selected_rooms.map((room_info)=>{
            if(random_int(1, 100) <= probability_of_a_room_to_be_populated)
                return populate_entities(room_info, selected_exit_crypto_kind);
            else
                return clear_room(room_info);
        });


        // Pass 4: merge rooms into a big world

        const ram_world_with_rooms = tools.merge_world_chunks(level_name, defaults,
            { position: { x:0, y: 0}, world_desc: ram_world_chunk },
            ...positionned_selected_rooms
        );

        const selected_exit_room = generate_exit_room(selected_exit_crypto_kind);
        const ram_world_with_rooms_and_exit = tools.merge_world_chunks(level_name, { floor: tiles.ID.VOID },
            { position: { x: 0, y: 0}, world_desc: ram_world_with_rooms },
            { position: { x: random_int(0, ram_world_with_rooms.width - 8), y: ram_world_with_rooms.height }, world_desc: selected_exit_room }
        );

        // Pass 5: TODO: fill the inter-room corridors with walls and entities

        // Pass 6: cleanup, variations and validation.

        const world_desc = tools.random_variation(tools.add_padding_around(ram_world_with_rooms_and_exit, { floor: tiles.ID.VOID }));

        const world = tools.deserialize_world(world_desc);
        world.level_id = 2;

        // remove all entities that should not be there:
        world.entities.forEach(entity=>{
            if(!tiles.is_safely_walkable(world.grids.floor.get_at(entity.position))){
                world.remove_entity(entity.id);
            }
        });


        if(validate(world))
            return world;

        ++attempts;
        if(attempts >= max_attempts){
            console.warn(`Failed to produce a valid level after ${attempts} attempts - we will  the last generated level. ;_; `);
            return world;
        }
    }
}


/// TOOL for helping in level design

window.level_2_rooms = rooms;
window.level_2_starting_rooms = starting_rooms;
window.level_2_exit_rooms = exit_rooms;

window.level_2_process_procgen_tiles = (world_desc)=> {
    world_desc = process_procgen_tiles(world_desc);
    const world_info = populate_entities({ position: new Position(), world_desc: world_desc });
    return world_info.world_desc;
}

window.level_2_procgen_test_room = {
    "name" : "Test Level 'testing' 9 x 9",
    "width" : 9,
    "height" : 9,
    "grids" : {"floor":[104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9003,9003,9003,9002,9002,9002,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9000,9000,9000,9001,9001,9001,104,104,104,9004,9004,9004,104,104,104,104,104,104,9004,9004,9004,104,104,104,104,104,104,9004,9004,9004,104,104,104],"surface":[0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : []
};

window.level_test_spawn_tiles = {
    "name" : "Test Level 'testing' 25 x 25",
    "level_id": null,
    "width" : 25,
    "height" : 25,
    "grids" : {"floor":[107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107,107],"surface":[0,null,null,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,9100,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9101,9101,9101,9101,9101,9101,null,9102,9102,9102,9102,9102,9102,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9103,9103,9103,9103,9103,9103,9103,9103,9103,9103,9103,9103,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9104,9104,9104,9104,9104,9104,null,9105,9105,9105,9105,9105,9105,9105,9105,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9106,9106,9106,9106,9106,9106,9106,9106,9106,null,9107,9107,9107,9107,9107,9107,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9108,9108,9108,9108,9108,9108,9108,null,9109,9109,9109,9109,9109,9109,9109,9109,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9110,9110,9110,9110,9110,9110,9110,null,9111,9111,9111,9111,9111,9111,9111,9111,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9112,9112,9112,9112,9112,9112,9112,null,9113,9113,9113,9113,9113,9113,9113,9113,9113,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9114,9114,9114,9114,9114,9114,9114,null,9115,9115,9115,9115,9115,9115,9115,9115,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9116,9116,9116,9116,9116,9116,9116,null,9117,9117,9117,9117,9117,9117,9117,9117,9117,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,9118,9118,9118,9118,9118,9118,9118,null,9120,9120,9120,9120,9120,9120,9120,9120,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : [{"type":"GlitchyGlitchMacGlitchy","position":{"x":0,"y":0}}]
};
