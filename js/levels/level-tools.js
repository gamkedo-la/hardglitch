export {
    generate_empty_world,
    serialize_world,
    deserialize_world,
    reversed_world_desc,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules, is_valid_world, grid_ID, get_entity_type } from "../definitions-world.js";
import { Grid } from "../system/grid.js";
import * as audio from "../system/audio.js"; // inserted here to test with sound effects
import { escaped, index_from_position } from "../system/utility.js";

const default_defaults = {
    ground : tiles.ID.CALCFLOORWARM,
    wall : tiles.ID.WALL,
};

function generate_empty_world(name, width, height, defaults = default_defaults){

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
    audio.playEvent('HGBreakdown'); // inserted here to test with sound effects
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

function check_world_desc(world_desc){
    console.assert(world_desc instanceof Object);
    console.assert(typeof world_desc.name === "string");
    console.assert(Number.isInteger(world_desc.width) && world_desc.width > 1);
    console.assert(Number.isInteger(world_desc.height) && world_desc.height > 1);
    console.assert(world_desc.grids instanceof Object);
    console.assert(Object.keys(world_desc.grids).every(grid_id => grid_ID[grid_id] !== undefined));
    console.assert(Object.values(world_desc.grids).every(grid=> grid instanceof Array && grid.length === world_desc.width * world_desc.height));
    console.assert(world_desc.entities instanceof Array);
    console.assert(world_desc.entities.every(entity_desc => typeof entity_desc.type === "string" && Number.isInteger(entity_desc.position.x) && Number.isInteger(entity_desc.position.y)));
}

function copy_world_desc(world_desc){
    const copy = JSON.parse(JSON.stringify(world_desc));
    return copy;
}

function deserialize_world(world_desc){
    check_world_desc(world_desc);

    const world = new concepts.World(world_desc.name, world_desc.width, world_desc.height, {});

    for(const [grid_id, grid_elements] of Object.entries(world_desc.grids)){
        const grid = new Grid(world_desc.width, world_desc.height, grid_elements);
        grid.elements = grid.elements.reverse();
        world.add_grid(grid_id, grid);
    }

    for(const entity_desc of world_desc.entities){
        const entity_type = get_entity_type(entity_desc.type);
        const entity = new entity_type();
        console.assert(entity instanceof concepts.Entity);
        entity.position = entity_desc.position;
        world.add_entity(entity);
    }

    world.set_rules(...default_rules);

    console.assert(is_valid_world(world));
    return world;
}

const world_variations = [
    reversed_world_desc,
];

function reversed_world_desc(world_desc){
    check_world_desc(world_desc);
    const result = copy_world_desc(world_desc);

    for(const [grid_id, grid] of Object.entries(result.grids)){
        result.grids[grid_id] = grid.reverse();
    }

    result.entities.forEach(entity => {
        const x = entity.position.y;
        const y = entity.position.x;
        entity.position.x = x;
        entity.position.y = y;
    });

    return result;
}


function mirror_world_desc(world_desc, vertical_axe = true){
    check_world_desc(world_desc);
    const result = copy_world_desc(world_desc);

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
    const rotated_world = copy_world_desc(world_desc);

    while(rotation_count !== 0){
        const initial_width = rotated_world.width;
        const initial_height = rotated_world.height;
        const N = initial_height - 1;
        const width = rotated_world.height;
        const height = rotated_world.width;
        rotated_world.width = width;
        rotated_world.height = height;

        Object.values(rotated_world.grids).forEach(grid => {
            const initial_grid = new Array(...grid);
            for (let y = 0; y < initial_height; y++) {
                for (let x = 0; x < initial_width; x++) {
                    const source_idx = index_from_position(initial_width, initial_height, {x, y});
                    const destination_idx = index_from_position(initial_width, initial_height, { x: y, y: N - x });
                    grid[destination_idx] = initial_grid[source_idx];
                }
            }
        });

        rotated_world.entities.forEach(entity => {
            const x = entity.position.y;
            const y = N - entity.position.x;
            entity.position.x = x;
            entity.position.y = y;
        });

        --rotation_count;
    }

    return rotated_world;
}


/// The following is for debug:
window.reversed_world_desc = reversed_world_desc;
window.rotate_world_desc = rotate_world_desc;

window.level_initial = {
    name: "Test Level \"testing\" 8 x 8",
    width: 8,
    height: 8,
    grids: {
      floor : [12,12,12,12,15,15,15,15,12,12,12,12,12,12,12,15,12,12,12,12,12,12,12,15,12,12,12,12,12,12,12,15,17,12,12,12,12,12,12,12,17,12,12,12,12,12,12,12,17,12,12,12,12,12,12,12,17,17,17,17,12,12,12,12],
      surface : [1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0],
      corruption : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
      unstable : [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    },
    entities: [
      { type: "GlitchyGlitchMacGlitchy", position: { x: 3, y: 3 } },
      { type: "CryptoFile_Circle", position: { x: 7, y: 0 } },
    ],
  };



window.setup_test_levels = ()=>{
    window.level_east = rotate_world_desc(window.level_initial);
    window.level_south = rotate_world_desc(window.level_east);
    window.level_west = rotate_world_desc(window.level_south);
    window.level_north = rotate_world_desc(window.level_west);
    window.level_mirror_vertical_axe = mirror_world_desc(window.level_initial);
    window.level_mirror_horizontal_axe = mirror_world_desc(window.level_initial, false);
};

