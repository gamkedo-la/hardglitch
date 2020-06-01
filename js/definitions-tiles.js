// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export {
    ID, defs, tile_sprite_defs as sprite_defs,
    is_walkable,
}

import { sprite_defs } from "./game-assets.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    WALL: 20,
};


// Tile Types Descritions:
const defs = {
    [ID.GROUND] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        // TODO: add other information here
    },
    [ID.WALL] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
    },
    [ID.ENTRY] : {
        sprite_def: sprite_defs.entry,
        is_walkable: true,
        // TODO: add other information here
    },
    [ID.EXIT] : {
        sprite_def: sprite_defs.exit,
        is_walkable: true,
    },
};



// All the tile sprites definitions (as described by tiles definitions).
const tile_sprite_defs = {};
for(const tile_id of Object.values(ID)){
    tile_sprite_defs[tile_id] = defs[tile_id].sprite_def;
}


function is_walkable(tile_id){
    console.assert(tile_id);
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_walkable;
}