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
    CALCFLOORWARM : 12,
    CALCFLOORCOOL : 13,
    MEMFLOORWARM : 14,
    MEMFLOORCOOL : 15,
    CPUFLOORWARM : 16,
    CPUFLOORCOOL : 17,
    WALL: 20,
    WALL2: 21,
    VOID: 30,
    HOLE: 40,

    STREAM_LEFT: 50,
    STREAM_RIGHT: 51,
    STREAM_UP: 52,
    STREAM_DOWN: 53,

    TYLVL1A : 100,
    TYLVL1B : 101,
    TYLVL2A : 102,
    TYLVL2B : 103,
    TYLVL3A : 104,
    TYLVL3B : 105,
    TYLVL4A : 106,
    TYLVL4B : 107,
    ASHLVL3B : 108,
    ASHLVL4A : 109,
    ASHLVL4B : 110,
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
        description: "Walkable Memory",
        is_ground: true,
        shape_template: "ground_template",
        tile_match_predicate: (v) => (v==ID.GROUND),
        tile_same_predicate: (v) => (v==ID.GROUND),
    },
    [ID.GROUND2] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Walkable Memory 2",
        is_ground: true,
        shape_template: "ground2_template",
        tile_match_predicate: (v) => (v==ID.GROUND2),
        tile_same_predicate: (v) => (v==ID.GROUND2),
    },
    [ID.CALCFLOORWARM] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Fresh Calculator Buffer",
        is_ground: true,
        shape_template: "lvl1warm_template",
        tile_match_predicate: (v) => (v==ID.CALCFLOORWARM),
        tile_same_predicate: (v) => (v==ID.CALCFLOORWARM),
    },
    [ID.CALCFLOORCOOL] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Stale Calculator Buffer",
        is_ground: true,
        shape_template: "lvl1cool_template",
        tile_match_predicate: (v) => (v==ID.CALCFLOORCOOL),
        tile_same_predicate: (v) => (v==ID.CALCFLOORCOOL),
    },

    [ID.MEMFLOORWARM] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Active Memory",
        is_ground: true,
        shape_template: "lvl2warm_template",
        tile_match_predicate: (v) => (v==ID.MEMFLOORWARM),
        tile_same_predicate: (v) => (v==ID.MEMFLOORWARM),
    },
    [ID.MEMFLOORCOOL] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Freed Memory",
        is_ground: true,
        shape_template: "lvl2cool_template",
        tile_match_predicate: (v) => (v==ID.MEMFLOORCOOL),
        tile_same_predicate: (v) => (v==ID.MEMFLOORCOOL),
    },

    [ID.CPUFLOORWARM] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "CPU Register",
        is_ground: true,
        shape_template: "lvl3warm_template",
        tile_match_predicate: (v) => (v==ID.CPUFLOORWARM),
        tile_same_predicate: (v) => (v==ID.CPUFLOORWARM),
    },
    [ID.CPUFLOORCOOL] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Cache",
        is_ground: true,
        shape_template: "lvl3cool_template",
        tile_match_predicate: (v) => (v==ID.CPUFLOORCOOL),
        tile_same_predicate: (v) => (v==ID.CPUFLOORCOOL),
    },

    [ID.WALL] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        description: "Wall Memory",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL),
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
    [ID.WALL2] : {
        sprite_def: sprite_defs.wall,
        is_walkable: false,
        is_view_blocking: true,
        description: "Test Wall",
        is_wall: true,
        shape_template: "wall_template",
        tile_match_predicate: (v) => (v==ID.WALL2),
        tile_same_predicate: (v) => (defs[v].is_wall),
        pwall: {
            width: 16,
            height: 32,
            colormap: {
                [sides.top]:    new Color(98,129,0,.75),
                [sides.bottom]: new Color(98,129,0,.75),
                [sides.fl]:     new Color(70,85,0,.75),
                [sides.front]:  new Color(49,60,0,.75),
                [sides.fr]:     new Color(36,45,0,.75),
                [sides.br]:     new Color(70,85,0,.25),
                [sides.back]:   new Color(49,60,0,.25),
                [sides.bl]:     new Color(36,45,0,.25),
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
        tile_match_predicate: (v) => (v==ID.HOLE),
        tile_same_predicate: (v) => (v==ID.HOLE),
        pwall: {
            width: 8,
            height: 15,
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
        tile_match_predicate: (v) => (v==ID.VOID),
        tile_same_predicate: (v) => (v==ID.VOID),
    },
    [ID.ENTRY] : {
        sprite_def: sprite_defs.entry,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Entry Bus",
        is_surface: true,
    },
    [ID.EXIT] : {
        sprite_def: sprite_defs.exit,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Exit Bus",
        is_surface: true,
    },

    [ID.STREAM_LEFT] : {
        sprite_def: sprite_defs.stream_left,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Stream Bus -> West",
        is_surface: true,
    },

    [ID.STREAM_RIGHT] : {
        sprite_def: sprite_defs.stream_right,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Stream Bus -> East",
        is_surface: true,
    },

    [ID.STREAM_UP] : {
        sprite_def: sprite_defs.stream_up,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Stream Bus -> North",
        is_surface: true,
    },

    [ID.STREAM_DOWN] : {
        sprite_def: sprite_defs.stream_down,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "Stream Bus -> South",
        is_surface: true,
    },

    [ID.TYLVL1A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL1A",
        is_ground: true,
        shape_template: "tylvl1a_template",
        tile_match_predicate: (v) => (v==ID.TYLVL1A),
        tile_same_predicate: (v) => (v==ID.TYLVL1A),
    },
    [ID.TYLVL1B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL1B",
        is_ground: true,
        shape_template: "tylvl1b_template",
        tile_match_predicate: (v) => (v==ID.TYLVL1B),
        tile_same_predicate: (v) => (v==ID.TYLVL1B),
    },

    [ID.TYLVL2A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL2A",
        is_ground: true,
        shape_template: "tylvl2a_template",
        tile_match_predicate: (v) => (v==ID.TYLVL2A),
        tile_same_predicate: (v) => (v==ID.TYLVL2A),
    },
    [ID.TYLVL2B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL2B",
        is_ground: true,
        shape_template: "tylvl2b_template",
        tile_match_predicate: (v) => (v==ID.TYLVL2B),
        tile_same_predicate: (v) => (v==ID.TYLVL2B),
    },

    [ID.TYLVL3A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL3A",
        is_ground: true,
        shape_template: "tylvl3a_template",
        tile_match_predicate: (v) => (v==ID.TYLVL3A),
        tile_same_predicate: (v) => (v==ID.TYLVL3A),
    },
    [ID.TYLVL3B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL3B",
        is_ground: true,
        shape_template: "tylvl3b_template",
        tile_match_predicate: (v) => (v==ID.TYLVL3B),
        tile_same_predicate: (v) => (v==ID.TYLVL3B),
    },

    [ID.TYLVL4A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL4A",
        is_ground: true,
        shape_template: "tylvl4a_template",
        tile_match_predicate: (v) => (v==ID.TYLVL4A),
        tile_same_predicate: (v) => (v==ID.TYLVL4A),
    },
    [ID.TYLVL4B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "TYLVL4B",
        is_ground: true,
        shape_template: "tylvl4b_template",
        tile_match_predicate: (v) => (v==ID.TYLVL4B),
        tile_same_predicate: (v) => (v==ID.TYLVL4B),
    },

    [ID.ASHLVL3B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "ASHLVL3B",
        is_ground: true,
        shape_template: "ashlvl3b_template",
        tile_match_predicate: (v) => (v==ID.ASHLVL3B),
        tile_same_predicate: (v) => (v==ID.ASHLVL3B),
    },

    [ID.ASHLVL4A] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "ASHLVL4A",
        is_ground: true,
        shape_template: "ashlvl4a_template",
        tile_match_predicate: (v) => (v==ID.ASHLVL4A),
        tile_same_predicate: (v) => (v==ID.ASHLVL4A),
    },
    [ID.ASHLVL4B] : {
        sprite_def: sprite_defs.ground,
        is_walkable: true,
        is_safe: true,
        is_view_blocking: false,
        description: "ASHLVL4B",
        is_ground: true,
        shape_template: "ashlvl4b_template",
        tile_match_predicate: (v) => (v==ID.ASHLVL4B),
        tile_same_predicate: (v) => (v==ID.ASHLVL4B),
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
