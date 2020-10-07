export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { random_sample } from "../system/utility.js";
import {
    deserialize_world,
    random_variation,
} from "./level-tools.js";

const defaults = {
    ground : tiles.ID.LVL1A,
    ground_alt: tiles.ID.LVL1B,
    wall : tiles.ID.WALL1A,
    wall_alt : tiles.ID.WALL1B,
};

const startup_rooms = {
    jump : {
        name: "Start Room: Jump",
        width: 8,
        height: 16,
        grids: {
          floor : [120,120,120,120,120,120,120,120,120,101,101,101,101,101,101,120,120,100,100,100,101,101,101,120,120,100,10,100,101,101,101,120,120,100,100,100,101,120,101,120,120,101,101,101,101,120,101,120,120,120,120,120,101,120,101,120,120,120,100,100,101,120,101,120,120,120,100,120,120,100,100,120,120,120,100,120,100,100,100,120,120,100,100,120,120,120,120,120,30,30,30,30,30,30,30,30,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "GlitchyGlitchMacGlitchy", position: { x: 2, y: 3 } },
          { type: "LifeForm_Weak", position: { x: 6, y: 6 } },
          { type: "CryptoFile_Triangle", position: { x: 2, y: 7 }, drops: [ "Item_JumpOpCode" ] },
          { type: "CryptoKey_Triangle", position: { x: 5, y: 8 } },
        ],
      },
    push_pull : {
        name: "Start Room: Push & Pull",
        width: 10,
        height: 18,
        grids: {
          floor : [120,120,120,120,120,120,120,120,120,120,120,100,10,10,100,100,100,100,100,120,120,10,10,10,100,100,120,120,100,120,120,100,10,100,100,100,120,100,100,120,120,100,100,100,120,10,10,120,100,120,120,100,120,120,120,10,10,10,10,120,120,100,100,100,100,100,100,100,100,120,120,100,100,100,10,121,121,121,100,120,121,121,121,121,10,121,100,100,100,120,121,121,121,121,10,121,10,120,120,120,121,121,121,121,10,121,100,100,100,120,121,121,121,121,10,121,100,100,100,120,120,100,10,10,10,121,30,30,30,120,120,10,121,121,121,121,30,30,30,120,120,10,121,121,30,30,30,30,30,120,10,100,10,121,10,10,30,30,30,120,100,100,100,121,10,10,10,10,30,120,100,10,10,121,121,30,30,30,30,120],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1,null,null,null,null,null,null,null,null,null],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "LifeForm_Weak", position: { x: 7, y: 11 }, drops: [ "Item_Pull" ] },
          { type: "GlitchyGlitchMacGlitchy", position: { x: 2, y: 2 } },
          { type: "CryptoKey_Plus", position: { x: 7, y: 3 } },
          { type: "MovableWall_Purple", position: { x: 4, y: 12 } },
          { type: "CryptoFile_Plus", position: { x: 4, y: 7 }, drops: [ "Item_Push" ] },
        ],
      },
    swap : {
      name: "Start Room: Swap",
      width: 10,
      height: 18,
      grids: {
        floor : [120,120,120,120,120,120,120,120,120,120,120,10,100,100,100,100,100,100,100,120,120,100,100,100,100,100,100,10,100,120,120,100,121,121,121,121,121,121,100,120,120,100,100,100,100,100,100,100,10,120,120,120,100,100,100,10,100,100,120,120,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,100,100,120,100,10,10,100,120,30,30,100,120,120,10,100,121,100,120,30,30,100,100,120,120,100,121,100,100,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,121,10,100,120,101,101,101,101,101,120,121,10,100,120,101,101,101,101,101,120,121,100,100,120,40,40,101,101,120,120,121,101,101,101,101,101,40,101,101,100,121,121,121,121,121,121,120,120,10,10],
        surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,1],
        corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      },
      entities: [
        { type: "LifeForm_Weak", position: { x: 5, y: 5 } },
        { type: "GlitchyGlitchMacGlitchy", position: { x: 5, y: 9 } },
        { type: "LifeForm_Weak", position: { x: 5, y: 1 } },
        { type: "CryptoFile_Equal", position: { x: 8, y: 16 } },
        { type: "CryptoKey_Equal", position: { x: 4, y: 2 } },
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

window.startup_rooms = startup_rooms; // For debugging.

function generate_world(){
    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //


    const level_desc = random_sample(Object.values(startup_rooms));

    level_desc.name = "Level 1: Buggy Program";
    return deserialize_world(random_variation(level_desc));
}