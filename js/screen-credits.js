export {
    CreditsScreen,

}

import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as fsm from "./system/finite-state-machine.js";
import { KEY } from "./game-input.js";
import { sprite_defs } from "./game-assets.js";
import { invoke_on_members } from "./system/utility.js";
import { ScreenFader } from "./system/screenfader.js";

class Credits {
    constructor(on_back_button){

        this.title = new ui.Text({
            text: "CREDITS",
            font: "36px arial",
            position: { x: 30, y: 30 }
        });

        this.back_button = new ui.TextButton({
            text: "Back",
            action: on_back_button,
            position: this.title.position.translate({x: 500, y: 0 }),
            width: 256, height: 64,
            sprite_def: sprite_defs.button_menu,
            frames: { up: 0, down: 1, over: 2, disabled: 3 },
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });
    }


    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

}

class CreditsScreen extends fsm.State {
    fader = new ScreenFader();

    create_ui(){
        this.credits = new Credits(()=> this.go_back());
    }

    *enter(){
        if(!this.credits){
            this.create_ui();
        }
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }

    go_back(){
        this.state_machine.push_action("back");;
    }

    update(delta_time){
        if(input.keyboard.is_just_down(KEY.ESCAPE)){
            this.go_back();
        }

        this.credits.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "grey");

        this.credits.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        this.create_ui();
    }

};








