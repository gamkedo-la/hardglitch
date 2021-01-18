export {
    generate_world,
}

import * as debug from "../system/debug.js";
import * as tiles from "../definitions-tiles.js";
import { not, random_bag_pick, random_int, random_sample, shuffle_array } from "../system/utility.js";
import {
    ChunkGrid,
    deserialize_world,
    deserialize_entities,
    random_variation,
    unfold_chunk_grid,
    merge_world_chunks,
    add_padding_around,
    create_chunk,
    serialize_world,
} from "./level-tools.js";
import { Position, World } from "../core/concepts.js";
import { Rectangle } from "../system/spatial.js";
import { is_blocked_position } from "../definitions-world.js";

const level_name = "Level 0: Buggy Program";

const defaults = {
    ground : tiles.ID.LVL1A,
    ground_alt: tiles.ID.LVL1B,
    wall : tiles.ID.WALL1A,
    wall_alt : tiles.ID.WALL1B,
};

const startup_rooms = {

    jump: {
        name: "Start Room: Jump",
        width: 8,
        height: 18,
        grids: {
            floor : [120,120,120,120,120,120,120,120,120,100,100,100,100,100,100,120,120,100,100,100,100,100,100,120,120,100,100,100,100,100,100,120,120,100,100,100,100,120,100,120,120,100,100,100,100,120,100,120,120,120,120,120,100,120,100,120,120,120,100,100,100,120,100,120,120,120,100,120,120,100,100,120,120,120,100,120,100,100,100,120,120,100,100,120,120,120,120,120,120,40,40,40,40,40,40,120,120,40,40,40,40,40,40,120,120,40,100,100,30,30,120,120,120,40,30,30,30,30,30,120,120,30,30,120,120,30,30,120,120,120,120,100,30,30,100,120,100,100,100,100,30,30,120,120],
            surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
            corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
            unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
            { type: "GlitchyGlitchMacGlitchy", position: { x: 2, y: 3 } },
            { type: "LifeForm_Weak", position: { x: 6, y: 6 } },
            { type: "CryptoFile_Triangle", position: { x: 2, y: 7 }, drops: ["Item_Jump"] },
            { type: "CryptoKey_Triangle", position: { x: 5, y: 8 }, is_crucial: true, },
        ],
    },

    push_pull: {
        name: "Start Room: Push & Pull",
        width: 10,
        height: 18,
        grids: {
            floor: [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 100, 10, 10, 100, 100, 100, 100, 100, 120, 120, 10, 10, 10, 100, 100, 120, 120, 100, 120, 120, 100, 10, 100, 100, 100, 120, 100, 100, 120, 120, 100, 100, 100, 120, 10, 10, 120, 100, 120, 120, 100, 120, 120, 120, 10, 10, 10, 10, 120, 120, 100, 100, 100, 100, 100, 100, 100, 100, 120, 120, 100, 100, 100, 10, 121, 121, 121, 100, 120, 121, 121, 121, 121, 10, 121, 100, 100, 100, 120, 121, 121, 121, 121, 10, 121, 10, 120, 120, 120, 121, 121, 121, 121, 10, 121, 100, 100, 100, 120, 121, 121, 121, 121, 10, 121, 100, 100, 100, 120, 120, 100, 10, 10, 10, 121, 30, 30, 30, 120, 120, 10, 121, 121, 121, 121, 30, 30, 30, 120, 120, 10, 121, 121, 30, 30, 30, 30, 30, 120, 10, 100, 10, 121, 10, 10, 30, 30, 30, 120, 100, 100, 100, 121, 10, 10, 10, 10, 30, 120, 100, 10, 10, 121, 121, 30, 30, 30, 30, 120],
            surface: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            corruption: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            unstable: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        },
        entities: [
            { type: "LifeForm_Weak", position: { x: 7, y: 11 }, drops: ["Item_Pull"] },
            { type: "GlitchyGlitchMacGlitchy", position: { x: 2, y: 2 } },
            { type: "CryptoKey_Triangle", position: { x: 7, y: 3 }, is_crucial: true, },
            { type: "MovableWall_Purple", position: { x: 4, y: 10 } },
            { type: "CryptoFile_Triangle", position: { x: 4, y: 7 }, drops: ["Item_Push"], },
        ],
    },

    swap: {
        name: "Start Room: Swap",
        width: 10,
        height: 18,
        grids: {
            floor: [120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 10, 100, 100, 100, 100, 100, 100, 100, 120, 120, 100, 100, 100, 100, 100, 100, 10, 100, 120, 120, 100, 121, 121, 121, 121, 121, 121, 100, 120, 120, 100, 100, 100, 100, 100, 100, 100, 10, 120, 120, 120, 100, 100, 100, 10, 100, 100, 120, 120, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 100, 100, 120, 100, 10, 10, 100, 120, 30, 30, 100, 120, 120, 10, 100, 121, 100, 120, 30, 30, 100, 100, 120, 120, 100, 121, 100, 100, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 121, 10, 100, 120, 101, 101, 101, 101, 101, 120, 121, 10, 100, 120, 101, 101, 101, 101, 101, 120, 121, 100, 100, 120, 40, 40, 101, 101, 120, 120, 121, 101, 101, 101, 101, 101, 40, 101, 101, 100, 121, 121, 121, 121, 121, 121, 120, 120, 10, 10],
            surface: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            corruption: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            unstable: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        },
        entities: [
            { type: "LifeForm_Weak", position: { x: 5, y: 5 } },
            { type: "GlitchyGlitchMacGlitchy", position: { x: 5, y: 9 } },
            { type: "LifeForm_Weak", position: { x: 5, y: 1 } },
            { type: "CryptoFile_Triangle", position: { x: 8, y: 16 } },
            { type: "CryptoKey_Triangle", position: { x: 4, y: 2 }, is_crucial: true, },
            { type: "MovableWall_Purple", position: { x: 2, y: 8 } },
            { type: "MovableWall_Green", position: { x: 1, y: 13 } },
            { type: "MovableWall_Orange", position: { x: 2, y: 13 } },
            { type: "MovableWall_Green", position: { x: 5, y: 13 } },
            { type: "MovableWall_Green", position: { x: 7, y: 13 } },
            { type: "MovableWall_Blue", position: { x: 4, y: 13 } },
            { type: "MovableWall_Blue", position: { x: 6, y: 13 } },
            { type: "MovableWall_Blue", position: { x: 8, y: 13 } },
            { type: "MovableWall_Red", position: { x: 1, y: 3 } },
            { type: "MovableWall_Red", position: { x: 8, y: 3 } },
            { type: "Item_Swap", position: { x: 7, y: 10 } },
            { type: "MovableWall_Purple", position: { x: 4, y: 14 } },
            { type: "MovableWall_Purple", position: { x: 6, y: 15 } },
            { type: "MovableWall_Red", position: { x: 5, y: 14 } },
        ],
    },

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

const level1_special_rooms = {
    room_plus_file: {
        name: "room plus file",
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
    room_equal_file: {
        name: "room equal file",
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
      }
}


window.startup_rooms = startup_rooms; // For debugging.
window.exit_rooms = exit_rooms; // For debugging.
window.level1_special_rooms = level1_special_rooms; // For debugging.

const starting_items = [ "Item_Push", "Item_Pull",  "Item_Swap", "Item_Jump"];

function predicate_entity_spawn_pos(world){
    debug.assertion(()=> world instanceof World);
    return position => not(is_blocked_position)(world, position, tiles.is_walkable);
}

function random_available_entity_position(world, area, predicate = predicate_entity_spawn_pos(world)){
    debug.assertion(()=> world instanceof World);
    debug.assertion(()=> area instanceof Rectangle);
    debug.assertion(()=> predicate instanceof Function);

    while(true){
        const x = random_int(area.top_left.x, area.bottom_right.x - 1);
        const y = random_int(area.top_left.y, area.bottom_right.y - 1);
        if(predicate({x, y})){
            return new Position({x, y});
        }
    }
}

function populate_entities(world, central_area_rect, start_items){
    debug.assertion(()=> world instanceof World);
    debug.assertion(()=> central_area_rect instanceof Rectangle);
    debug.assertion(()=>start_items instanceof Array);

    const entities = [];
    const add_entities_from_desc = (...entities_descs)=>{ // FIXME: THIS IS A HACK TO KEEP THE WORLD AND DESCS IN SYNC ;__;
        entities.push(...entities_descs);
        deserialize_entities(entities_descs).forEach(entity => world.add_entity(entity));
    };
    const is_spawn_position = predicate_entity_spawn_pos(world);
    const random_spawn_pos = (area = central_area_rect)=> random_available_entity_position(world, area);

    const bonus_bag = [
        { type: "Item_Scanner", position:{ x:0, y:0 } },
        { type: "Item_ThreadPool", position:{ x:0, y:0 } },
        { type: "Item_Zip", position:{ x:0, y:0 } },
    ];

    const entity_bag =  function*() {
        const bag = [
            { type: "LifeForm_Strong" },
            { type: "LifeForm_Strong" },
            { type: "LifeForm_Strong" },
            { type: "LifeForm_Weak" },
            { type: "LifeForm_Weak" },
            { type: "LifeForm_Weak" },
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
        crypto_areas.push(new Rectangle({
            position: central_area_rect.position,
            width: central_area_rect.width,
            height: Math.ceil(central_area_rect.height/2),
        }),
        new Rectangle({
            position: {
                x: central_area_rect.position.x,
                y: central_area_rect.position.y + Math.ceil(central_area_rect.height/2) + 1,
            },
            width: central_area_rect.width,
            height: Math.ceil(central_area_rect.height/2),
        }),);
    } else {
        crypto_areas.push(new Rectangle({
            position: central_area_rect.position,
            width: Math.ceil(central_area_rect.width/2),
            height: central_area_rect.height,
        }),
        new Rectangle({
            position: {
                x: central_area_rect.position.x + Math.ceil(central_area_rect.width/2) + 1,
                y: central_area_rect.position.y,
            },
            width: Math.ceil(central_area_rect.width/2),
            height: central_area_rect.height,
        }),);
    };
    const crypto_key_area = random_bag_pick(crypto_areas, 1)[0];
    const crypto_file_area = random_bag_pick(crypto_areas, 1)[0];
    debug.assertion(()=>crypto_key_area instanceof Rectangle);
    debug.assertion(()=>crypto_file_area instanceof Rectangle);
    add_entities_from_desc(
        { type: "CryptoFile_Circle", position: random_spawn_pos(crypto_file_area), drops: start_items },
        { type: "CryptoKey_Circle", position: random_spawn_pos(crypto_key_area) },
    );

    // 2: add some entities in the central area - some items in particular
    add_entities_from_desc(...bonus_bag.map(desc => { desc.position = random_spawn_pos(central_area_rect); return desc; }));
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
    const dangerous_foe_type = random_sample(["Microcode", "Virus"]);
    const dangerous_foe_pos = random_spawn_pos(dangerous_area);
    const dangerous_foe = { type: dangerous_foe_type, position: dangerous_foe_pos };
    add_entities_from_desc(dangerous_foe);
    add_entities_from_desc(...dangerous_foe_pos.adjacents_diags
                                .filter(is_spawn_position)
                                .map(position=> {
                                    return { type: "MovableWall_Purple", position };
                                })
                            );

    return entities;
}

function generate_world() {
    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //

    let start_items = [...starting_items];

    const starting_room_id = random_sample(Object.keys(startup_rooms));
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
            random_empty_2x2_floor(defaults.ground, defaults.wall),
            random_empty_2x2_floor(defaults.ground, defaults.wall_alt),
            random_empty_2x2_floor(defaults.ground, tiles.ID.VOID),
            random_empty_2x2_floor(defaults.ground, tiles.ID.HOLE),
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


    const starting_room = startup_rooms[starting_room_id];
    const exit_room = random_variation(random_sample(Object.values(exit_rooms)));


    const level_central_chunks = new ChunkGrid({
        width: 3, height: 4, // These are number of chunks
        chunk_width: 8, chunk_height: 8,
        default_grid_values: { floor: tiles.ID.WALL1A },
        chunks: [
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
        ],
    });

    const central_chunk_width = level_central_chunks.width * level_central_chunks.chunk_width;
    const central_chunk_height = level_central_chunks.height * level_central_chunks.chunk_height;

    const start_left = random_int(0, central_chunk_width - starting_room.width);
    const start_top = 0;

    const central_part_pos = { x: 0, y: 18 };
    const central_part = unfold_chunk_grid("level center", level_central_chunks);
    const level_with_starting_room = merge_world_chunks(level_name, { floor: tiles.ID.WALL1A },
        { position: central_part_pos, world_desc: central_part, },
        { position: { x: start_left, y: start_top }, world_desc: starting_room, },
    );

    const exit_left = random_int(0, level_with_starting_room.width - exit_room.width);
    const exit_top = level_with_starting_room.height - random_int(0, 4);
    const level_with_exit_room = merge_world_chunks(level_name, { floor: tiles.ID.WALL1A },
        { position: { x: 0, y: 0 }, world_desc: level_with_starting_room, },
        { position: { x: exit_left, y: exit_top }, world_desc: exit_room, },
    );

    const [special_room_east, special_room_west] = random_bag_pick(Object.values(level1_special_rooms), 2).map(random_variation);
    debug.assertion(()=>special_room_east && special_room_west);
    const west_room = {
        world_desc: special_room_west,
        position: {
            x: random_int(0, 4),
            y: starting_room.height + random_int(-4, central_chunk_height - special_room_east.height - 4)
        }
    };
    const east_room = {
        world_desc: special_room_east,
        position: {
            x: special_room_west.width + central_chunk_width - random_int(0, 4),
            y: starting_room.height + random_int(-4, central_chunk_height - special_room_east.height - 4)
        }
    };
    const level_with_special_rooms = merge_world_chunks(level_name, { floor: tiles.ID.WALL1A },
        { position: { x: special_room_west.width, y: 0 }, world_desc: level_with_exit_room, },
        east_room, west_room,
    );

    const level_desc = add_padding_around(level_with_special_rooms, { floor: tiles.ID.WALL1A });
    const world_so_far = deserialize_world(level_desc);

    const central_area = new Rectangle({
        position: central_part_pos,
        width: central_part.width,
        height: central_part.height
    });
    level_desc.entities.push(...populate_entities(world_so_far, central_area, start_items));

    const world_desc = random_variation(level_desc);
    const world = deserialize_world(world_desc);

    return world;
}