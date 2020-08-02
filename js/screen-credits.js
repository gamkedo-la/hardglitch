export {
    CreditsScreen,

}

import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import { Screen } from "./screen.js";
import { KEY } from "./game-input.js";
import { sprite_defs } from "./game-assets.js";
import { invoke_on_members } from "./system/utility.js";

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

class CreditsScreen extends Screen {

    *enter(){
        if(!this.credits){
            this.credits = new Credits(()=> this._go_back());
        }
        yield* super.enter();
    }

    _go_back(){
        this.state_machine.push_action("back");;
    }

    update(delta_time){
        if(input.keyboard.is_just_down(KEY.ESCAPE)){
            this._go_back();
        }

        this.credits.update(delta_time);

        super.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "grey");

        this.credits.draw(canvas_context);

        super.display(canvas_context);
    }

};








