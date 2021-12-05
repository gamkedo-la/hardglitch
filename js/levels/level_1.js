export {
    generate_world,
}

import * as debug from "../system/debug.js";
import * as visibility from "../core/visibility.js";
import * as tiles from "../definitions-tiles.js";
import * as items from "../definitions-items.js";
import * as level_0 from "./level_0.js";
import { random_bag_pick, random_int, random_sample, shuffle_array } from "../system/utility.js";
import {
    ChunkGrid,
    deserialize_world,
    deserialize_entities,
    random_variation,
    unfold_chunk_grid,
    merge_world_chunks,
    add_padding_around,
    create_chunk,
    random_available_entity_position,
    predicate_entity_spawn_pos,
    fill_area_floor,
} from "./level-tools.js";
import { Position, World } from "../core/concepts.js";
import { is_point_under, Rectangle } from "../system/spatial.js";
import { grid_ID } from "../definitions-world.js";

const level_name = "Level 1: Buggy Program";

const defaults = {
    floor : tiles.ID.LVL1A,
    floor_alt: tiles.ID.LVL1B,
    wall : tiles.ID.WALL1A,
    wall_alt : tiles.ID.WALL1B,
};

const startup_room = {
    "name" : "Level 1 Starting Room",
    "width" : 8,
    "height" : 8,
    "grids" : {"floor":[11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,121,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,121,11,11,121,11,121,11,11,11,11,121,121,11,11,11,11,11,11,121,121,121,121,11,121,121,121,121],"surface":[null,null,null,null,null,null,null,null,null,null,0,null,null,0,null,null,null,0,null,null,null,null,0,null,null,null,0,null,0,null,null,null,null,null,null,0,null,null,0,null,null,0,null,null,null,0,null,null,null,null,0,null,0,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : [
        {
            "__class_type_name": "LifeForm_Weak",
            position: { x:1, y:1 },
            "stats": {
                "__class_type_name": "CharacterStats",
                "integrity": {
                    "__class_type_name": "StatValue",
                    "_value": 2,
                    "_max": 10,
                    "_min": 0,
                    "_modifiers": {},
                    "_listeners": {}
                },
            },
        },
        {"type":"CryptoFile_Triangle","position":{"x":3,"y":7}},
        {"type":"CryptoKey_Triangle","position":{"x":5,"y":2}}
    ]
};

const exit_rooms = {
    exit_1: {
        name: "exit 1",
        width: 8,
        height: 8,
        grids: {
          floor : [101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "MovableWall_Glass_Red", position: { x: 3, y: 4 } },
          { type: "MovableWall_Glass_Red", position: { x: 5, y: 4 } },
          { type: "MovableWall_Glass_Red", position: { x: 4, y: 5 } },
          { type: "MovableWall_Glass_Red", position: { x: 4, y: 3 } },
          { type: "MovableWall_Glass_Purple", position: { x: 2, y: 2 } },
          { type: "MovableWall_Glass_Purple", position: { x: 2, y: 3 } },
          { type: "MovableWall_Glass_Purple", position: { x: 2, y: 4 } },
          { type: "MovableWall_Glass_Purple", position: { x: 2, y: 5 } },
          { type: "MovableWall_Glass_Purple", position: { x: 2, y: 6 } },
          { type: "MovableWall_Glass_Purple", position: { x: 3, y: 6 } },
          { type: "MovableWall_Glass_Purple", position: { x: 4, y: 6 } },
          { type: "MovableWall_Glass_Purple", position: { x: 5, y: 6 } },
          { type: "MovableWall_Glass_Purple", position: { x: 6, y: 6 } },
          { type: "MovableWall_Glass_Purple", position: { x: 6, y: 5 } },
          { type: "MovableWall_Glass_Purple", position: { x: 6, y: 4 } },
          { type: "MovableWall_Glass_Purple", position: { x: 6, y: 3 } },
          { type: "MovableWall_Glass_Purple", position: { x: 6, y: 2 } },
          { type: "MovableWall_Glass_Purple", position: { x: 5, y: 2 } },
          { type: "MovableWall_Glass_Purple", position: { x: 4, y: 2 } },
          { type: "MovableWall_Glass_Purple", position: { x: 3, y: 2 } },
          { type: "MovableWall_Glass_Orange", position: { x: 3, y: 1 } },
          { type: "MovableWall_Glass_Orange", position: { x: 5, y: 1 } },
          { type: "MovableWall_Glass_Orange", position: { x: 7, y: 3 } },
          { type: "MovableWall_Glass_Orange", position: { x: 7, y: 5 } },
          { type: "MovableWall_Glass_Orange", position: { x: 5, y: 7 } },
          { type: "MovableWall_Glass_Orange", position: { x: 3, y: 7 } },
          { type: "MovableWall_Glass_Orange", position: { x: 1, y: 5 } },
          { type: "MovableWall_Glass_Orange", position: { x: 1, y: 3 } },
          { type: "MovableWall_Glass_Orange", position: { x: 1, y: 2 } },
          { type: "MovableWall_Glass_Orange", position: { x: 2, y: 1 } },
          { type: "MovableWall_Glass_Orange", position: { x: 4, y: 1 } },
          { type: "MovableWall_Glass_Orange", position: { x: 1, y: 4 } },
          { type: "MovableWall_Glass_Blue", position: { x: 1, y: 6 } },
          { type: "MovableWall_Glass_Blue", position: { x: 2, y: 7 } },
          { type: "MovableWall_Glass_Blue", position: { x: 0, y: 7 } },
          { type: "MovableWall_Glass_Blue", position: { x: 7, y: 6 } },
          { type: "MovableWall_Glass_Blue", position: { x: 6, y: 7 } },
          { type: "MovableWall_Glass_Blue", position: { x: 1, y: 0 } },
          { type: "MovableWall_Glass_Blue", position: { x: 2, y: 0 } },
          { type: "MovableWall_Glass_Blue", position: { x: 0, y: 2 } },
          { type: "MovableWall_Glass_Blue", position: { x: 0, y: 0 } },
          { type: "MovableWall_Glass_Blue", position: { x: 6, y: 0 } },
          { type: "MovableWall_Glass_Blue", position: { x: 7, y: 2 } },
        ],
    },
};

const boss_room = {
    "name" : "Test Level 'testing' 14 x 18",
    "width" : 14,
    "height" : 18,
    "grids" : {"floor":[100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,30,100,100,100,100,100,100,100,100,100,100,100,100,100,30,100,30,100,100,100,100,100,100,100,100,100,100,30,30,30,100,100,100,100,100,30,100,100,100,100,30,30,30,30,30,100,100,100,100,100,100,100,100,30,30,30,30,30,100,100,100,100,100,30,100,100,100,30,30,30,30,30,100,100,30,100,100,100,100,30,100,30,30,30,30,30,30,100,100,100,30,100,100,100,30,30,30,30,30,30,30,100,100,100,100,100,30,100,30,30,30,30,30,30,30,30,100,100,30,30,30,100,30,30,30,30,30,30,30,30,30,100,100,30,100,30,100,30,30,30,30,30,30,30,30,30,30,100,30,30,100,30,100,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,100,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,101,30,30,30,30,30,30,30,30,30,30,30,30,30,101,101,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    "entities" : [
        {"type":"AntiVirus","position":{"x":6,"y":1} },
        {"type":"CryptoFile_Plus","position":{"x":4,"y":10}, drops: [ "Item_PowerGlove" ] },
        {"type":"MovableWall_Glass_Blue","position":{"x":6,"y":0}},{"type":"MovableWall_Glass_Blue","position":{"x":4,"y":0}},{"type":"MovableWall_Glass_Blue","position":{"x":7,"y":0}},{"type":"MovableWall_Glass_Blue","position":{"x":8,"y":0}},{"type":"MovableWall_Glass_Blue","position":{"x":2,"y":0}},{"type":"MovableWall_Glass_Blue","position":{"x":12,"y":0}},{"type":"MovableWall_Glass_Blue","position":{"x":5,"y":4}},{"type":"MovableWall_Glass_Blue","position":{"x":5,"y":6}},{"type":"MovableWall_Glass_Blue","position":{"x":3,"y":6}},{"type":"MovableWall_Glass_Blue","position":{"x":7,"y":7}},{"type":"MovableWall_Glass_Blue","position":{"x":8,"y":6}},{"type":"MovableWall_Glass_Blue","position":{"x":10,"y":4}},{"type":"MovableWall_Glass_Blue","position":{"x":8,"y":4}},{"type":"MovableWall_Glass_Orange","position":{"x":9,"y":5}},{"type":"MovableWall_Glass_Orange","position":{"x":6,"y":5}},{"type":"MovableWall_Glass_Orange","position":{"x":4,"y":3}},{"type":"MovableWall_Glass_Orange","position":{"x":8,"y":3}},{"type":"MovableWall_Glass_Orange","position":{"x":9,"y":2}},{"type":"MovableWall_Glass_Orange","position":{"x":10,"y":2}},{"type":"MovableWall_Glass_Orange","position":{"x":5,"y":0}},{"type":"MovableWall_Glass_Orange","position":{"x":9,"y":1}},{"type":"MovableWall_Glass_Orange","position":{"x":3,"y":1}},{"type":"MovableWall_Purple","position":{"x":7,"y":2}},{"type":"MovableWall_Purple","position":{"x":9,"y":0}},{"type":"MovableWall_Purple","position":{"x":2,"y":2}},{"type":"MovableWall_Orange","position":{"x":11,"y":1}},{"type":"MovableWall_Green","position":{"x":4,"y":4}},{"type":"MovableWall_Green","position":{"x":11,"y":3}},{"type":"MovableWall_Green","position":{"x":11,"y":0}},{"type":"CryptoKey_Plus","position":{"x":10,"y":1}},
        {"type":"BlackBox","position":{"x":10,"y":16}, "drops": ["Item_ComputerCluster"] }
    ]
};

const level1_special_rooms = {
    room_plus_file_1: {
        name: "room plus file 1",
        width: 8,
        height: 8,
        grids: {
          floor : [30,30,30,100,100,30,30,30,30,100,100,100,100,100,100,30,30,100,30,100,100,30,100,30,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,30,100,30,100,100,30,100,30,30,100,100,100,100,100,100,30,30,30,30,100,100,30,30,30],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "LifeForm_Strong", position: { x: 4, y: 4 } },
          { type: "LifeForm_Strong", position: { x: 3, y: 3 } },
          { type: "MovableWall_Blue", position: { x: 3, y: 7 } },
          { type: "MovableWall_Blue", position: { x: 4, y: 7 } },
          { type: "MovableWall_Orange", position: { x: 7, y: 3 } },
          { type: "MovableWall_Orange", position: { x: 7, y: 4 } },
          { type: "MovableWall_Blue", position: { x: 0, y: 3 } },
          { type: "MovableWall_Blue", position: { x: 0, y: 4 } },
          { type: "MovableWall_Orange", position: { x: 3, y: 0 } },
          { type: "MovableWall_Orange", position: { x: 4, y: 0 } },
          { type: "CryptoKey_Plus", position: { x: 1, y: 6 } },
          { type: "CryptoFile_Plus", position: { x: 4, y: 3 } },
        ],
      },
    room_plus_file_2: {
        "name": "room plus file 2",
        "width": 8,
        "height": 8,
        "grids": {
            "floor": [30, 30, 30, 101, 101, 30, 30, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 101, 30, 101, 101, 30, 101, 30, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 30, 101, 30, 101, 101, 30, 101, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 30, 30, 101, 101, 30, 30, 30],
            "surface": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            "corruption": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], "unstable": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }, "entities": [{ "type": "LifeForm_Aggressive", "position": { "x": 3, "y": 3 } }, { "type": "MovableWall_Blue", "position": { "x": 3, "y": 7 } }, { "type": "MovableWall_Blue", "position": { "x": 4, "y": 7 } }, { "type": "MovableWall_Orange", "position": { "x": 7, "y": 3 } }, { "type": "MovableWall_Orange", "position": { "x": 7, "y": 4 } }, { "type": "MovableWall_Blue", "position": { "x": 0, "y": 3 } }, { "type": "MovableWall_Blue", "position": { "x": 0, "y": 4 } }, { "type": "MovableWall_Orange", "position": { "x": 3, "y": 0 } }, { "type": "MovableWall_Orange", "position": { "x": 4, "y": 0 } }, { "type": "CryptoKey_Plus", "position": { "x": 1, "y": 6 } }, { "type": "CryptoFile_Plus", "position": { "x": 4, "y": 3 } }]
    },
    room_plus_file_3: {
        "name": "room plus file 3",
        "width": 8,
        "height": 8,
        "grids": {
            "floor": [30, 30, 30, 30, 30, 30, 30, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 101, 101, 101, 101, 101, 101, 30, 30, 30, 30, 30, 30, 30, 30, 30],
            "surface": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            "corruption": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            "unstable": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
        },
        "entities": [
            { "type": "LifeForm_Aggressive", "position": { "x": 3, "y": 3 } }, { "type": "LifeForm_Aggressive", "position": { "x": 4, "y": 4 } }, { "type": "CryptoKey_Plus", "position": { "x": 3, "y": 4 } }, { "type": "CryptoFile_Plus", "position": { "x": 4, "y": 3 } }]
    },
    room_equal_file_1: {
        name: "room equal file 1",
        width: 8,
        height: 8,
        grids: {
          floor : [120,120,120,40,40,120,120,120,120,100,100,100,100,100,100,120,120,100,120,100,100,120,100,120,40,100,100,100,100,100,100,40,40,100,100,100,100,100,100,40,120,100,120,120,100,120,100,120,120,100,100,100,100,100,100,120,120,120,120,40,40,120,120,120],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "LifeForm_Strong", position: { x: 1, y: 5 } },
          { type: "LifeForm_Strong", position: { x: 4, y: 2 } },
          { type: "LifeForm_Strong", position: { x: 3, y: 1 } },
          { type: "LifeForm_Strong", position: { x: 4, y: 6 } },
          { type: "LifeForm_Strong", position: { x: 6, y: 4 } },
          { type: "LifeForm_Strong", position: { x: 2, y: 4 } },
          { type: "CryptoFile_Equal", position: { x: 1, y: 6 } },
          { type: "CryptoKey_Equal", position: { x: 6, y: 1 } },
        ],
      },
    room_equal_file_2: {
        name: "room equal file 2",
        width: 8,
        height: 8,
        grids: {
          floor : [120,120,120,40,40,120,120,120,120,101,101,101,101,101,101,120,120,101,120,101,101,120,101,120,40,101,101,101,101,101,101,40,40,101,101,101,101,101,101,40,120,101,120,120,101,120,101,120,120,101,101,101,101,101,101,120,120,120,120,40,40,120,120,120],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { "type": "LifeForm_Aggressive", "position": { "x": 3, "y": 3 } },
          { "type": "LifeForm_Aggressive", "position": { "x": 4, "y": 4 } },
          { type: "CryptoFile_Equal", position: { x: 1, y: 6 } },
          { type: "CryptoKey_Equal", position: { x: 6, y: 1 } },
        ],
      },
    room_equal_file_3: {
        name: "room equal file 3",
        width: 8,
        height: 8,
        grids: {"floor":[30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,100,100,100,100,100,100,100,100,100,101,101,101,101,101,10,100,100,10,101,101,101,101,101,100,100,100,100,100,100,100,100,100,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        entities: [{"type":"LifeForm_Aggressive","position":{"x":4,"y":4}},{"type":"LifeForm_Strong","position":{"x":3,"y":4}},{"type":"LifeForm_Strong","position":{"x":4,"y":3}},{"type":"MovableWall_Glass_Orange","position":{"x":0,"y":2}},{"type":"MovableWall_Glass_Orange","position":{"x":0,"y":5}},{"type":"MovableWall_Glass_Orange","position":{"x":7,"y":5}},{"type":"MovableWall_Glass_Orange","position":{"x":7,"y":2}},{"type":"MovableWall_Orange","position":{"x":7,"y":3}},{"type":"MovableWall_Orange","position":{"x":7,"y":4}},{"type":"MovableWall_Orange","position":{"x":0,"y":3}},{"type":"MovableWall_Orange","position":{"x":0,"y":4}},{"type":"CryptoKey_Equal","position":{"x":6,"y":3}},{"type":"CryptoFile_Equal","position":{"x":1,"y":4}}],
    },
    room_triangle_file_1 : {
        "name" : "room triangle file 1",
        "width" : 8,
        "height" : 8,
        "grids" : {"floor":[101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,10,101,101,101,101,101,101,101,10,10,101,101,101,101,101,101,10,10,10,10,101,101,101,101,10,10,10,10,101,101,101,101,100,100,10,10,10,101,101,101,100,100,10,10,10,10,101,101],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"Microcode","position":{"x":6,"y":1}},{"type":"MovableWall_Blue","position":{"x":5,"y":2}},{"type":"MovableWall_Blue","position":{"x":5,"y":1}},{"type":"MovableWall_Blue","position":{"x":0,"y":0}},{"type":"MovableWall_Blue","position":{"x":1,"y":0}},{"type":"MovableWall_Blue","position":{"x":2,"y":0}},{"type":"MovableWall_Blue","position":{"x":3,"y":0}},{"type":"MovableWall_Blue","position":{"x":4,"y":0}},{"type":"MovableWall_Blue","position":{"x":5,"y":0}},{"type":"MovableWall_Blue","position":{"x":6,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":1}},{"type":"MovableWall_Purple","position":{"x":7,"y":2}},{"type":"MovableWall_Purple","position":{"x":7,"y":3}},{"type":"MovableWall_Purple","position":{"x":7,"y":4}},{"type":"MovableWall_Purple","position":{"x":7,"y":5}},{"type":"MovableWall_Purple","position":{"x":7,"y":6}},{"type":"MovableWall_Orange","position":{"x":6,"y":7}},{"type":"MovableWall_Orange","position":{"x":5,"y":7}},{"type":"MovableWall_Orange","position":{"x":4,"y":7}},{"type":"MovableWall_Orange","position":{"x":7,"y":7}},{"type":"MovableWall_Green","position":{"x":0,"y":1}},{"type":"MovableWall_Green","position":{"x":0,"y":2}},{"type":"MovableWall_Green","position":{"x":0,"y":3}},{"type":"MovableWall_Glass_Red","position":{"x":1,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":2,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":3,"y":7}},{"type":"MovableWall_Glass_Orange","position":{"x":0,"y":7}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":4}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":5}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":6}},{"type":"CryptoFile_Triangle","position":{"x":2,"y":5}},{"type":"CryptoKey_Triangle","position":{"x":6,"y":5}},{"type":"MovableWall_Blue","position":{"x":5,"y":3}},{"type":"MovableWall_Blue","position":{"x":5,"y":4}}]
    },
    room_triangle_file_2 : {
        "name" : "room triangle file 2",
        "width" : 8,
        "height" : 8,
        "grids" : {"floor":[101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,10,101,101,101,101,101,101,101,10,10,101,101,101,101,101,101,10,10,10,10,101,101,101,101,10,10,10,10,101,101,101,101,100,100,10,10,10,101,101,101,100,100,10,10,10,10,101,101],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"Virus","position":{"x":6,"y":1}},{"type":"MovableWall_Glass_Red","position":{"x":6,"y":2}},{"type":"MovableWall_Blue","position":{"x":5,"y":2}},{"type":"MovableWall_Blue","position":{"x":0,"y":0}},{"type":"MovableWall_Blue","position":{"x":1,"y":0}},{"type":"MovableWall_Blue","position":{"x":2,"y":0}},{"type":"MovableWall_Blue","position":{"x":3,"y":0}},{"type":"MovableWall_Blue","position":{"x":4,"y":0}},{"type":"MovableWall_Blue","position":{"x":5,"y":0}},{"type":"MovableWall_Blue","position":{"x":6,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":1}},{"type":"MovableWall_Purple","position":{"x":7,"y":2}},{"type":"MovableWall_Purple","position":{"x":7,"y":3}},{"type":"MovableWall_Purple","position":{"x":7,"y":4}},{"type":"MovableWall_Purple","position":{"x":7,"y":5}},{"type":"MovableWall_Purple","position":{"x":7,"y":6}},{"type":"MovableWall_Orange","position":{"x":6,"y":7}},{"type":"MovableWall_Orange","position":{"x":5,"y":7}},{"type":"MovableWall_Orange","position":{"x":4,"y":7}},{"type":"MovableWall_Orange","position":{"x":7,"y":7}},{"type":"MovableWall_Green","position":{"x":0,"y":1}},{"type":"MovableWall_Green","position":{"x":0,"y":2}},{"type":"MovableWall_Green","position":{"x":0,"y":3}},{"type":"MovableWall_Glass_Red","position":{"x":1,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":2,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":3,"y":7}},{"type":"MovableWall_Glass_Orange","position":{"x":0,"y":7}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":4}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":5}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":6}},{"type":"CryptoFile_Triangle","position":{"x":2,"y":5}},{"type":"CryptoKey_Triangle","position":{"x":6,"y":5}},{"type":"MovableWall_Blue","position":{"x":5,"y":1}},{"type":"MovableWall_Blue","position":{"x":5,"y":3}},{"type":"MovableWall_Blue","position":{"x":5,"y":4}}]
    },
    // room_triangle_file_3 : {
    //     "name" : "room triangle file 3",
    //     "width" : 8,
    //     "height" : 8,
    //     "grids" : {"floor":[101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,10,101,101,101,101,101,101,101,10,10,101,101,101,101,101,101,10,10,10,10,101,101,101,101,10,10,10,10,101,101,101,101,100,100,10,10,10,101,101,101,100,100,10,10,10,10,101,101],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
    //     "entities" : [{"type":"AntiVirus","position":{"x":6,"y":1}},{"type":"MovableWall_Blue","position":{"x":5,"y":2}},{"type":"MovableWall_Blue","position":{"x":5,"y":1}},{"type":"MovableWall_Blue","position":{"x":0,"y":0}},{"type":"MovableWall_Blue","position":{"x":1,"y":0}},{"type":"MovableWall_Blue","position":{"x":2,"y":0}},{"type":"MovableWall_Blue","position":{"x":3,"y":0}},{"type":"MovableWall_Blue","position":{"x":4,"y":0}},{"type":"MovableWall_Blue","position":{"x":5,"y":0}},{"type":"MovableWall_Blue","position":{"x":6,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":1}},{"type":"MovableWall_Purple","position":{"x":7,"y":2}},{"type":"MovableWall_Purple","position":{"x":7,"y":3}},{"type":"MovableWall_Purple","position":{"x":7,"y":4}},{"type":"MovableWall_Purple","position":{"x":7,"y":5}},{"type":"MovableWall_Purple","position":{"x":7,"y":6}},{"type":"MovableWall_Orange","position":{"x":6,"y":7}},{"type":"MovableWall_Orange","position":{"x":5,"y":7}},{"type":"MovableWall_Orange","position":{"x":4,"y":7}},{"type":"MovableWall_Orange","position":{"x":7,"y":7}},{"type":"MovableWall_Green","position":{"x":0,"y":1}},{"type":"MovableWall_Green","position":{"x":0,"y":2}},{"type":"MovableWall_Green","position":{"x":0,"y":3}},{"type":"MovableWall_Glass_Red","position":{"x":1,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":2,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":3,"y":7}},{"type":"MovableWall_Glass_Orange","position":{"x":0,"y":7}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":4}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":5}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":6}},{"type":"CryptoFile_Triangle","position":{"x":2,"y":5}},{"type":"CryptoKey_Triangle","position":{"x":6,"y":5}},{"type":"MovableWall_Blue","position":{"x":5,"y":3}},{"type":"MovableWall_Blue","position":{"x":5,"y":4}},{"type":"MovableWall_Blue","position":{"x":4,"y":6}},{"type":"MovableWall_Blue","position":{"x":2,"y":4}},{"type":"MovableWall_Blue","position":{"x":3,"y":2}},{"type":"MovableWall_Blue","position":{"x":2,"y":1}},{"type":"MovableWall_Blue","position":{"x":4,"y":1}},{"type":"MovableWall_Blue","position":{"x":3,"y":4}}]
    // },
    room_triangle_file_5 : {
        "name" : "room triangle file 5",
        "width" : 8,
        "height" : 8,
        "grids" : {"floor":[101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,101,10,101,101,101,101,101,101,101,10,10,101,101,101,101,101,101,10,10,10,10,101,101,101,101,10,10,10,10,101,101,101,101,100,100,10,10,10,101,101,101,100,100,10,10,10,10,101,101],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"LifeForm_Aggressive","position":{"x":6,"y":1}},{"type":"LifeForm_Aggressive","position":{"x":6,"y":2}},{"type":"MovableWall_Blue","position":{"x":5,"y":2}},{"type":"MovableWall_Blue","position":{"x":5,"y":1}},{"type":"MovableWall_Blue","position":{"x":0,"y":0}},{"type":"MovableWall_Blue","position":{"x":1,"y":0}},{"type":"MovableWall_Blue","position":{"x":2,"y":0}},{"type":"MovableWall_Blue","position":{"x":3,"y":0}},{"type":"MovableWall_Blue","position":{"x":4,"y":0}},{"type":"MovableWall_Blue","position":{"x":5,"y":0}},{"type":"MovableWall_Blue","position":{"x":6,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":0}},{"type":"MovableWall_Purple","position":{"x":7,"y":1}},{"type":"MovableWall_Purple","position":{"x":7,"y":2}},{"type":"MovableWall_Purple","position":{"x":7,"y":3}},{"type":"MovableWall_Purple","position":{"x":7,"y":4}},{"type":"MovableWall_Purple","position":{"x":7,"y":5}},{"type":"MovableWall_Purple","position":{"x":7,"y":6}},{"type":"MovableWall_Orange","position":{"x":6,"y":7}},{"type":"MovableWall_Orange","position":{"x":5,"y":7}},{"type":"MovableWall_Orange","position":{"x":4,"y":7}},{"type":"MovableWall_Orange","position":{"x":7,"y":7}},{"type":"MovableWall_Green","position":{"x":0,"y":1}},{"type":"MovableWall_Green","position":{"x":0,"y":2}},{"type":"MovableWall_Green","position":{"x":0,"y":3}},{"type":"MovableWall_Glass_Red","position":{"x":1,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":2,"y":7}},{"type":"MovableWall_Glass_Red","position":{"x":3,"y":7}},{"type":"MovableWall_Glass_Orange","position":{"x":0,"y":7}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":4}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":5}},{"type":"MovableWall_Glass_Green","position":{"x":0,"y":6}},{"type":"CryptoFile_Triangle","position":{"x":2,"y":5}},{"type":"CryptoKey_Triangle","position":{"x":6,"y":5}},{"type":"MovableWall_Blue","position":{"x":5,"y":3}},{"type":"MovableWall_Blue","position":{"x":5,"y":4}},{"type":"MovableWall_Blue","position":{"x":4,"y":6}},{"type":"MovableWall_Blue","position":{"x":2,"y":4}},{"type":"MovableWall_Blue","position":{"x":3,"y":2}},{"type":"MovableWall_Blue","position":{"x":2,"y":1}},{"type":"MovableWall_Blue","position":{"x":4,"y":1}},{"type":"MovableWall_Blue","position":{"x":3,"y":4}}]
    },
}


const berserk_rooms = {
    arena_1: {
        "name" : "Berserk Arena 1",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[100,100,121,100,121,100,121,100,100,100,121,121,100,100,100,121,121,100,121,121,10,121,10,121,10,121,121,100,100,121,10,10,10,121,100,100,121,100,10,10,10,10,10,100,121,100,100,121,10,10,10,121,100,100,121,121,10,121,10,121,10,121,121,100,121,121,100,100,100,121,121,100,100,100,121,100,121,100,121,100,100],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"LifeForm_Berserk","position":{"x":4,"y":4},"drops":["LifeForm_Aggressive",null]}]
    },
    arena_2: {
        "name" : "Berserk Arena 2",
        "width" : 9,
        "height" : 9,
        "grids" : {"floor":[121,100,100,100,121,100,100,100,121,100,121,121,100,121,100,121,121,100,100,121,10,100,10,100,10,121,100,100,100,100,121,10,121,100,100,100,121,121,10,10,10,10,10,121,121,100,100,100,121,10,121,100,100,100,100,121,10,100,10,100,10,121,100,100,121,121,100,121,100,121,121,100,121,100,100,100,121,100,100,100,121],"surface":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"corruption":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"unstable":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},
        "entities" : [{"type":"LifeForm_Berserk","position":{"x":4,"y":4},"drops":["LifeForm_Aggressive",null]}]
    }
}

window.level_1_startup_room = startup_room; // For debugging.
window.exit_rooms = exit_rooms; // For debugging.
window.level1_special_rooms = level1_special_rooms; // For debugging.
window.level1_berserk_rooms = berserk_rooms; // For debugging.
window.level_1_exit_rooms = exit_rooms; // For debugging.
window.level_1_boss_room = boss_room; // For debugging.

const starting_items = [ "Item_Push", "Item_Pull",  "Item_Swap", "Item_Jump"];



function populate_entities(world, central_area_rect, avoid_areas, start_items){
    debug.assertion(()=> world instanceof World);
    debug.assertion(()=> central_area_rect instanceof Rectangle);
    debug.assertion(()=> avoid_areas instanceof Array && avoid_areas.every(area => area instanceof Rectangle));
    debug.assertion(()=> start_items instanceof Array);

    const entities = [];
    const add_entities_from_desc = (...entities_descs)=>{ // FIXME: THIS IS A HACK TO KEEP THE WORLD AND DESCS IN SYNC ;__;
        entities.push(...entities_descs);
        deserialize_entities(entities_descs).forEach(entity => world.add_entity(entity));
    };
    const is_world_spawn_position = predicate_entity_spawn_pos(world);
    const is_spawn_position =  position => avoid_areas.every(area => !is_point_under(position, area))
                                        && is_world_spawn_position(position);

    const random_spawn_pos = (area = central_area_rect)=> random_available_entity_position(world, area, is_spawn_position);

    const entity_bag =  function*() {
        const bag = [
            { type: "LifeForm_Strong" },
            { type: "LifeForm_Strong" },
            { type: "LifeForm_Strong" },
            { type: "LifeForm_Weak" },
            { type: "LifeForm_Weak" },
            { type: "LifeForm_Weak" },
            { type: "LifeForm_Aggressive" },
            { type: "MovableWall_Purple" },
            { type: "MovableWall_Purple" },
            { type: "MovableWall_Red" },
            { type: "MovableWall_Red" },
            { type: "Item_BadCode" },
            { type: "Item_BadCode" },
            { type: "Item_BadCode" },
            { type: "Item_BadCode" },
        ];
        shuffle_array(bag);
        while (bag.length > 0) {
            if (random_int(0, 100) > 33){
                const desc = bag.pop();
                desc.position = random_spawn_pos(central_area_rect);
                yield desc;
            }
            else
                yield null;
        }
        while(true) yield null;
    };

    const entities_generator = entity_bag();

    // 1: add crypto keys/files in the central area - with special items
    const is_crypto_stuffs_splitt_horizontal = random_int(1, 100) > 50;
    const crypto_areas = [];
    if(is_crypto_stuffs_splitt_horizontal){
        const half_height = Math.ceil(central_area_rect.height/2);
        crypto_areas.push(
            new Rectangle({
                position: central_area_rect.position,
                width: central_area_rect.width,
                height: half_height,
            }),
            new Rectangle({
                position: {
                    x: central_area_rect.position.x,
                    y: central_area_rect.position.y + half_height + 1,
                },
                width: central_area_rect.width,
                height: half_height,
            }),
        );
    } else {
        const half_width = Math.ceil(central_area_rect.width/2);
        crypto_areas.push(
            new Rectangle({
                position: central_area_rect.position,
                width: half_width,
                height: central_area_rect.height,
            }),
            new Rectangle({
                position: {
                    x: central_area_rect.position.x + half_width + 1,
                    y: central_area_rect.position.y,
                },
                width: half_width,
                height: central_area_rect.height,
            }),
        );
    }

    const crypto_safe_marge = 2;
    const crypto_areas_marge = crypto_areas.map(rect => {
        rect.position = rect.position.translate({x:crypto_safe_marge, y:crypto_safe_marge});
        rect.width -= (crypto_safe_marge * 2);
        rect.height -= (crypto_safe_marge * 2);
        return rect;
    });

    const crypto_key_area = random_bag_pick(crypto_areas_marge, 1)[0];
    const crypto_file_area = random_bag_pick(crypto_areas_marge, 1)[0];
    debug.assertion(()=>crypto_key_area instanceof Rectangle);
    debug.assertion(()=>crypto_file_area instanceof Rectangle);
    add_entities_from_desc(
        { type: "CryptoFile_Circle", position: random_spawn_pos(crypto_file_area), drops: start_items },
        { type: "CryptoKey_Circle", position: random_spawn_pos(crypto_key_area) },
    );
    // add_entities_from_desc(
    //     { type: "CryptoFile_Circle", position: random_spawn_pos(crypto_file_area) },
    //     { type: "CryptoKey_Circle", position: random_spawn_pos(crypto_key_area) },
    // );

    // 2: add some entities in the central area - some items in particular
    const half_central_area_width = Math.floor(central_area_rect.width / 2);
    const half_central_area_height = Math.floor(central_area_rect.height / 2);
    const quarter_central_area_width = Math.floor(half_central_area_width / 2);
    const area_close_to_entry = new Rectangle({
        position: {
            x: central_area_rect.position.x + quarter_central_area_width,
            y: central_area_rect.position.y,
        },
        width: half_central_area_width,
        height: half_central_area_height,
    });
    const important_items_spawn_pos = random_spawn_pos(area_close_to_entry);
    const random_pos_around_important_item = ()=>{
        const range = new visibility.Range_Circle(5, 8);
        const selected_pos = visibility.random_range_position(important_items_spawn_pos, range, is_spawn_position);
        if(selected_pos == null){
            return random_spawn_pos(new Rectangle({ position: important_items_spawn_pos, width: 8, height: 8 }));
        }
        return selected_pos;
    };

    const bonus_bag = [
        { type: "Item_Scanner",     position: random_spawn_pos(area_close_to_entry) },
        { type: "Item_ThreadPool",  position: important_items_spawn_pos },
        { type: "Item_Zip",         position: random_pos_around_important_item(important_items_spawn_pos) },
    ];

    add_entities_from_desc(...bonus_bag);


    for(let i = 0; i < 8; ++i){
        const entity_desc = entities_generator.next().value;
        if(entity_desc)
            add_entities_from_desc(entity_desc);
    }

    // 3: add a dangerous foe close to the exit
    const dangerous_length = 8;
    const dangerous_area = new Rectangle({
        x: central_area_rect.position.x,
        y: central_area_rect.position.y + central_area_rect.height - dangerous_length,
        width: central_area_rect.width,
        height: dangerous_length,
    });
    const find_nice_spot_for_dangerous_foe = () => {
        // We look for a position which is surrounded by other spawn positions,
        const max_attempts = 1000;
        let attempts = 0;
        while(++attempts < max_attempts){
            const pos = random_spawn_pos(dangerous_area);
            if(pos.adjacents_diags.every(is_spawn_position))
                return pos;
        }

        // Or... do what you can
        return random_spawn_pos(dangerous_area);
    };
    const dangerous_foe_type = random_sample(["Virus"]);
    const dangerous_foe_pos = find_nice_spot_for_dangerous_foe();
    const dangerous_foe = { type: dangerous_foe_type, position: dangerous_foe_pos };
    add_entities_from_desc(dangerous_foe);
    add_entities_from_desc(...dangerous_foe_pos.adjacents_diags.map(position=> { return { type: "MovableWall_Red", position }; }));

    // 4: add one sample slightly aggressive kind of lifeform...
    add_entities_from_desc({ type: "LifeForm_Aggressive", position: random_spawn_pos(dangerous_area) });

    return entities;
}


function generate_world() {
    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //

    let start_items = [
        ...starting_items
    ];

    const starting_room_id = level_0.last_starting_room_id;
    switch(starting_room_id){
        case "jump":
            start_items = start_items.filter(item_id => item_id != "Item_Jump");
            break;
        case "push_pull":
            start_items = start_items.filter(item_id => item_id != "Item_Push" && item_id != "Item_Pull");
            break;
        case "swap":
            start_items = start_items.filter(item_id => item_id != "Item_Swap");
            break;
    }


    const lifeform_chunk_2x2 = new ChunkGrid({
        width: 1, height: 1, // These are number of chunks
        chunk_width: 2, chunk_height: 2,
        chunks: [
            create_chunk(2, 2, {
                floor: [
                    tiles.ID.MEMFLOORCOOL, tiles.ID.MEMFLOORCOOL,
                    tiles.ID.MEMFLOORCOOL, tiles.ID.MEMFLOORCOOL,
                ]
            }),
        ],
        random_variation: true,
        random_entities_position: true,
    });

    const random_empty_2x2_floor = (surface_id, wall_id) => {

        const basic_chunks = {
            oooo: new ChunkGrid({
                width: 1, height: 1, // These are number of chunks
                chunk_width: 2, chunk_height: 2,
                chunks: [
                    create_chunk(2, 2, {
                        floor: [
                            surface_id, surface_id,
                            surface_id, surface_id,
                        ]
                    }),
                ],
                random_variation: true,
                random_entities_position: true,
            }),
            xooo: new ChunkGrid({
                width: 1, height: 1, // These are number of chunks
                chunk_width: 2, chunk_height: 2,
                chunks: [
                    create_chunk(2, 2, {
                        floor: [
                            wall_id, surface_id,
                            surface_id, surface_id,
                        ]
                    }),
                ],
                random_variation: true,
                random_entities_position: true,
            }),
            xxoo: new ChunkGrid({
                width: 1, height: 1, // These are number of chunks
                chunk_width: 2, chunk_height: 2,
                chunks: [
                    create_chunk(2, 2, {
                        floor: [
                            wall_id, wall_id,
                            surface_id, surface_id,
                        ]
                    }),
                ],
                random_variation: true,
                random_entities_position: true,
            }),
            xxxo: new ChunkGrid({
                width: 1, height: 1, // These are number of chunks
                chunk_width: 2, chunk_height: 2,
                chunks: [
                    create_chunk(2, 2, {
                        floor: [
                            wall_id, wall_id,
                            wall_id, surface_id,
                        ]
                    }),
                ],
                random_variation: true,
                random_entities_position: true,
            }),
            xxxx: new ChunkGrid({
                width: 1, height: 1, // These are number of chunks
                chunk_width: 2, chunk_height: 2,
                chunks: [
                    create_chunk(2, 2, {
                        floor: [
                            wall_id, wall_id,
                            wall_id, wall_id,
                        ]
                    }),
                ],
            }),
        }

        const chunk = random_sample([ // This table is basically a probability table.
            basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
            basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
            basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo,
            basic_chunks.xxoo, basic_chunks.xxoo, basic_chunks.xxxo, basic_chunks.xxxx,
            basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
            basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo,
            basic_chunks.xxoo, basic_chunks.xxoo, basic_chunks.xxxo, basic_chunks.xxxx,
            basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
            basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
            basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo,
            basic_chunks.xxoo, basic_chunks.xxoo, basic_chunks.xxxo, basic_chunks.xxxx,
            lifeform_chunk_2x2,
        ]);

        return chunk;
    }

    const subchunks_2x2 = () => {
        return random_sample([
            random_empty_2x2_floor(defaults.floor, defaults.wall),
            random_empty_2x2_floor(defaults.floor, defaults.wall),
            random_empty_2x2_floor(defaults.floor, tiles.ID.VOID),
            random_empty_2x2_floor(defaults.floor, tiles.ID.HOLE),
        ]);
    }


    const  subchunk_4x4 = ()=>{
        return new ChunkGrid({
            width: 2, height: 2,
            chunk_width: 2, chunk_height: 2,
            chunks: [
                subchunks_2x2, subchunks_2x2,
                subchunks_2x2, subchunks_2x2
            ],
        });
    }


    const subchunk_8x8 = () => {
        return new ChunkGrid({
            width: 2, height: 2,
            chunk_width: 4, chunk_height: 4,
            chunks: [
                subchunk_4x4, subchunk_4x4,
                subchunk_4x4, subchunk_4x4
            ],
        });
    }


    const starting_room = startup_room;
    const exit_room = random_variation(random_sample(Object.values(exit_rooms)));


    const level_central_chunks = new ChunkGrid({
        width: 3, height: 5, // These are number of chunks
        chunk_width: 8, chunk_height: 8,
        default_grid_values: defaults,
        chunks: [
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
        ],
    });

    const central_chunk_width = level_central_chunks.width * level_central_chunks.chunk_width;
    const central_chunk_height = level_central_chunks.height * level_central_chunks.chunk_height;
    const central_chunk_half_width = Math.floor(central_chunk_width / 2);
    const central_chunk_half_height = Math.floor(central_chunk_height / 2);
    const central_chunk_center_rect = new Rectangle({
        x: central_chunk_half_width  - Math.floor(central_chunk_half_width / 2),
        y: central_chunk_half_height - Math.floor(central_chunk_half_height / 2),
        width: central_chunk_half_width,
        height: central_chunk_half_height,
    });

    const start_pos = {
        x: random_int(0, central_chunk_width - starting_room.width),
        y: 0
    };
    const central_part_pos = { x: 0, y: starting_room.height };
    const central_part = unfold_chunk_grid("level center", level_central_chunks);

    // Make sure the entry and exit areas in the central part is not blocked
    const safe_space = 2;
    fill_area_floor(central_part, new Rectangle({ position:{ x:0, y:0 }, width: central_part.width, height: safe_space}), defaults.floor);
    fill_area_floor(central_part, new Rectangle({ position:{ x:0, y:central_part.height - safe_space }, width: central_part.width, height: safe_space}), defaults.floor);

    const berserk_arena = random_sample(Object.values(berserk_rooms));
    const berserk_arena_pos = {
        x: random_int(central_chunk_center_rect.top_left.x, central_chunk_center_rect.top_right.x - berserk_arena.width),
        y: random_int(central_chunk_center_rect.top_left.y, central_chunk_center_rect.bottom_right.y - berserk_arena.height),
    };

    const level_with_berserk_room = merge_world_chunks(level_name, { floor: defaults.wall },
        { position: { x: 0, y: 0 }, world_desc: central_part, },
        { position: berserk_arena_pos, world_desc: berserk_arena, },
    );

    const level_with_starting_room = merge_world_chunks(level_name, { floor: defaults.wall },
        { position: { x: 0, y: start_pos.y + starting_room.height }, world_desc: level_with_berserk_room, },
        { position: start_pos, world_desc: starting_room, },
    );

    const exit_left = random_int(0, level_with_starting_room.width - exit_room.width);
    const exit_top = level_with_starting_room.height - random_int(0, 4);
    const level_with_exit_room = merge_world_chunks(level_name, { floor: defaults.wall },
        { position: { x: 0, y: 0 }, world_desc: level_with_starting_room, },
        { position: { x: exit_left, y: exit_top }, world_desc: exit_room, },
        { position: { x: exit_left + random_int(-2, 2), y: exit_top + exit_room.height }, world_desc: boss_room }
    );

    const [special_room_east, special_room_west] = random_bag_pick(Object.values(level1_special_rooms), 2).map(random_variation);
    debug.assertion(()=>special_room_east && special_room_west);
    const west_room = {
        world_desc: special_room_west,
        position: {
            x: random_int(0, 2),
            y: starting_room.height + random_int(-4, central_chunk_height - special_room_east.height - 4)
        }
    };
    const east_room = {
        world_desc: special_room_east,
        position: {
            x: special_room_west.width + central_chunk_width - random_int(0, 2),
            y: starting_room.height + random_int(-4, central_chunk_height - special_room_east.height - 4)
        }
    };
    const level_with_special_rooms = merge_world_chunks(level_name, { floor: defaults.wall },
        { position: { x: special_room_west.width, y: 0 }, world_desc: level_with_exit_room, },
        east_room, west_room,
    );

    const level_desc = add_padding_around(level_with_special_rooms, { floor: defaults.wall });
    const world_so_far = deserialize_world(level_desc);

    const central_area = new Rectangle({
        position: {
            x: west_room.world_desc.width + central_part_pos.x,  // the central area is pushed on the east by the west room, so we need to take that into acount to find it's real position (FIXME)
            y: central_part_pos.y
        },
        width: central_part.width,
        height: central_part.height
    });

    const berserk_arena_area = new Rectangle({
        position: {
            x: west_room.world_desc.width + central_part_pos.x + berserk_arena_pos.x,  // the central area is pushed on the east by the west room, so we need to take that into acount to find it's real position (FIXME)
            y: central_part_pos.y + berserk_arena_pos.y
        },
        width: berserk_arena.width + 2,
        height: berserk_arena.height + 2,
    });
    level_desc.entities.push(...populate_entities(world_so_far, central_area, [ berserk_arena_area ], start_items));

    const world_desc = random_variation(level_desc);
    const world = deserialize_world(world_desc);

    // Fill crypto-files which are empty with nice items.
    function* item_selector(){
        const rare_items = [ // These items should allow defending and "attacks".
            { type: "Item_DataBender" },
            { type: "Item_Shift" },
            { type: "Item_ForceWave" },
            { type: "Item_BlockMaster" },
            { type: "Item_CriticalSection" },
            { type: "Item_Destructor" },
            { type: "Item_Freeze" },
            { type: "Item_PushCardinal" },
            { type: "Item_OctopusArms" },
            { type: "Item_Extension" },
        ];
        rare_items.push(random_sample([ // Add one or the other.
            { type: "Item_InvokeAntiVirus" },
            { type: "Item_InvokeVirus" }
        ]));

        const nice_boost_items = [
            { type: "Item_IntegrityBoost" },
            { type: "Item_FrequencyBoost" },
            { type: "Item_Scanner" },
            { type: "Item_ThreadPool" },
            { type: "Item_Zip" },
            { type: "Item_FreeJump" },
            { type: "Item_Crawl" },
        ];

        // Alternate between rare items and nice boosts.
        while(true){
            if(rare_items.length > 0)
                yield random_bag_pick(rare_items);
            yield random_bag_pick(nice_boost_items);
            yield random_bag_pick(nice_boost_items);
        }
    };
    const item_selection_generator = item_selector();

    world.items.filter(item => item instanceof items.CryptoFile  // Crypto-files...
                             && (!item.drops || item.drops.length == 0)) // ... that didn't already have dropes set.
        .forEach(cryptofile => {
            if(!cryptofile.drops) cryptofile.drops = [];
            const selected_item_defs = item_selection_generator.next().value;
            if(window.debug_tools_enabled)
                selected_item_defs.forEach(item_def => console.debug(`DROPABLE ITEM: ${item_def.type}`));

            const items = deserialize_entities(selected_item_defs);
            debug.assertion(()=>items.length === 1);
            cryptofile.drops.push(items[0]);
        });

    // Paint with the second ground tile around the exit, as a clue
    const exit_positions = world.grids[grid_ID.surface].matching_positions(tile_id => tile_id == tiles.ID.EXIT);
    debug.assertion(()=>exit_positions.length === 1);
    const exit_position = new Position(exit_positions[0]);
    const close_to_exit_range = new visibility.Range_Circle(0, 12);
    visibility.positions_in_range(exit_position, close_to_exit_range,
                                position => world.is_valid_position(position) && world.grids[grid_ID.floor].get_at(position) === defaults.floor)
        .forEach(position => {
            world.grids[grid_ID.floor].set_at(defaults.floor_alt, position);
        });

    world.level_id = 1;
    return world;
}