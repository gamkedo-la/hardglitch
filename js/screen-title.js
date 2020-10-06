export {
    TitleScreen,
}


import * as fsm from "./system/finite-state-machine.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import * as audio from "./system/audio.js";

import { sprite_defs } from "./game-assets.js";
import { invoke_on_members } from "./system/utility.js";
import { Vector2, Vector2_origin } from "./system/spatial.js";
import { ScreenFader } from "./system/screenfader.js";

import { load_test_level, load_random_test_level } from "./main.js";
import { AudioSettings } from "./game-ui.js";

const buttons_font = "24px Verdana";

class MainMenu {

    constructor(state_machine, position){
        console.assert(state_machine instanceof fsm.StateMachine);
        console.assert(position instanceof Vector2);
        this.position = position;

        this.button_new_game = new ui.TextButton({
            text: "New Game",
            color: "#ffffff",
            font: buttons_font,
            action: ()=> { state_machine.push_action("new_game"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            },
        });

        this.button_empty_level = new ui.TextButton({
            text: "Empty Small Level",
            font: buttons_font,
            action: ()=> { load_test_level(10, 10); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });

        this.button_test_level = new ui.TextButton({
            text: "Random Test Level",
            font: buttons_font,
            action: ()=> { load_random_test_level(); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });

        this.button_credits = new ui.TextButton({
            text: "Credits",
            font: buttons_font,
            action: ()=> { state_machine.push_action("credits"); },
            position: Vector2_origin,
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });

        this.audio_settings = new AudioSettings({
            position: new Vector2({x: 0, y: graphics.canvas_rect().height/2 - 156}),
        });



        const space_between_buttons = this.button_new_game.height + 6;
        let next_button_y_drift = 40;
        const button_y_drift = () => next_button_y_drift += space_between_buttons;
        const bottom_y = graphics.canvas_rect().bottom_right.y;
        Object.values(this).filter(element => element instanceof ui.Button)
            .reverse()
            .forEach(button => {
                const center_pos = graphics.centered_rectangle_in_screen(button.area).position;
                button.position = { x: center_pos.x, y: bottom_y - button_y_drift() };
            });

    }

    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

};


class TitleScreen extends fsm.State {
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
        audio.playEvent("HelloWorld");
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        audio.stopEvent("HelloWorld");
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




