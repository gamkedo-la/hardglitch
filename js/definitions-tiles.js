// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export {
    ID, defs, tile_sprite_defs as sprite_defs,
    is_walkable,
}

import { sprite_defs, tile_id, tile_defs } from "./game-assets.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    WALL: 20,
    VOID: 30,
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
    [ID.VOID] : {
        sprite_def: sprite_defs.void,
        is_walkable: true,
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

/**
 * update ID/defs for tile definitions based on given level layer
 * @param {*} lvl - level to be associated w/ ID/defs (e.g.: "lvl1")
 * @param {*} layer  - layer to be associated w/ ID/defs update (e.g.: "fg"|"bg")
 */
function update_id_defs(lvl, layer) {
    for (const k of Object.keys(tile_defs)) {
        // add tile ID
        let id = tile_id(lvl, layer, k);
        ID[id] = id;
        // add def
        let def = {
            sprite_def: sprite_defs[id],
            is_walkable: false,
        }
        defs[id] = def;
    }
}
// update ID/defs for level 1 tiles
update_id_defs("lvl1", "fg");
update_id_defs("lvl1", "bg");


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