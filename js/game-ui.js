// This file describes the UI when playing the game (not in other menus)


export {
    GameInterface,
};

import { group_per_type } from "./system/utility.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import { sprite_defs } from "./game-assets.js";
import * as concepts from "./core/concepts.js";
import { play_action, mouse_grid_position } from "./game-input.js";
import { mouse, MOUSE_BUTTON } from "./system/input.js";
import { set_text } from "./editor.js";

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

    constructor(on_action_selection_begin, on_action_selection_end){
        console.assert(on_action_selection_begin);
        console.assert(on_action_selection_end);
        this._action_buttons = [];
        this.on_action_selection_begin = on_action_selection_begin;
        this.on_action_selection_end = on_action_selection_end;
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

    get is_selecting_action_target(){
        return this._selected_action !== undefined;
    }

    update(delta_time){
        this.elements.map(element => element.update(delta_time));
        this._handle_action_target_selection();
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
                    set_text(`ACTION SELECTED: ${action_name}`);
                    // TODO: highlight the possible targets
                    const first_action = actions[0];
                    if(actions.length == 1 && first_action.target_position === undefined){ // No need for targets
                        play_action(action); // Play the action immediately
                    } else {
                        // Need to select an highlited target!
                        this._begin_target_selection(action_name, actions);
                    }
                    this.lock_actions(); // Can be unlocked by clicking somewhere there is no action target.
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

    get selected_action() { return this._selected_action; }

    _begin_target_selection(action_name, actions){
        this._selected_action = { action_name, actions };
        this.on_action_selection_begin(this._selected_action);
    }

    _end_target_selection(action){
        console.assert(!action || action instanceof concepts.Action);
        this._selected_action = undefined;
        this.on_action_selection_end(action);
    }

    _handle_action_target_selection(){
        if(this.is_selecting_action_target && mouse.buttons.is_just_down(MOUSE_BUTTON.LEFT)){
            if(!this.is_mouse_over){ // Ignore if we cliked on the UI.
                const target_position = mouse_grid_position();
                if(target_position) {
                    // TODO: push the action relative to that position
                    const selected_action_with_target = this.selected_action.actions.find(action=>action.target_position.equals(target_position));
                    if(selected_action_with_target){
                        console.assert(selected_action_with_target instanceof concepts.Action);
                        set_text(`ACTION TARGET SELECTED: ${JSON.stringify(target_position)}`);
                        this._end_target_selection(selected_action_with_target);
                        play_action(selected_action_with_target);
                        return;
                    }
                }

                // Cancel selection.
                this.unlock_actions();
                this._end_target_selection();
            }
        }
    }

};



