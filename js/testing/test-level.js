

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int } from "../system/utility.js";
import * as basic_rules from "../rules/rules-basic.js";
import { Rule_Movements } from "../rules/rules-movement.js";
import { sprite_defs } from "../game-assets.js";
import { Rule_ActionPoints } from "../rules/rules-actionpoints.js";
import { RandomActionEnemy } from "../enemies/test-enemy.js";

import * as tiles from "../definitions-tiles.js";
import { world_grid } from "../definitions-world.js";


function make_test_world(){ // The game assets must have been initialized first.
    const test_world_size = { width: 12, height: 12 }; // = world_grid;
    const world = new concepts.World( test_world_size.width, test_world_size.height );
    world._floor_tile_grid.set_at({x:5, y:5}, tiles.ID.GROUND);
    world._floor_tile_grid.set_at({x:4, y:4}, tiles.ID.GROUND);
    world._surface_tile_grid.set_at({x:6, y:6}, tiles.ID.WALL);
    world._surface_tile_grid.set_at({x:0, y:0}, tiles.ID.ENTRY);
    world._surface_tile_grid.set_at({x:11, y:11}, tiles.ID.ENTRY);
    world._surface_tile_grid.set_at({x:4, y:4}, tiles.ID.ENTRY);
    world._surface_tile_grid.set_at({x:4, y:8}, tiles.ID.ENTRY);
    world._surface_tile_grid.set_at({x:8, y:8}, tiles.ID.EXIT);

    world.set_rules(
        new basic_rules.Rule_BasicActions(),
        new Rule_Movements(),
        new basic_rules.Rule_GameOver(),
        new Rule_ActionPoints(),
    );

    for(let i = 0; i < 3; ++i){
        const enemy = new RandomActionEnemy();
        enemy.position.x = random_int(0, test_world_size.width - 1 );
        enemy.position.y = random_int(0, test_world_size.height - 1 );
        world.add(enemy);
    }

    return world;
}


