

export { make_test_world }

import * as concepts from "./core/concepts.js";
import { Wait, BasicRules } from "./rules/rules-basic.js";
import { MovementRules } from "./rules/rules-movement.js";
import {random_sample, random_int} from "./system/utility.js";
import { assets } from "./game-assets.js";
import { Rules_ActionPoints } from "./rules/rules-actionpoints.js";

class RandomActionSelector extends concepts.Agent {

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

class Enemy extends RandomActionSelector {
    constructor(body){
        super();
        this.body = body;
    }
};

class PlayerBody extends concepts.Body {
    assets = { spritesheet : assets.images.player };

    constructor(){
        super();
    }
}


const player = new concepts.Player();

function make_test_world(){
    const world = new concepts.World();

    world.add( new BasicRules() );
    world.add( new MovementRules() );
    world.add( new Rules_ActionPoints() );

    player.body = new PlayerBody();
    world.add(player);
    world.add(player.body);

    for(let i = 0; i < 3; ++i){
        const enemy_body = new concepts.Body();
        const enemy =  new Enemy(enemy_body);
        enemy_body.position.x = random_int(0, 10);
        enemy_body.position.y = random_int(0, 10);
        world.add(enemy);
        world.add(enemy_body);
    }

    return world;
}


