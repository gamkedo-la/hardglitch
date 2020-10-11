export {
    generate_world,
}

import * as tiles from "../definitions-tiles.js";
import { random_sample, shuffle_array } from "../system/utility.js";
import {
  ChunkGrid,
  deserialize_world,
  random_variation,
  unfold_chunk_grid,
  merge_world_chunks,
  add_padding_around,
  create_chunk,
} from "./level-tools.js";

const level_name = "Level 1: Buggy Program";

const defaults = {
    floor : tiles.ID.WALL1A,
};

const startup_rooms = {

    jump : {
        name: "Start Room: Jump",
        width: 8,
        height: 16,
        grids: {
          floor : [120,120,120,120,120,120,120,120,120,101,101,101,101,101,101,120,120,100,100,100,101,101,101,120,120,100,10,100,101,101,101,120,120,100,100,100,101,120,101,120,120,101,101,101,101,120,101,120,120,120,120,120,101,120,101,120,120,120,100,100,101,120,101,120,120,120,100,120,120,100,100,120,120,120,100,120,100,100,100,120,120,100,100,120,120,120,120,120,30,30,30,30,30,30,30,30,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, null],
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
          surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
          unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
        },
        entities: [
          { type: "LifeForm_Weak", position: { x: 7, y: 11 }, drops: [ "Item_Pull" ] },
          { type: "GlitchyGlitchMacGlitchy", position: { x: 2, y: 2 } },
          { type: "CryptoKey_Plus", position: { x: 7, y: 3 }, is_crucial: true, },
          { type: "MovableWall_Purple", position: { x: 4, y: 12 } },
          { type: "CryptoFile_Plus", position: { x: 4, y: 7 }, drops: [ "Item_Push" ], },
        ],
      },

    swap : {
      name: "Start Room: Swap",
      width: 10,
      height: 18,
      grids: {
        floor : [120,120,120,120,120,120,120,120,120,120,120,10,100,100,100,100,100,100,100,120,120,100,100,100,100,100,100,10,100,120,120,100,121,121,121,121,121,121,100,120,120,100,100,100,100,100,100,100,10,120,120,120,100,100,100,10,100,100,120,120,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,100,100,120,100,10,10,100,120,30,30,100,120,120,10,100,121,100,120,30,30,100,100,120,120,100,121,100,100,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,121,10,100,120,101,101,101,101,101,120,121,10,100,120,101,101,101,101,101,120,121,100,100,120,40,40,101,101,120,120,121,101,101,101,101,101,40,101,101,100,121,121,121,121,121,121,120,120,10,10],
        surface : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
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

const exit_rooms = [
  {
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
      { type: "MovableWall_Red", position: { x: 3, y: 4 } },
      { type: "MovableWall_Red", position: { x: 5, y: 4 } },
      { type: "MovableWall_Red", position: { x: 4, y: 5 } },
      { type: "MovableWall_Red", position: { x: 4, y: 3 } },
      { type: "MovableWall_Purple", position: { x: 2, y: 2 } },
      { type: "MovableWall_Purple", position: { x: 2, y: 3 } },
      { type: "MovableWall_Purple", position: { x: 2, y: 4 } },
      { type: "MovableWall_Purple", position: { x: 2, y: 5 } },
      { type: "MovableWall_Purple", position: { x: 2, y: 6 } },
      { type: "MovableWall_Purple", position: { x: 3, y: 6 } },
      { type: "MovableWall_Purple", position: { x: 4, y: 6 } },
      { type: "MovableWall_Purple", position: { x: 5, y: 6 } },
      { type: "MovableWall_Purple", position: { x: 6, y: 6 } },
      { type: "MovableWall_Purple", position: { x: 6, y: 5 } },
      { type: "MovableWall_Purple", position: { x: 6, y: 4 } },
      { type: "MovableWall_Purple", position: { x: 6, y: 3 } },
      { type: "MovableWall_Purple", position: { x: 6, y: 2 } },
      { type: "MovableWall_Purple", position: { x: 5, y: 2 } },
      { type: "MovableWall_Purple", position: { x: 4, y: 2 } },
      { type: "MovableWall_Purple", position: { x: 3, y: 2 } },
      { type: "MovableWall_Orange", position: { x: 1, y: 1 } },
      { type: "MovableWall_Orange", position: { x: 3, y: 1 } },
      { type: "MovableWall_Orange", position: { x: 5, y: 1 } },
      { type: "MovableWall_Orange", position: { x: 7, y: 1 } },
      { type: "MovableWall_Orange", position: { x: 7, y: 3 } },
      { type: "MovableWall_Orange", position: { x: 7, y: 5 } },
      { type: "MovableWall_Orange", position: { x: 7, y: 7 } },
      { type: "MovableWall_Orange", position: { x: 5, y: 7 } },
      { type: "MovableWall_Orange", position: { x: 3, y: 7 } },
      { type: "MovableWall_Orange", position: { x: 1, y: 7 } },
      { type: "MovableWall_Orange", position: { x: 1, y: 5 } },
      { type: "MovableWall_Orange", position: { x: 1, y: 3 } },
      { type: "MovableWall_Orange", position: { x: 1, y: 2 } },
      { type: "MovableWall_Orange", position: { x: 2, y: 1 } },
      { type: "MovableWall_Orange", position: { x: 4, y: 1 } },
      { type: "MovableWall_Orange", position: { x: 1, y: 4 } },
    ],
  }
];

window.startup_rooms = startup_rooms; // For debugging.
window.startup_rooms = exit_rooms; // For debugging.

function random_empty_2x2_floor(surface_id, wall_id){

  const basic_chunks = {
    oooo: new ChunkGrid({
      width: 1, height: 1, // These are number of chunks
      chunk_width: 2, chunk_height: 2,
      chunks: [
              create_chunk(2, 2, { floor: [
                surface_id,   surface_id,
                surface_id,   surface_id,
              ]}),
          ],
      random_variation: true,
    }),
    xooo: new ChunkGrid({
        width: 1, height: 1, // These are number of chunks
        chunk_width: 2, chunk_height: 2,
        chunks: [
                create_chunk(2, 2, { floor: [
                    wall_id,   surface_id,
                    surface_id,   surface_id,
                ]}),
            ],
        random_variation: true,
    }),
    xxoo: new ChunkGrid({
      width: 1, height: 1, // These are number of chunks
      chunk_width: 2, chunk_height: 2,
      chunks: [
              create_chunk(2, 2, { floor: [
                  wall_id,   wall_id,
                  surface_id,   surface_id,
              ]}),
          ],
      random_variation: true,
    }),
    xxxo: new ChunkGrid({
      width: 1, height: 1, // These are number of chunks
      chunk_width: 2, chunk_height: 2,
      chunks: [
              create_chunk(2, 2, { floor: [
                  wall_id,   wall_id,
                  wall_id,   surface_id,
              ]}),
          ],
      random_variation: true,
    }),
    xxxx: new ChunkGrid({
      width: 1, height: 1, // These are number of chunks
      chunk_width: 2, chunk_height: 2,
      chunks: [
              create_chunk(2, 2, { floor: [
                  wall_id,   wall_id,
                  wall_id,   wall_id,
              ]}),
          ],
      random_variation: true,
    }),
  }

  return random_sample([ // This table is basically a probability table.
    basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo, basic_chunks.oooo,
    basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo, basic_chunks.xooo,
    basic_chunks.xxoo, basic_chunks.xxoo, basic_chunks.xxxo, basic_chunks.xxxx,
  ]);
}

function subchunks_2x2(){
  return random_sample([
      random_empty_2x2_floor(tiles.ID.LVL1A, tiles.ID.WALL1A),
      random_empty_2x2_floor(tiles.ID.LVL1A, tiles.ID.WALL1B),
      random_empty_2x2_floor(tiles.ID.LVL1B, tiles.ID.WALL1A),
      random_empty_2x2_floor(tiles.ID.LVL1B, tiles.ID.WALL1B),
  ]);
}


function subchunk_4x4(){
  return new ChunkGrid({
      width: 2, height: 2,
      chunk_width: 2, chunk_height: 2,
      chunks: [
          subchunks_2x2, subchunks_2x2,
          subchunks_2x2, subchunks_2x2
      ],
  });
}


function subchunk_8x8(){
  return new ChunkGrid({
      width: 2, height: 2,
      chunk_width: 4, chunk_height: 4,
      chunks: [
          subchunk_4x4, subchunk_4x4,
          subchunk_4x4, subchunk_4x4
      ],
  });
}

function* subchunk_8x8_maybe_exit(exit_room){
  const chunk_bag = [
    exit_room, subchunk_8x8, subchunk_8x8, subchunk_8x8,subchunk_8x8, subchunk_8x8,subchunk_8x8, subchunk_8x8,
  ];
  shuffle_array(chunk_bag);
  while(chunk_bag.length > 0){
    yield chunk_bag.pop();
  }

  return subchunk_8x8;
}

function generate_world(){
    // LEVEL 1:
    // Buggy Program: https://trello.com/c/wEnOf3hQ/74-level-1-buggy-program
    //

    const starting_room = random_sample(Object.values(startup_rooms));
    const exit_room = random_sample(Object.values(exit_rooms));

    const subchunk_or_exit = subchunk_8x8_maybe_exit(exit_room);

    const level_central_chunks = new ChunkGrid({
      width: 4, height: 4, // These are number of chunks
      chunk_width: 8, chunk_height: 8,
      default_grid_values: { floor: tiles.ID.WALL1A },
      chunks: [
        subchunk_8x8, subchunk_8x8, subchunk_8x8, subchunk_8x8,
        subchunk_8x8, subchunk_8x8, subchunk_8x8, subchunk_8x8,
        subchunk_or_exit, subchunk_or_exit, subchunk_or_exit, subchunk_or_exit,
        subchunk_or_exit, subchunk_or_exit, subchunk_or_exit, subchunk_or_exit,
      ],
    });

    const central_part = unfold_chunk_grid("level center", level_central_chunks);
    // return deserialize_world(central_part);
    const merged_level = merge_world_chunks(level_name, defaults,
      { position:{ x:0,   y:17  }, world_desc: central_part, },
      { position:{ x:8,   y:0  }, world_desc: starting_room, }, // after the center to overwrite it.
    );
    const level_desc = add_padding_around(merged_level,  { floor: tiles.ID.WALL1A } );
    return deserialize_world(random_variation(level_desc));
}