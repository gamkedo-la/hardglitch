// This file describes the UI when playing the game (not in other menus)


export {
    GameInterface,
};

import * as graphics from "./system/graphics.js";
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
        action: function(){
            console.log("TEST BUTTON ACTION");
        }
    });

    another_test_button = new ui.Button({
        position: { x: 200, y: 300 },
        width: 50, height: 50,
        sprite_def: sprite_defs.test_button,
        frames: { up: 0, down: 1, over: 2, disabled: 3 },
        is_action_on_up: true,
        action: ()=>{
            console.log("ANOTHER TEST BUTTON ACTION");
            this.another_test_button.enabled = false;
            this.third_test_button.visible = true;
        }
    });

    third_test_button = new ui.Button({
        position: { x: 200, y: 400 },
        width: 50, height: 50,
        sprite_def: sprite_defs.test_button,
        frames: { up: 0, down: 1, over: 2, disabled: 3 },
        visible: false,
        action: ()=>{
            console.log("THIRD TEST BUTTON ACTION");
            this.another_test_button.enabled = true;
            this.third_test_button.visible = false;
        }
    });

    constructor(){
        // this.elements.map(element => element.draw_debug=true);
    }

    get elements(){
        return Object.values(this).filter(element => element instanceof ui.UIElement );
    }

    is_under(position){
        return this.elements.some(element => element.is_under(position));
    }

    get is_mouse_over(){
        return this.elements.some(element => element.is_mouse_over);
    }

    update(delta_time){
        this.elements.map(element => element.update(delta_time));
    }

    display() {
        graphics.camera.begin_in_screen_rendering();
        this.elements.map(element => element.draw());
        graphics.camera.end_in_screen_rendering();
    }


};



