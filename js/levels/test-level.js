

export { make_test_world }

import * as concepts from "../core/concepts.js";
import { random_int } from "../system/utility.js";
import * as basic_rules from "../rules/rules-basic.js";
import { Rule_Movements } from "../rules/rules-movement.js";
import { assets } from "../game-assets.js";
import { Rule_ActionPoints } from "../rules/rules-actionpoints.js";
import { RandomActionEnemy } from "../enemies/test-enemy.js";

class Player extends concepts.Body {
    assets = { spritesheet : assets.images.player };

    constructor(){
        super();
        this.actor = new concepts.Player();
    }
}

function make_test_world(){ // The game assets must have been initialized first.
    const world = new concepts.World();

    world.set_rules(
        new basic_rules.Rule_BasicActions(),
        new Rule_Movements(),
        new basic_rules.Rule_GameOver(),
        new Rule_ActionPoints(),
    );

    for(let i = 0; i < 3; ++i){
        const enemy = new RandomActionEnemy();
        enemy.position.x = random_int(0, 9);
        enemy.position.y = random_int(0, 9);
        world.add(enemy);
    }


    const player1 = new Player();
    world.add(player1);

    const player2 = new Player();
    player2.position.x = 5;
    player2.position.y = 5;
    world.add(player2);

    return world;
}

