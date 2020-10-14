export {
    generate_empty_world,
    serialize_world,
    deserialize_world,
    random_variation,
    merge_world_chunks,
    add_padding_around,

    ChunkGrid,
    unfold_chunk_grid,
    create_chunk,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules, is_valid_world, grid_ID, get_entity_type } from "../definitions-world.js";
import { Grid, merged_grids_size, merge_grids } from "../system/grid.js";
import { escaped, index_from_position, random_int, random_sample, copy_data, position_from_index, is_generator } from "../system/utility.js";
import { Corruption } from "../rules/rules-corruption.js";
import { Unstability } from "../rules/rules-unstability.js";
import { all_item_types } from "../definitions-items.js";

const default_defaults = {
    ground : tiles.ID.GROUND,
    ground_alt: tiles.ID.GROUND2,
    wall : tiles.ID.WALL,
    wall_alt : tiles.ID.WALL2,
};

const tileChoices = [
    tiles.ID.LVL1A,
    tiles.ID.LVL1B,
    tiles.ID.LVL2A,
    tiles.ID.LVL2B,
    tiles.ID.LVL3A,
    tiles.ID.LVL3B,
    tiles.ID.LVL4A,
    tiles.ID.LVL4B,
];

const wallChoices = [
    tiles.ID.WALL1A,
    tiles.ID.WALL1B,
    tiles.ID.WALL2A,
    tiles.ID.WALL2B,
    tiles.ID.WALL3A,
    tiles.ID.WALL3B,
    tiles.ID.WALL4A,
    tiles.ID.WALL4B,
];

class DefaultsGen {
    constructor() {}
    get ground() {
        return random_sample(tileChoices);
    }
    get ground_alt() {
        return tiles.ID.GROUND;
    }
    get wall() {
        return random_sample(wallChoices);
    }
    get wall_alt() {
        return tiles.ID.WALL2;
    }
}

const defaults_gen = new DefaultsGen();

function generate_empty_world(name, width, height, defaults = defaults_gen){

    const floor_tile_grid = new Grid(width, height).fill(defaults.ground);
    const surface_tile_grid = new Grid(width, height);
    const corruption_tile_grid = new Grid(width, height);
    const unstable_tile_grid = new Grid(width, height);
    surface_tile_grid.set_at(tiles.ID.ENTRY, {x: 0, y:0 });
    surface_tile_grid.set_at(tiles.ID.EXIT, { x: width - 1, y: height - 1 });

    const world = new concepts.World(`Test Level \"${name}\" ${width} x ${height}`,
                                    width, height,
                                    {
                                        [grid_ID.floor]:        floor_tile_grid,
                                        [grid_ID.surface]:      surface_tile_grid,
                                        [grid_ID.corruption]:   corruption_tile_grid,
                                        [grid_ID.unstable]:     unstable_tile_grid,
                                    });
    world.set_rules(...default_rules);
    return world;
}

// Generates a serialized version of the world, in a limited way.
// It does not keep the state of entities, but it keeps their types.
function serialize_world(world){
    console.assert(is_valid_world(world));

    let grids_serialized = "{";

    for(const [grid_id, grid] of Object.entries(world.grids)){
        grids_serialized += `\n    ${grid_id} : ${JSON.stringify(grid.elements)},`
    };
    grids_serialized += "\n  }";

    let entities_serialized = "[";
    world.entities.forEach(entity => {
        console.assert(entity instanceof concepts.Entity);
        entities_serialized += `\n    { type: "${entity.constructor.name}", position: { x: ${entity.position.x}, y: ${entity.position.y} } },`;
    });
    entities_serialized += "\n  ]";

    const world_serialized =
`{
  name: "${escaped(world.name)}",
  width: ${world.width},
  height: ${world.height},
  grids: ${grids_serialized},
  entities: ${entities_serialized},
}`;

    return world_serialized;
}

function is_entity_desc(desc){
    return desc instanceof Object
        && typeof desc.type === "string"
        && (desc.position === undefined || ( Number.isInteger(desc.position.x) && Number.isInteger(desc.position.y) ) )
        ;
}


function check_world_desc(world_desc){
    console.assert(world_desc instanceof Object);
    console.assert(typeof world_desc.name === "string");
    console.assert(Number.isInteger(world_desc.width) && world_desc.width > 1);
    console.assert(Number.isInteger(world_desc.height) && world_desc.height > 1);
    console.assert(world_desc.grids instanceof Object);
    console.assert(Object.keys(world_desc.grids).every(grid_id => grid_ID[grid_id] !== undefined));
    console.assert(Object.values(world_desc.grids).every(grid=> grid instanceof Array && grid.length === world_desc.width * world_desc.height));
    console.assert(world_desc.entities instanceof Array);
    console.assert(world_desc.entities.every(is_entity_desc));
    return true;
}

function deserialize_grid_elements(grid_id, grid_elements){
    switch(grid_id){
        case grid_ID.corruption:
            return grid_elements.map(value => value ? new Corruption(value) : null);
        case grid_ID.unstable:
            return grid_elements.map(value => value ? new Unstability(value) : null);
        default:
            return grid_elements;
    }
}

function deserialize_world(world_desc){
    check_world_desc(world_desc);

    const world = new concepts.World(world_desc.name, world_desc.width, world_desc.height, {});

    for(const [grid_id, grid_elements] of Object.entries(world_desc.grids)){
        const elements = deserialize_grid_elements(grid_id, grid_elements);
        const grid = new Grid(world_desc.width, world_desc.height, elements);
        world.add_grid(grid_id, grid);
    }

    for(const entity_desc of world_desc.entities){
        const entity_type = get_entity_type(entity_desc.type);
        const entity = new entity_type();
        console.assert(entity instanceof concepts.Entity);
        entity.position = entity_desc.position ? entity_desc.position : new concepts.Position();
        entity.is_crucial = entity_desc.is_crucial;
        if(entity_desc.drops){
            console.assert(entity_desc.drops instanceof Array);
            entity.drops = [];
            const drop_it = (drop_type_name) => {
                console.assert(typeof drop_type_name === "string");
                const drop_type = get_entity_type(drop_type_name);
                const drop = new drop_type();
                console.assert(drop instanceof concepts.Entity);
                entity.drops.push(drop);
            }
            entity_desc.drops.forEach(drop_type_name => {
                if(typeof drop_type_name === "string"){
                    drop_it(drop_type_name);
                } else {
                    console.assert(drop_type_name instanceof Array);
                    const drops = drop_type_name;
                    drops.forEach(drop_it);
                }
            });
        }
        world.add_entity(entity);
    }

    world.set_rules(...default_rules);

    console.assert(is_valid_world(world));
    return world;
}

// function reversed_world_desc(world_desc){
//     check_world_desc(world_desc);
//     const result = copy_data(world_desc);
//     result.width = world_desc.height;
//     result.height = world_desc.width;

//     for(const [grid_id, grid] of Object.entries(result.grids)){
//         result.grids[grid_id] = grid.reverse();
//     }

//     result.entities.forEach(entity => {
//         const x = entity.position.y;
//         const y = entity.position.x;
//         entity.position.x = x;
//         entity.position.y = y;
//     });

//     return result;
// }


function mirror_world_desc(world_desc, vertical_axe = true){
    check_world_desc(world_desc);
    const result = copy_data(world_desc);

    const mirrored_pos = vertical_axe ? (pos) => { return { x: result.width - 1 - pos.x, y: pos.y }; }
                                      : (pos) => { return { x: pos.x, y: result.height - 1 - pos.y }; }
                                      ;

    Object.values(result.grids).forEach(grid => {
        const initial_grid = new Array(...grid);
        for (let y = 0; y < result.height; y++) {
            for (let x = 0; x < result.width; x++) {
                const pos = {x, y};
                const source_idx = index_from_position(result.width, result.height, pos);
                const destination_idx = index_from_position(result.width, result.height, mirrored_pos(pos));
                grid[destination_idx] = initial_grid[source_idx];
            }
        }
    });

    result.entities.forEach(entity => {
        entity.position = mirrored_pos(entity.position);
    });

    return result;
}

function rotate_world_desc(world_desc, rotation_count=1){
    check_world_desc(world_desc);
    console.assert(Number.isInteger(rotation_count) && rotation_count >=0 );
    const rotated_world = copy_data(world_desc);


    while(rotation_count !== 0){
        const initial_width = rotated_world.width;
        const initial_height = rotated_world.height;
        const width = rotated_world.height;
        const height = rotated_world.width;
        const N = height - 1;
        rotated_world.width = width;
        rotated_world.height = height;

        const rotated_pos = (pos) => { return { x: pos.y, y: N - pos.x } };

        Object.values(rotated_world.grids).forEach(grid => {
            const initial_grid = new Array(...grid);
            for (let y = 0; y < initial_height; y++) {
                for (let x = 0; x < initial_width; x++) {
                    const pos = {x, y};
                    const source_idx = index_from_position(initial_width, initial_height, pos);
                    const destination_idx = index_from_position(width, height, rotated_pos(pos));
                    grid[destination_idx] = initial_grid[source_idx];
                }
            }
        });

        rotated_world.entities.forEach(entity => {
            entity.position = rotated_pos(entity.position);
        });

        --rotation_count;
    }

    return rotated_world;
}


function mirror_vertical_axe(world_desc) { return mirror_world_desc(world_desc, true); }
function mirror_horizontal_axe(world_desc){ return mirror_world_desc(world_desc, false); }

const world_variations = [
    // reversed_world_desc,
    rotate_world_desc,
    mirror_vertical_axe,
    mirror_horizontal_axe,
];

function random_variation(world_desc){
    check_world_desc(world_desc);
    let result_world = copy_data(world_desc);

    // console.log("++++++ World Variation BEGIN: ++++++");
    let variations_count = random_int(0, 5);
    while(variations_count > 0){
        const variation_func = random_sample(world_variations);
        result_world = variation_func(result_world);
        --variations_count;
        console.log(` - ${variation_func.name}`);
    }
    // console.log("++++++ World Variation END++++++");
    return result_world;
}

function merge_world_chunks(name, default_grids_values, ...position_world_chunks){
    console.assert(typeof name === "string");
    console.assert(default_grids_values instanceof Object);
    console.assert(position_world_chunks.every((pos_chunk)=> {
        const {position, world_desc} = pos_chunk;
        console.assert(position.x !== undefined);
        console.assert(position.y !== undefined);
        return check_world_desc(world_desc);
    }));

    const size = merged_grids_size(...position_world_chunks.map((pos_chunk)=> {
        return {
            position: { x: pos_chunk.position.x, y: pos_chunk.position.y },
            grid: new Grid(pos_chunk.world_desc.width, pos_chunk.world_desc.height, pos_chunk.world_desc.grids[grid_ID.floor]),
        };
    }));

    const width = size.width;
    const height = size.height;

    const world = { name, width, height,
                    grids: {},
                    entities: [],
                };

    Object.values(grid_ID).forEach(grid_id =>{
        const position_grids = position_world_chunks.map((pos_chunk)=> {
            const position = pos_chunk.position;
            const world_desc = pos_chunk.world_desc;
            console.assert(Number.isInteger(position.x));
            console.assert(Number.isInteger(position.y));
            check_world_desc(world_desc);
            return { position, grid: new Grid(world_desc.width, world_desc.height, world_desc.grids[grid_id]) };
        });
        const grid = merge_grids(...position_grids);
        console.assert(grid.width === width && grid.height === height);

        const default_value = default_grids_values[grid_id];
        if(default_value !== undefined){
            for(let idx = 0; idx < grid.elements.length; ++idx){
                if(grid.elements[idx] == undefined){
                    grid.elements[idx] = default_value;
                }
            }
        }

        world.grids[grid_id] = grid.elements;
    });

    const set_entity = (origin, entity) => {
        entity = copy_data(entity);
        //console.log(`set_entity(${JSON.stringify(origin)}, ${JSON.stringify(entity)})`);
        const new_position = { x: origin.x + entity.position.x, y: origin.y + entity.position.y };
        console.assert(new_position.x >= 0 && new_position.x < world.width);
        console.assert(new_position.y >= 0 && new_position.y < world.height);
        entity.position = new_position;
        // Overwrite previous entities at the same position:
        world.entities = world.entities.filter(existing_entity => !(entity.position.x === existing_entity.position.x
                                                                  && entity.position.y === existing_entity.position.y)
                                              );
        world.entities.push(entity);
    };

    position_world_chunks.forEach((pos_chunk)=>{
        pos_chunk.world_desc.entities.forEach(entity => {
            set_entity(pos_chunk.position, entity);
        });
    });

    return world;
}

function add_padding_around(world_desc, grid_borders_values){
    check_world_desc(world_desc);
    const bigger_world = {
        name: world_desc.name,
        width: world_desc.width + 2,
        height: world_desc.height + 2,
        grids: {},
        entities: [],
    };
    const grid_size = bigger_world.width * bigger_world.height;

    for(const grid_id of Object.keys(world_desc.grids)){
        const bigger_grid = new Array(grid_size).fill(grid_borders_values[grid_id]);
        bigger_world.grids[grid_id] = bigger_grid;
    }

    const result_world = merge_world_chunks(world_desc.name, {},
        {
            position: {x:0, y:0},
            world_desc: bigger_world,
        },
        {
            position: {x: 1, y: 1},
            world_desc: world_desc,
        }
    );
    return result_world;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// The following is for debug:
// window.reversed_world_desc = reversed_world_desc;
window.rotate_world_desc = rotate_world_desc;
window.mirror_world_desc = mirror_world_desc;
window.random_variation = random_variation;
window.merge_world_chunks = merge_world_chunks;
window.add_padding_around = add_padding_around;

window.level_initial = {
    name: "level_initial",
    width: 8,
    height: 8,
    grids: {
      floor : [12,12,12,12,15,15,15,15,12,12,12,12,12,12,12,15,12,12,12,12,12,12,12,15,12,12,12,12,12,12,12,15,17,12,12,12,12,12,12,12,17,12,12,12,12,12,12,12,17,12,12,12,12,12,12,12,17,17,17,17,12,12,12,12],
      surface : [1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0],
      corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    },
    entities: [
    //   { type: "GlitchyGlitchMacGlitchy", position: { x: 3, y: 3 } },
      { type: "CryptoFile_Circle", position: { x: 7, y: 0 } },
    ],
  };

window.level_corridor = {
    name: "level_corridor",
    width: 2,
    height: 5,
    grids: {
        floor: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
        surface: [0, null, null, null, null, null, null, null, null, 1],
        corruption: [null, null, null, null, null, null, null, null, null, null],
        unstable: [null, null, null, null, null, null, null, null, null, null],
    },
    entities: [
        { type: "GlitchyGlitchMacGlitchy", position: { x: 0, y: 0 } },
    ],
};

window.level_x = {
    name: "level_x",
    width: 5,
    height: 8,
    grids: {
        floor: [12, 12, 12, 126, 126, 12, 12, 12, 126, 126, 12, 12, 12, 12, 126, 12, 12, 12, 12, 126, 107, 107, 12, 12, 12, 107, 107, 12, 12, 126, 107, 107, 12, 12, 12, 107, 107, 12, 12, 12],
        surface: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1],
        corruption: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        unstable: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    },
    entities: [
       // { type: "GlitchyGlitchMacGlitchy", position: { x: 1, y: 2 } },
        { type: "CryptoFile_Circle", position: { x: 3, y: 7 } },
        { type: "Debug_AugmentActionPoints", position: { x: 3, y: 2 } },
    ],
};

window.setup_test_levels = ()=>{
    window.level_east = rotate_world_desc(window.level_initial);
    window.level_east.name = "level_east";
    window.level_south = rotate_world_desc(window.level_east);
    window.level_south.name = "level_south";
    window.level_west = rotate_world_desc(window.level_south);
    window.level_west.name = "level_west";
    window.level_north = rotate_world_desc(window.level_west);
    window.level_north.name = "level_north";
    window.level_mirror_vertical_axe = mirror_world_desc(window.level_initial);
    window.level_mirror_horizontal_axe = mirror_world_desc(window.level_initial, false);

    window.merged_level = merge_world_chunks("Merged Land", { floor: tiles.ID.VOID },
        { position:{ x:8,   y:0  }, world_desc: window.level_initial    },
        { position:{ x:16,  y:8  }, world_desc: window.level_initial       },
        { position:{ x:8,   y:16 }, world_desc: window.level_initial      },
        { position:{ x:0,   y:8  }, world_desc: window.level_initial       },

        { position:{ x:0,  y:0  }, world_desc: window.level_x           },
        { position:{ x:8,  y:8  }, world_desc: window.level_x           },
        { position:{ x:16, y:16  }, world_desc: window.level_x           },

        { position:{ x:5,  y:28  }, world_desc: window.level_x          },
    );
    console.assert(window.merged_level.width === 24);
    console.assert(window.merged_level.height === 36);

    window.padded_level_initial = add_padding_around(level_initial, { floor: tiles.ID.VOID });

    window.level_unfolded = unfold_chunk_grid("kikoo", window.test_chunk_grid);
    window.padded_level_unfolded = add_padding_around(window.level_unfolded, window.test_chunk_grid.default_grid_values);

};


class ChunkGrid {
    constructor(desc){
        console.assert(Number.isInteger(desc.width) && desc.width > 0);
        console.assert(Number.isInteger(desc.height) && desc.height > 0);
        console.assert(Number.isInteger(desc.chunk_width) && desc.chunk_width > 0);
        console.assert(Number.isInteger(desc.chunk_height) && desc.chunk_height > 0);
        console.assert(desc.chunks instanceof Array);
        console.assert(desc.chunks.length === (desc.width * desc.height));
        console.assert(desc.entities instanceof Array || desc.entities === undefined);
        console.assert(desc.default_grid_values instanceof Object || desc.default_grid_values === undefined);
        this.width = desc.width;
        this.height = desc.height;
        this.chunk_width = desc.chunk_width;
        this.chunk_height = desc.chunk_height;
        this.default_grid_values = desc.default_grid_values ? desc.default_grid_values : {};
        this.chunks = desc.chunks;
        const grid_size = (this.chunk_width * this.width) * (this.chunk_height* this.height);
        this.entities = desc.entities;
        console.assert(this.entities === undefined || (this.entities instanceof Array &&this.entities.length <= grid_size));
        this.random_variation = desc.random_variation ? true : false;
        this.random_entities_position = desc.random_entities_position ? true : false;
    }
}


function create_chunk(width, height, default_grid_values, entities = []){
    const chunk = {
        name: "", width, height,
        entities: entities,
        grids: {},
    };
    for(const grid_id of Object.values(grid_ID)){
        let grid = new Array(width * height);

        const value = default_grid_values[grid_id];

        if(is_generator(value)){
            grid.forEach((_, idx)=>{
                grid[idx] = value.next().value; // Use the last value if the generator is done.
            });
        } else if(value instanceof Function){
            grid.forEach((_, idx)=>{
                grid[idx] = value();
            });
        } else if(value instanceof Array){
            console.assert(value.length === grid.length);
            grid = value;
        } else{
            grid.fill(value);
        }

        chunk.grids[grid_id] = grid;
    }
    return chunk;
}

function unfold_chunk_grid(name, chunk_grid){
    console.assert(typeof name === "string");
    console.assert(chunk_grid instanceof ChunkGrid);

    const world_chunks = [];

    const unfold_chunk = (chunk, grid_pos)=>{
        console.assert(chunk !== undefined || chunk === null);
        if(chunk instanceof Object){
            if(is_generator(chunk)){
                const generated_value = chunk.next().value; // If the generator is done, use the last value.
                return unfold_chunk(generated_value, grid_pos);// Recursively unfold generated grids...
            }
            if(chunk instanceof Function){
                const value = chunk();
                return unfold_chunk(value, grid_pos);
            }

            if(chunk instanceof ChunkGrid){
                chunk = unfold_chunk_grid(name, chunk); // Recursively unfold grids...
            }
            console.assert(check_world_desc(chunk));
            return {
                position: grid_pos,
                world_desc: chunk,
            };

        } else if(Number.isInteger(chunk)){ // Integers are floor "tiles"
            return {
                position: grid_pos,
                world_desc: create_chunk(chunk_grid.chunk_width, chunk_grid.chunk_height, { floor: chunk }),
            };
        } else if(chunk === null){
            return {
                position: grid_pos,
                world_desc: create_chunk(chunk_grid.chunk_width, chunk_grid.chunk_height, chunk_grid.default_grid_values),
            };
        }

        throw new Error(`Incorrect chunk grid! : \n${JSON.stringify(chunk_grid)}`);
    }

    const unfold_entity = (entity)=>{
        if(is_entity_desc(entity)){
            return entity;
        }
        if(is_generator(entity)){
            entity = entity.next().value;
            return unfold_entity(entity);
        }
        if(entity instanceof Function){
            return unfold_entity(entity());
        }
        if(entity === null || entity === undefined){
            return undefined;
        }
        throw new Error(`Invalid chunk entities! : \n${JSON.stringify(chunk_grid)}`);
    };

    const random_pos = (world_desc) => {
        const max_fails = 128; // arbitrary
        let fail_count = 0;
        while(true){
            const new_pos = new concepts.Position({
                x: random_int(0, world_desc.width - 1),
                y: random_int(0, world_desc.height - 1),
            });
            const pos_idx = index_from_position(world_desc.width, world_desc.height, new_pos);
            const floor_tile = world_desc.grids[grid_ID.floor][pos_idx];
            console.assert(Number.isInteger(floor_tile));
            if(tiles.is_walkable(floor_tile) && world_desc.entities.every(entity=> !entity.position.equals(new_pos)))
                return new_pos;

            ++fail_count;
            if(fail_count > max_fails)
                throw new Error("Failed to find a random pos to put an entity in");
        }
    };

    for(let chunk_idx = 0; chunk_idx < chunk_grid.chunks.length; ++chunk_idx){
        const chunk = chunk_grid.chunks[chunk_idx];
        const entities = chunk_grid.entities;
        console.assert(entities instanceof Array || entities === undefined);

        const chunk_pos = position_from_index(chunk_grid.width, chunk_grid.height, chunk_idx);
        const grid_pos = { x: chunk_pos.x * chunk_grid.chunk_width, y: chunk_pos.y * chunk_grid.chunk_height };

        const world_chunk = unfold_chunk(chunk, grid_pos);

        if(entities){
            entities.forEach((entity, idx) => {
                entity = unfold_entity(entity);
                if(entity){
                    console.assert(is_entity_desc(entity));
                    const position = chunk_grid.random_entities_position ? random_pos(world_chunk.world_desc)
                                        : position_from_index(world_chunk.world_desc.width, world_chunk.world_desc.height, idx);
                    entity.position = position;
                    world_chunk.world_desc.entities.push(entity);
                }
            });
        }

        world_chunks.push(world_chunk);
    }

    const merged_world = merge_world_chunks(name, chunk_grid.default_grid_values, ...world_chunks);
    if(chunk_grid.random_variation){
        const world_variation = random_variation(merged_world);
        return world_variation;
    } else {
        return merged_world;
    }
}


function random_floor(){
    return random_sample(Object.values(tiles.ID));
}

window.test_sub_chunk = new ChunkGrid({
    width: 2, height: 2, // These are number of chunks
    chunk_width: 4, chunk_height: 4,
    chunks: [
        random_floor,   random_floor,
        random_floor,   random_floor,
    ],
    random_variation: true,
});


function* wall_sequence(){
    while(true){
        yield tiles.ID.WALL;
        yield tiles.ID.WALL1A;
        yield tiles.ID.WALL2A;
        yield tiles.ID.WALL3A;
        yield tiles.ID.WALL4A;
    }
}

function random_item(){
    return random_sample(all_item_types().map((item_type)=> {
        return { type: item_type.name };
    }));
}

function* monster_bag(){
    yield { type: "LifeForm_Weak" };
    yield { type: "LifeForm_Strong" };
    yield { type: "Virus" };
    return null; // Nothing else.
}

const test_monsters = monster_bag();

function subchunks_2x2(){
    return random_sample([
        new ChunkGrid({
            width: 1, height: 1, // These are number of chunks
            chunk_width: 2, chunk_height: 2,
            chunks: [
                    create_chunk(2, 2, { floor: [
                        tiles.ID.WALL4A,   tiles.ID.LVL2A,
                        tiles.ID.LVL3A,   tiles.ID.LVL4A,
                    ]}),
                ]
        }),
        new ChunkGrid({
            width: 1, height: 1, // These are number of chunks
            chunk_width: 2, chunk_height: 2,
            chunks: [
                    create_chunk(2, 2, { floor: [
                        tiles.ID.LVL1A,   tiles.ID.WALL4A,
                        tiles.ID.LVL3A,   tiles.ID.LVL4A,
                    ]}),
                ]
        }),
        new ChunkGrid({
            width: 1, height: 1, // These are number of chunks
            chunk_width: 2, chunk_height: 2,
            chunks: [
                    create_chunk(2, 2, { floor: [
                        tiles.ID.LVL1A,   tiles.ID.LVL2A,
                        tiles.ID.WALL4A,   tiles.ID.LVL4A,
                    ]}),
                ]
        }),
        new ChunkGrid({
            width: 1, height: 1, // These are number of chunks
            chunk_width: 2, chunk_height: 2,
            chunks: [
                    create_chunk(2, 2, { floor: [
                        tiles.ID.LVL1A,   tiles.ID.LVL2A,
                        tiles.ID.LVL3A,   tiles.ID.WALL4A,
                    ]}),
                ]
        }),
        new ChunkGrid({
            width: 1, height: 1, // These are number of chunks
            chunk_width: 2, chunk_height: 2,
            chunks: [
                    create_chunk(2, 2, { floor: [
                        tiles.ID.MEMFLOORWARM,   tiles.ID.MEMFLOORWARM,
                        tiles.ID.MEMFLOORWARM,   tiles.ID.MEMFLOORWARM,
                    ]}),
                ],
            entities: [ test_monsters ],
            random_variation: true,
            random_entities_position: true,
        }),
        new ChunkGrid({
            width: 1, height: 1, // These are number of chunks
            chunk_width: 2, chunk_height: 2,
            chunks: [
                    create_chunk(2, 2, { floor: [
                        tiles.ID.GROUND2,   tiles.ID.GROUND2,
                        tiles.ID.GROUND2,   tiles.ID.GROUND2,
                    ]}),
                ],
            entities: [
                random_item, null,
                null, random_item,
            ],
        }),
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

const test_wall_sequence = wall_sequence();

window.test_chunk_grid = new ChunkGrid({
        width: 4, height: 4, // These are number of chunks
        chunk_width: 8, chunk_height: 8,
        default_grid_values: { floor: tiles.ID.WALL },
        chunks: [
            window.level_initial,   test_wall_sequence,           random_floor,             subchunk_8x8,
            window.level_initial,   test_wall_sequence,           random_floor,             subchunk_8x8,
            window.test_sub_chunk,  window.level_initial,       tiles.ID.VOID,              subchunk_8x8,
            null,                   tiles.ID.GROUND,            window.level_initial,       subchunk_8x8,
        ],
    });


window.unfold_chunk_grid = unfold_chunk_grid;
