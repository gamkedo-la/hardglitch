
export { RandomActionEnemy };

import * as concepts from "../core/concepts.js";
import {random_sample} from "../system/utility.js";
import { Wait } from "../rules/rules-basic.js";
import { sprite_defs } from "../game-assets.js";

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

class RandomActionEnemy extends concepts.Body {
    assets = {
        graphics : {
            sprite_def : sprite_defs.test_enemy,
        }
    };

    constructor(body){
        super();
        this.actor = new RandomActionSelector();
    }
};
