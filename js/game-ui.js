// This file describes the UI when playing the game (not in other menus)


export {
    GameInterface,
};

import { group_per_type } from "./system/utility.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import { sprite_defs } from "./game-assets.js";
import * as concepts from "./core/concepts.js";
import { play_action, mouse_grid_position, KEY } from "./game-input.js";
import { keyboard, mouse, MOUSE_BUTTON } from "./system/input.js";
import { set_text } from "./editor.js";
import { Vector2, center_in_rectangle } from "./system/spatial.js";

const action_button_size = 50;

class ActionButton extends ui.Button {
    constructor(position, icon_def, action_name, on_clicked){
        super({ // TODO: add a way to identify the action visually, text + icon
            position: position,
            width: action_button_size, height: action_button_size,
            sprite_def: sprite_defs.button_select_action,
            frames: { up: 0, down: 1, over: 2, disabled: 3 },
            action: on_clicked
        });

        this.icon = new graphics.Sprite(icon_def);
        this.icon.position = center_in_rectangle(this.icon,
            { position: this.position, width: action_button_size, height:action_button_size}).position;

        this.help_text = new ui.Text({
            height: 20, width: 60,
            text: action_name
        });
        this.help_text.position = this.position.translate({x:0, y: -this.help_text.height - 4 })
        this.help_text.visible = false;
    }

    _on_update(delta_time){
        super._on_update(delta_time);
        if(this.help_text.visible){
            if(!this.is_mouse_over)
                this.help_text.visible = false;
        } else {
            if(this.is_mouse_over)
                this.help_text.visible = true;
        }
    }
};


// The interface used by the player when inside the game.
// NOTE: it's a class instead of just globals because we need to initialize and destroy it
//       at specific times in the life of the game, and it's easier to do if its just an object.
class GameInterface {

    // Define the UI elements here:
    // test_button = new ui.Button({
    //     position: { x: 200, y: 500 },
    //     width: 50, height: 50,
    //     sprite_def: sprite_defs.test_button,
    //     frames: { up: 0, down: 1, over: 2, disabled: 3 },
    //     action: function(){
    //         console.log("TEST BUTTON ACTION");
    //     }
    // });

    // another_test_button = new ui.Button({
    //     position: { x: 200, y: 600 },
    //     width: 50, height: 50,
    //     sprite_def: sprite_defs.test_button,
    //     frames: { up: 0, down: 1, over: 2, disabled: 3 },
    //     is_action_on_up: true,
    //     action: ()=>{
    //         console.log("ANOTHER TEST BUTTON ACTION");
    //         this.another_test_button.enabled = false;
    //         this.third_test_button.visible = true;
    //     }
    // });

    // third_test_button = new ui.Button({
    //     position: { x: 200, y: 700 },
    //     width: 50, height: 50,
    //     sprite_def: sprite_defs.test_button,
    //     frames: { up: 0, down: 1, over: 2, disabled: 3 },
    //     visible: false,
    //     action: ()=>{
    //         console.log("THIRD TEST BUTTON ACTION");
    //         this.another_test_button.enabled = true;
    //         this.third_test_button.visible = false;
    //     }
    // });

    button_cancel_action_selection = new ui.Button({
        position: { x: 200, y: 700 },
        width: action_button_size, height: action_button_size,
        sprite_def: sprite_defs.button_cancel_action_target_selection,
        frames: { up: 0, down: 1, over: 2, disabled: 3 },
        visible: false,
        action: ()=>{
            console.log("CANCEL ACTION BUTTON");
            this.cancel_action_target_selection();
            this.button_cancel_action_selection.visible = false;
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
            .concat(this._action_buttons)
            .filter(element => element instanceof ui.UIElement);
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

        const line_y = graphics.canvas_rect().bottom_right.y - 100; // TODO: handle changing the canvas size
        let line_x = 40;
        const next_x = ()=> line_x += (action_button_size + 5);

        for(const [action_name, actions] of Object.entries(actions_per_types)){
            const position = { x: next_x(), y: line_y };
            const first_action = actions[0];
            console.assert(first_action instanceof concepts.Action);
            const action_button = new ActionButton(position, first_action.icon_def, action_name, ()=>{
                    set_text(`ACTION SELECTED: ${action_name}`);
                    // TODO: highlight the possible targets
                    if(actions.length == 1 && first_action.target_position === undefined){ // No need for targets
                        play_action(first_action); // Play the action immediately
                    } else {
                        // Need to select an highlited target!
                        this.button_cancel_action_selection.position = new Vector2(position).translate({ x:0, y:-action_button_size });
                        this._begin_target_selection(action_name, actions);
                    }
                    this.lock_actions(); // Can be unlocked by clicking somewhere there is no action target.
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
        this.button_cancel_action_selection.visible = true;
    }

    _end_target_selection(action){
        console.assert(!action || action instanceof concepts.Action);
        this._selected_action = undefined;
        this.on_action_selection_end(action);
        this.button_cancel_action_selection.visible = false;
    }

    _handle_action_target_selection(){
        if(keyboard.is_just_down(KEY.ESCAPE) && this.is_selecting_action_target){
            this.cancel_action_target_selection();
            return;
        }

        if(this.is_selecting_action_target
         && mouse.buttons.is_just_down(MOUSE_BUTTON.LEFT)
         && !this.is_mouse_over
         ){
            const target_position = mouse_grid_position();
            if(target_position) {
                const selected_action_with_target = this.selected_action.actions.find(action=>action.target_position.equals(target_position));
                if(selected_action_with_target){
                    console.assert(selected_action_with_target instanceof concepts.Action);
                    set_text(`ACTION TARGET SELECTED: ${JSON.stringify(target_position)}`);
                    this._end_target_selection(selected_action_with_target);
                    play_action(selected_action_with_target);
                }
            }
        }
    }

    cancel_action_target_selection(){
        // Cancel selection.
        this.unlock_actions();
        this._end_target_selection();
    }

};



