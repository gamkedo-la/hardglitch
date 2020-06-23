// This file describes the UI when playing the game (not in other menus)


export {
    GameInterface,
};

import { group_per_type } from "./system/utility.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import { sprite_defs } from "./game-assets.js";
import * as concepts from "./core/concepts.js";
import { play_action } from "./game-input.js";

// The interface used by the player when inside the game.
// NOTE: it's a class instead of just globals because we need to initialize and destroy it
//       at specific times in the life of the game, and it's easier to do if its just an object.
class GameInterface {

    // Define the UI elements here:
    test_button = new ui.Button({
        position: { x: 200, y: 500 },
        width: 50, height: 50,
        sprite_def: sprite_defs.test_button,
        frames: { up: 0, down: 1, over: 2, disabled: 3 },
        action: function(){
            console.log("TEST BUTTON ACTION");
        }
    });

    another_test_button = new ui.Button({
        position: { x: 200, y: 600 },
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
        position: { x: 200, y: 700 },
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
        this._action_buttons = [];
    }

    get elements(){
        return Object.values(this)
            .filter(element => element instanceof ui.UIElement)
            .concat(this._action_buttons);
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

    show_action_buttons(possible_actions){
        console.assert(possible_actions instanceof Array);
        console.assert(possible_actions.every(action => action instanceof concepts.Action));

        this._action_buttons = []; // Clear the previous set of buttons.

        // We need to have 1 button per action type, then show targets when it's selected.
        // So first we gather these actions per types...
        const actions_per_types = group_per_type(possible_actions);

        // ... then we build the buttons with the associated informations.
        const button_size = 50;
        const line_y = graphics.canvas_rect().bottom_right.y - 100; // TODO: handle changing the canvas size
        let line_x = 40;
        const next_x = ()=> line_x += (button_size + 5);

        for(const [action_name, actions] of Object.entries(actions_per_types)){
            const action_button = new ui.Button({ // TODO: add a way to identify the action visually, text + icon
                position: { x: next_x(), y: line_y },
                width: button_size, height: button_size,
                sprite_def: sprite_defs.test_button,
                frames: { up: 0, down: 1, over: 2, disabled: 3 },
                action: ()=>{
                    console.log(`ACTION SELECTED: ${action_name}`);
                    // TODO: highlight the possible targets
                    if(actions.length == 1){
                        const action = actions[0];
                        if(action.target === undefined) // No need for targets
                        play_action(action);
                    }
                    this.lock_actions(); // temporary
                }
            });
            this._action_buttons.push(action_button);
        }
    }

    lock_actions(){
        this._action_buttons.forEach(button => button.enabled = false);
    }

    unlock_actions(){
        this._action_buttons.forEach(button => button.enabled = true);
    }

};



