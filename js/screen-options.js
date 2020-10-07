export {
    OptionsScreen,

}

import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import { KEY } from "./game-input.js";
import { ScreenFader } from "./system/screenfader.js";
import { AudioSettings } from "./game-ui.js";
import { sprite_defs } from "./game-assets.js";
import { Vector2 } from "./system/spatial.js";
import { invoke_on_members } from "./system/utility.js";

class Options {
    constructor(on_back_button){

        this.title = new ui.Text({
            text: "OPTIONS",
            font: "60px ZingDiddlyDooZapped",
            background_color: "#ffffff00",
        });

        this.title.position = {
                                x: graphics.canvas_center_position().translate({ x: -(this.title.width / 2), y: 8 }).x,
                                y: 8,
                              };

        this.back_button = new ui.TextButton({
            text: "Back To Title",
            action: on_back_button,
            position: {x:0, y:0},
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });
        this.back_button.position = {
                                        x: graphics.canvas_rect().width - this.back_button.width - 8,
                                        y: 8,
                                    };


        this.audio_settings = new AudioSettings({ position: new Vector2({x: 0, y: 0}) });
        const hack_actual_position = graphics.centered_rectangle_in_screen(this.audio_settings).position; // HACK HACK HACK
        this.audio_settings = new AudioSettings({ position: hack_actual_position });
    }


    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

}

class OptionsScreen extends fsm.State {
    fader = new ScreenFader();

    create_ui(){
        this.options = new Options(()=>this.go_back());
    }

    *enter(){
        this.create_ui();
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        delete this.options;
    }

    go_back(){
        this.state_machine.push_action("back");
    }

    update(delta_time){
        if(input.keyboard.is_just_down(KEY.ESCAPE)){
            this.go_back();
        }

        this.options.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "orange");

        this.options.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        this.create_ui();
    }

};








