

export { make_test_world }

import * as concepts from "./core/concepts.js";
import { Wait, BasicRules } from "./rules/rules-basic.js";
import { MovementRules } from "./rules/rules-movement.js";
import {random_sample, random_int} from "./system/utility.js";
import { assets } from "./game-assets.js";
import { Rules_ActionPoints } from "./rules/rules-actionpoints.js";

class RandomActionSelector extends concepts.Actor {

    decide_next_action(possible_actions) {
        // Just picking a random action is a perfectly valid strategy, lol
        let random_action = random_sample(Object.values(possible_actions));
        if(random_action == null) { // no action found.
            // In this case just wait:
            return new Wait();
        }
        return random_action;
    }
};

class Enemy extends concepts.Body {

    constructor(body){
        super();
        this.actor = new RandomActionSelector();
    }
};

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
        new BasicRules(),
        new MovementRules(),
        new Rules_ActionPoints(),
    );

    const player = new Player();
    world.add(player);

    for(let i = 0; i < 3; ++i){
        const enemy = new Enemy();
        enemy.position.x = random_int(0, 9);
        enemy.position.y = random_int(0, 9);
        world.add(enemy);
    }

    return world;
}


