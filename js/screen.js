
export {
    Screen,
}

import * as fsm from "./system/finite-state-machine.js";
import * as graphics from "./system/graphics.js";
import { tween } from "./system/tweening.js";
import { Color } from "./system/color.js";


class Screen extends fsm.State {
    fade = 0;
    fade_color = new Color(0, 0, 0);
    fading_duration_ms = 1000;

    *enter(){
        yield* this._fade_in();
    }

    *leave(){
        yield* this._fade_out();
    }

    get is_fading() { return this.fade !== 1; }

    update(delta_time){

    }

    display(canvas_context){
        if(this.is_fading){
            this.fade_color.a = 1.0 - this.fade;
            graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), this.fade_color.toString());
        }
    }


    *_fade_in(){
        this.fade = 0;
        yield* tween(this.fade, 1, this.fading_duration_ms, value => this.fade = value);
    }

    *_fade_out(){
        yield* tween(this.fade, 0, this.fading_duration_ms, value => this.fade = value);
    }

}