export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { random_int, random_sample, shuffle_array } from "../system/utility.js";
import {
    ChunkGrid,
    deserialize_world,
    random_variation,
    unfold_chunk_grid,
    merge_world_chunks,
    add_padding_around,
    create_chunk,
} from "./level-tools.js";

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
            { type: "CryptoKey_Plus", position: { x: 7, y: 3 }, is_crucial: true, },
            { type: "MovableWall_Purple", position: { x: 4, y: 10 } },
            { type: "CryptoFile_Plus", position: { x: 4, y: 7 }, drops: ["Item_Push"], },
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
            { type: "CryptoFile_Equal", position: { x: 8, y: 16 } },
            { type: "CryptoKey_Equal", position: { x: 4, y: 2 }, is_crucial: true, },
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

window.startup_rooms = startup_rooms; // For debugging.
window.exit_rooms = exit_rooms; // For debugging.

const starting_items = [ "Item_Push", "Item_Pull",  "Item_Swap", "Item_Jump"];

function generate_world() {
    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //

    let special_items = [...starting_items];

    const starting_room_id = random_sample(Object.keys(startup_rooms));
    switch(starting_room_id){
        case "jump":
            special_items = special_items.filter(item_id => item_id != "Item_Jump");
            break;
        case "push_pull":
            special_items = special_items.filter(item_id => item_id != "Item_Push" && item_id != "Item_Pull");
            break;
        case "swap":
            special_items = special_items.filter(item_id => item_id != "Item_Swap");
            break;
    }


    const entity_bag =  function*() {
        const bag = [
            { type: "LifeForm_Strong", position: { x: 0, y: 0 }, },
            { type: "LifeForm_Strong", position: { x: 0, y: 0 }, },
            { type: "MovableWall_Purple", position: { x: 0, y: 0 }, },
            { type: "MovableWall_Purple", position: { x: 0, y: 0 }, },
            { type: "MovableWall_Red", position: { x: 0, y: 0 }, },
            { type: "MovableWall_Red", position: { x: 0, y: 0 }, },
            { type: "CryptoFile_Circle", position: { x: 0, y: 0 },
                drops: special_items
            },
            { type: "CryptoKey_Circle", position: { x: 0, y: 0 } },
            { type: "Item_Scanner", position:{ x:0, y:0 } },
            { type: "Item_ThreadPool", position:{ x:0, y:0 } },
            { type: "Item_Zip", position:{ x:0, y:0 } },
            { type: "Item_ClosedScope", position:{ x:0, y:0 } },
        ];
        shuffle_array(bag);
        while (bag.length > 0) {
            if (random_int(0, 100) > 90)
                yield bag.pop();
            else
                yield null;
        }
        while(true) yield null;
    };

    const entities_generator = entity_bag();

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
        entities: [
            random_sample([
                { type: "LifeForm_Strong", position: { x: 0, y: 0 }, },
                { type: "Item_BadCode", position:{ x:0, y:0 } },
                null,
                null,
                null,
            ]),
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
                entities: [entities_generator],
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
                entities: [entities_generator],
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
                entities: [entities_generator],
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
                entities: [entities_generator],
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
            basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo,
            basic_chunks.xxoo, basic_chunks.xxoo, basic_chunks.xxxo, basic_chunks.xxxx,
            basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
            basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo,
            basic_chunks.xxoo, basic_chunks.xxoo, basic_chunks.xxxo, basic_chunks.xxxx,
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
            random_empty_2x2_floor(defaults.ground_alt, defaults.wall),
            random_empty_2x2_floor(defaults.ground_alt, defaults.wall_alt),
            random_empty_2x2_floor(defaults.ground, tiles.ID.VOID),
            random_empty_2x2_floor(defaults.ground, tiles.ID.HOLE),
            random_empty_2x2_floor(defaults.ground_alt, tiles.ID.VOID),
            random_empty_2x2_floor(defaults.ground_alt, tiles.ID.HOLE),
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
        width: 3, height: 3, // These are number of chunks
        chunk_width: 8, chunk_height: 8,
        default_grid_values: { floor: tiles.ID.WALL1A },
        chunks: [
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
            subchunk_8x8,       subchunk_8x8,       subchunk_8x8,
        ],
    });

    const central_chunk_width = level_central_chunks.width * level_central_chunks.chunk_width;
    const central_chunk_height = level_central_chunks.height * level_central_chunks.chunk_height;

    const start_left = random_int(0, central_chunk_width - starting_room.width);
    const start_top = 0;

    const central_part = unfold_chunk_grid("level center", level_central_chunks);
    const level_with_starting_room = merge_world_chunks(level_name, { floor: tiles.ID.WALL1A },
        { position: { x: 0, y: 18 }, world_desc: central_part, },
        { position: { x: start_left, y: start_top }, world_desc: starting_room, },
    );

    const exit_left = random_int(-5, level_with_starting_room.width - exit_room.width + 5);
    const exit_top = level_with_starting_room.height - random_int(0, 4);
    const level_with_exit_room = merge_world_chunks(level_name, { floor: tiles.ID.WALL1A },
        { position: { x: 0, y: 0 }, world_desc: level_with_starting_room, },
        { position: { x: exit_left, y: exit_top }, world_desc: exit_room, },
    );


    const level_desc = add_padding_around(level_with_exit_room, { floor: tiles.ID.WALL1A });
    return deserialize_world(random_variation(level_desc));
}