export {
    MainMenuScreen,
}


import * as fsm from "./system/finite-state-machine.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";

import { sprite_defs } from "./game-assets.js";
import { invoke_on_members } from "./system/utility.js";
import { Vector2, Vector2_origin } from "./system/spatial.js";
import { ScreenFader } from "./system/screenfader.js";

class MainMenu {

    constructor(state_machine, position){
        console.assert(state_machine instanceof fsm.StateMachine);
        console.assert(position instanceof Vector2);
        this.position = position;

        this.button_new_game = new ui.TextButton({
            text: "New Game",
            color: "#ffffff",
            action: ()=> { state_machine.push_action("new_game"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'buffertest',
                down: 'buffertest',
                action: 'buffertest',
            },
        });

        this.button_test_level = new ui.TextButton({
            text: "Test Level",
            action: ()=> { state_machine.push_action("new_game", "test"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });

        this.button_credits = new ui.TextButton({
            text: "Credits",
            action: ()=> { state_machine.push_action("credits"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });


        const space_between_buttons = 80;
        let next_button_y_drift = 100;
        const button_y_drift = () => next_button_y_drift += space_between_buttons;
        Object.values(this).filter(element => element instanceof ui.Button)
            .forEach(button => {
                const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                button.position = center_pos.translate({ x:0, y: button_y_drift() });
            });

    }

    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

};


class MainMenuScreen extends fsm.State {
    fader = new ScreenFader();

    _init_ui(){
        console.assert(this.main_menu === undefined);
        console.assert(this.title === undefined);
        this.title = new ui.Text({
            text: "HARD GLITCH",
            font: "80px ZingDiddlyDooZapped",
            color: "white",
            background_color: "#ffffff00",
            position: Vector2_origin
        });
        this.title.position = {
            x: graphics.centered_rectangle_in_screen(this.title.area).position.x,
            y: 80
        };
        this.main_menu = new MainMenu(this.state_machine, this.title.position.translate({ x:0, y: 100 }));
    }

    *enter(){
        if(!this.main_menu){
            this._init_ui();
        }

        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }

    update(delta_time){
        this.fader.update(delta_time);
        if(!this.fader.is_fading)
            this.main_menu.update(delta_time);
        this.title.update(delta_time);
    }

    display(canvas_context){

        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "orange");

        if(!this.is_fading){
            this.main_menu.draw(canvas_context);
        }

        this.title.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        delete this.main_menu;
        delete this.title;
        this._init_ui();
    }
};




