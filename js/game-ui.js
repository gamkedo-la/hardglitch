// This file describes the UI when playing the game (not in other menus)


export {
    GameInterface,
};

import * as ui from "./system/ui.js";
import { sprite_defs } from "./game-assets.js";

// The interface used by the player when inside the game.
// NOTE: it's a class instead of just globals because we need to initialize and destroy it
//       at specific times in the life of the game, and it's easier to do if its just an object.
class GameInterface {

    // Define the UI elements here:
    test_button = new ui.Button({
        position: { x: 200, y: 200 },
        width: 50, height: 50,
        sprite_def: sprite_defs.test_button,
        frames: { up: 0, down: 1, over: 2, disabled: 3 },
        action: function(){ console.log("TEST BUTTON ACTION"); }
    });

    another_test_button = new ui.Button({
        position: { x: 200, y: 300 },
        width: 20, height: 20,
        sprite_def: sprite_defs.test_button,
        is_action_on_up: true,
        action: function(){ console.log("ANOTHER TEST BUTTON ACTION"); }
    });

    update(delta_time){
        this.test_button.update(delta_time);
        this.another_test_button.update(delta_time);
    }

    display() {
        this.test_button.draw();
        this.another_test_button.draw();
    }


};



