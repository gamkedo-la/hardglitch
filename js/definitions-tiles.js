// This file describe all the game elements in the game and how they are configured.
// These elements are used to build levels.

export {
    ID, defs, tile_sprite_defs as sprite_defs,
    is_walkable, is_safely_walkable, is_safe, is_blocking_view, info_text,
    floor_tiles, surface_tiles
}

import { sprite_defs } from "./game-assets.js";
import { sides } from "./view/wall-model.js";
import { Color } from "./system/color.js";

////////////////////////////////////////////////////////////////////////////////
// TILES DEFINITIONS

const ID = {
    ENTRY : 0,
    EXIT : 1,

    GROUND: 10,
    GROUND2: 11,
    WALL: 20,
    VOID: 30,
    HOLE: 40,
};

// NOTE: these are filled out by iterating through the definitions below.  if is_surface is included, the tile type is added to surface_tiles, otherwise to floor tiles
const floor_tiles = [];
const surface_tiles = [];

// Tile Types Descritions:
const defs = {
    [ID.GROUND] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Walkable ground.",
        is_ground: true,
        shape_template: "ground_template",
        tile_match_predicate: (v) => (v===ID.GROUND),
        tile_same_predicate: (v) => (defs[v].is_ground),
    },
    [ID.GROUND2] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Walkable ground 2.",
        is_ground: true,
        shape_template: "ground2_template",
        tile_match_predicate: (v) => (v===ID.GROUND2),
        tile_same_predicate: (v) => (defs[v].is_ground),
    },
    [ID.WALL] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        description: "Wall",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v===ID.WALL),
        tile_same_predicate: (v) => (defs[v].is_wall),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(98,129,189,.75),
                [sides.bottom]: new Color(98,129,189,.75),
                [sides.fl]:     new Color(70,85,175,.75),
                [sides.front]:  new Color(49,60,123,.75),
                [sides.fr]:     new Color(36,45,91,.75),
                [sides.br]:     new Color(70,85,175,.25),
                [sides.back]:   new Color(49,60,123,.25),
                [sides.bl]:     new Color(36,45,91,.25),
                [sides.hlm]:    new Color(0,222,164,.25),
                [sides.hlM]:    new Color(0,222,164,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },
    [ID.HOLE] : {
        sprite_def: sprite_defs.void,
        is_walkable: false,
        is_view_blocking: false,
        description: "Hole",
        shape_template: "hole_template",
        tile_match_predicate: (v) => (v===ID.HOLE),
        tile_same_predicate: (v) => (v===ID.HOLE),
        pwall: {
            width: 8,
            height: 16,
            faceMask: sides.inner,
            edgeMask: sides.inner|sides.top|sides.vertical|sides.bottom,
            colormap: {
                [sides.top]:    new Color(90,24,90,.3),
                [sides.bottom]: new Color(90,24,90,.3),
                [sides.fl]:     new Color(156,36,222,.2),
                [sides.front]:  new Color(156,36,222,.3),
                [sides.fr]:     new Color(156,36,222,.4),
                [sides.br]:     new Color(156,36,222,.2),
                [sides.back]:   new Color(156,36,222,.3),
                [sides.bl]:     new Color(156,36,222,.4),
                [sides.hlm]:    new Color(200,50,200,.25),
                [sides.hlM]:    new Color(200,50,200,.85),
            },
            highlights : {
                minor: true,
            }
        }
    },
    [ID.VOID] : {
        sprite_def: sprite_defs.void,
        is_walkable: true,
        is_safe: false,
        is_view_blocking: false,
        description: "Void",
        shape_template: "void_template",
        tile_match_predicate: (v) => (v===ID.VOID),
        tile_same_predicate: (v) => (v===ID.VOID),
    },
    [ID.ENTRY] : {
        sprite_def: sprite_defs.entry,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Entry",
        is_surface: true,
    },
    [ID.EXIT] : {
        sprite_def: sprite_defs.exit,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Exit",
        is_surface: true,
    },
};

for (const id of Object.values(ID)) {
    const def = defs[id];
    if (def.is_surface) {
        surface_tiles.push(id);
    } else {
        floor_tiles.push(id);
    }
}

// All the tile sprites definitions (as described by tiles definitions).
const tile_sprite_defs = {};
for(const tile_id of Object.values(ID)){
    tile_sprite_defs[tile_id] = defs[tile_id].sprite_def;
}


function is_safely_walkable(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_walkable && tile_def.is_safe;
}

function is_walkable(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_walkable;
}

function is_safe(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_safe;
}

function is_blocking_view(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.is_view_blocking;
}

function info_text(tile_id){
    const tile_def = defs[tile_id];
    console.assert(tile_def);
    return tile_def.description;
}
