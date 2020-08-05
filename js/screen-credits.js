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

        this.back_button = new ui.Button({
            action: on_back_button,
            position: this.title.position.translate({x: 500, y: 0 }),
            width: 64, height: 64,
            sprite_def: sprite_defs.button_cancel_action_target_selection,
            frames: { up: 0, down: 1, over: 2, disabled: 3 },
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

    *enter(){
        if(!this.credits){
            this.credits = new Credits(()=> this.go_back());
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

};








