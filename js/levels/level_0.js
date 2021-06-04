export {
    generate_world,
    last_starting_room_id,
}

import * as debug from "../system/debug.js";
import * as tiles from "../definitions-tiles.js";
import * as tools from "./level-tools.js";

import { random_sample } from "../system/utility.js";

const level_name = "Level 0: Crashed Memory";

let last_starting_room_id = 0;

const defaults = {
    floor : tiles.ID.LVL1A,
    floor_alt: tiles.ID.LVL1B,
    wall : tiles.ID.WALL1A,
    wall_alt : tiles.ID.WALL1B,
};

const startup_rooms = {

    jump: {
        "name" : "Level 0: Crashed Memory",
        "width" : 12,
        "height" : 20,
        "grids" : {"floor":[120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,100,100,100,100,100,100,120,120,120,120,120,120,100,100,100,100,100,100,120,120,120,120,120,120,100,100,100,100,100,100,120,120,120,120,120,120,100,100,100,100,120,100,120,120,120,120,120,120,100,100,100,100,120,100,120,100,100,100,120,120,120,120,120,100,120,100,120,100,120,100,120,120,120,100,100,100,120,100,120,100,120,120,120,120,120,100,120,120,100,100,120,100,100,100,120,120,120,100,120,100,100,100,120,100,100,120,120,120,100,100,120,120,120,120,120,100,100,40,120,120,40,40,40,40,40,40,100,120,120,40,120,120,40,40,40,40,40,40,100,120,120,40,120,120,40,100,100,30,30,120,100,120,100,100,120,120,40,30,30,30,30,30,120,100,120,100,120,120,30,30,120,120,30,30,100,120,100,100,120,120,120,120,100,30,30,100,120,100,120,100,100,100,100,100,100,30,30,120,120,120,100,100,100,100,100,100,100,100,120,120,120,120,120,120],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [
            { "type": "LifeForm_Weak", "position": { "x": 7, "y": 7 } },
            { "type": "CryptoFile_Triangle", "position": { "x": 3, "y": 8 }, "drops": ["Item_Jump"], "drops_are_crucial": true },
            { "type": "CryptoKey_Triangle", "position": { "x": 6, "y": 9 } },
            { "type": "CryptoKey_Plus", "position": { "x": 11, "y": 7 } }
        ]
    },

    push_pull: {
        "name" : "Start Room: Push & Pull",
        "width" : 10,
        "height" : 18,
        "grids" : {
            "floor": [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 100, 10, 10, 100, 100, 100, 100, 100, 120, 120, 10, 10, 10, 100, 100, 120, 120, 100, 120, 120, 100, 10, 100, 100, 100, 120, 100, 100, 120, 120, 100, 100, 100, 120, 10, 10, 120, 100, 120, 120, 100, 120, 120, 120, 10, 10, 10, 10, 120, 120, 100, 100, 100, 100, 100, 100, 100, 100, 120, 120, 100, 100, 100, 10, 120, 120, 120, 100, 120, 120, 120, 120, 120, 10, 120, 100, 100, 100, 120, 120, 10, 10, 10, 10, 120, 10, 120, 120, 120, 120, 120, 120, 10, 120, 120, 100, 100, 100, 120, 120, 120, 120, 10, 10, 120, 100, 100, 100, 120, 100, 100, 10, 10, 10, 120, 30, 30, 30, 120, 100, 120, 120, 120, 120, 120, 30, 30, 30, 120, 100, 120, 120, 120, 100, 100, 120, 120, 120, 120, 10, 100, 120, 120, 10, 10, 100, 100, 100, 120, 100, 100, 100, 100, 10, 10, 10, 120, 120, 120, 100, 10, 10, 120, 120, 120, 120, 100, 100, 120],
            "surface": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            "corruption": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            "unstable": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
        },
        "entities" : [
            { "type": "LifeForm_Weak", "position": { "x": 7, "y": 11 }, "drops": ["Item_Pull"], "drops_are_crucial": true },
            { "type": "CryptoKey_Triangle", "position": { "x": 7, "y": 3 } },
            { "type": "CryptoFile_Triangle", "position": { "x": 4, "y": 7 }, "drops": ["Item_Push"], "drops_are_crucial": true },
            { "type": "MovableWall_Glass_Purple", "position": { "x": 3, "y": 9 } },
            { "type": "MovableWall_Purple", "position": { "x": 3, "y": 10 } },
            { "type": "MovableWall_Red", "position": { "x": 7, "y": 15 } },
            { "type": "MovableWall_Red", "position": { "x": 6, "y": 15 } },
            { "type": "MovableWall_Red", "position": { "x": 5, "y": 15 } },
            { "type": "MovableWall_Red", "position": { "x": 5, "y": 16 } },
            { "type": "MovableWall_Red", "position": { "x": 4, "y": 16 } },
            { "type": "MovableWall_Glass_Red", "position": { "x": 3, "y": 16 } },
            { "type": "CryptoKey_Plus", "position": { "x": 8, "y": 15 } },
            { "type": "MovableWall_Green", "position": { "x": 2, "y": 16 } },
            { "type": "MovableWall_Green", "position": { "x": 2, "y": 17 } },
            { "type": "MovableWall_Green", "position": { "x": 1, "y": 15 } },
            { "type": "MovableWall_Glass_Green", "position": { "x": 0, "y": 14 } },
            { "type": "MovableWall_Glass_Green", "position": { "x": 0, "y": 15 } },
        ]
    },

    swap: {
        "name" : "Start Room: Swap",
        "width" : 10,
        "height" : 18,
        "grids" : {"floor":[120,120,120,120,120,120,120,120,120,120,120,10,100,100,100,100,100,100,100,120,120,100,100,100,100,100,100,10,100,120,120,100,120,120,120,120,120,120,100,120,120,100,100,100,100,100,100,100,10,120,120,120,100,100,100,10,100,100,120,120,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,100,100,120,100,10,10,100,120,30,30,100,120,120,10,100,120,100,120,30,30,100,100,120,120,100,120,100,100,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,120,10,100,120,10,10,10,10,10,120,10,10,10,120,10,10,10,10,10,120,10,10,10,120,40,40,10,10,120,120,10,10,10,10,10,10,40,10,10,100,120,120,120,120,120,120,120,120,10,10],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities": [
            { "type": "LifeForm_Weak", "position": { "x": 5, "y": 5 } },
            { "type": "LifeForm_Aggressive", "position": { "x": 5, "y": 1 } },
            { "type": "CryptoFile_Triangle", "position": { "x": 8, "y": 16 }, "drops": ["MovableWall_Glass_Orange"] },
            { "type": "CryptoKey_Triangle", "position": { "x": 4, "y": 2 }, is_crucial: true },
            { "type": "MovableWall_Purple", "position": { "x": 2, "y": 8 } },
            { "type": "MovableWall_Green", "position": { "x": 1, "y": 13 } },
            { "type": "MovableWall_Orange", "position": { "x": 2, "y": 13 } },
            { "type": "MovableWall_Green", "position": { "x": 5, "y": 13 } },
            { "type": "MovableWall_Green", "position": { "x": 7, "y": 13 } },
            { "type": "MovableWall_Blue", "position": { "x": 4, "y": 13 } },
            { "type": "MovableWall_Blue", "position": { "x": 6, "y": 13 } },
            { "type": "MovableWall_Blue", "position": { "x": 8, "y": 13 } },
            { "type": "MovableWall_Red", "position": { "x": 1, "y": 3 } },
            { "type": "MovableWall_Red", "position": { "x": 8, "y": 3 } },
            { "type": "Item_Swap", "position": { "x": 7, "y": 10 }, is_crucial: true },
            { "type": "MovableWall_Purple", "position": { "x": 4, "y": 14 } },
            { "type": "MovableWall_Purple", "position": { "x": 6, "y": 15 } },
            { "type": "MovableWall_Red", "position": { "x": 5, "y": 14 } },
            { "type": "MovableWall_Green", "position": { "x": 0, "y": 14 } },
            { "type": "MovableWall_Green", "position": { "x": 1, "y": 15 } },
            { "type": "MovableWall_Green", "position": { "x": 0, "y": 15 } },
            { "type": "MovableWall_Green", "position": { "x": 1, "y": 16 } },
            { "type": "MovableWall_Green", "position": { "x": 2, "y": 16 } },
            { "type": "MovableWall_Green", "position": { "x": 1, "y": 14 } },
            { "type": "CryptoKey_Plus", "position": { "x": 0, "y": 16 } },
        ]
    },

};

const exit_room = {
    "name" : "Level 0 exit",
    "width" : 9,
    "height" : 9,
    "grids" : {"floor":[10,10,101,10,101,10,101,10,10,10,101,10,101,101,101,10,101,10,101,10,101,101,101,101,101,10,101,30,101,101,101,101,101,101,101,30,30,101,101,101,101,101,101,101,30,30,101,101,101,101,101,101,101,30,30,101,101,101,101,101,101,101,30,30,101,101,101,101,101,101,101,30,30,30,30,30,30,30,30,30,30],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : [
        { "type": "LifeForm_Aggressive", "position": { "x": 4, "y": 6 } },
        { "type": "CryptoFile_Plus", "position": { "x": 7, "y": 7 }, drops: ["Item_MemoryCleanup"] },
    ]
};


window.startup_rooms = startup_rooms; // For debugging.
window.level_0_exit_room = exit_room; // For debugging.

function generate_world() {
    // LEVEL 0: Crashed Memory
    //

    const starting_room_id = random_sample(Object.keys(startup_rooms));
    last_starting_room_id = starting_room_id;

    const starting_room = startup_rooms[starting_room_id];

    const start_and_exit = tools.merge_world_chunks(level_name, { floor: defaults.wall },
        { position: { x: 0, y: 0 }, world_desc: starting_room, },
        { position: { x: 0, y: 18 }, world_desc: exit_room, },
    );

    const level_chunk = tools.random_variation(tools.add_padding_around(start_and_exit, { floor: defaults.wall }));
    const world = tools.deserialize_world(level_chunk);

    return world;
}