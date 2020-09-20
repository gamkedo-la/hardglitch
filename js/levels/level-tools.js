export {
    generate_empty_world,
    serialize_world,
    deserialize_world,
}

import * as tiles from "../definitions-tiles.js";
import * as concepts from "../core/concepts.js";
import { default_rules, is_valid_world, grid_ID, get_entity_type } from "../definitions-world.js";
import { Grid } from "../system/grid.js";
import * as audio from "../system/audio.js"; // inserted here to test with sound effects
import { escaped } from "../system/utility.js";

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

function deserialize_world(world_desc){
    console.assert(world_desc instanceof Object);
    console.assert(typeof world_desc.name === "string");
    console.assert(Number.isInteger(world_desc.width) && world_desc.width > 2);
    console.assert(Number.isInteger(world_desc.height) && world_desc.height > 2);
    console.assert(world_desc.grids instanceof Object);
    console.assert(Object.keys(world_desc.grids).every(grid_id => grid_ID[grid_id] !== undefined));
    console.assert(Object.values(world_desc.grids).every(grid=> grid instanceof Array && grid.length === world_desc.width * world_desc.height));
    console.assert(world_desc.entities instanceof Array);
    console.assert(world_desc.entities.every(entity_desc => typeof entity_desc.type === "string" && Number.isInteger(entity_desc.position.x) && Number.isInteger(entity_desc.position.y)));

    const world = new concepts.World(world_desc.name, world_desc.width, world_desc.height, {});

    for(const [grid_id, grid_elements] of Object.entries(world_desc.grids)){
        const grid = new Grid(world_desc.width, world_desc.height, grid_elements);
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
