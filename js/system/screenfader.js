// This file provide a simple way to do a fade-in or fade-out of a screen.
export {
    ScreenFader,
}

import * as debug from "../system/debug.js";
import * as graphics from "./graphics.js";
import { tween } from "./tweening.js";
import { Color } from "./color.js";
import { AnimationGroup } from "./animation.js";


class ScreenFader {
    duration_ms = 1000;

    _color = new Color(0, 0, 0);
    _fade = 1;
    _fade_target = 0;
    _animator = new AnimationGroup();

    get color() { return this._color.copy(); }
    set color(new_color){
        debug.assertion(()=>new_color instanceof Color);
        this._color = new_color;
    }

    get is_fading() { return this._fade !== this._fade_target; }

    // To be called at each update cycle.
    update(delta_time){
        this._animator.update(delta_time);
    }

    // To be called last in graphic rendering.
    display(canvas_context){
        if(this._fade !== 0){
            this._color.a = this._fade;
            graphics.execute_without_transform(canvas_context, ()=>{
                graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), this._color.toString());
            });
        }
    }

    cancel(){
        if(this._current_generator){
            delete this._current_generator;
        }
        if(this._current_promise){
            this._current_promise.cancel();
            delete this._current_promise;
        }
    }

    *generate_fade_in(target=0){
        this._fade_target = target;
        yield* this._launch_fade(this._fade, target);
    }

    *generate_fade_out(target=1){
        this._fade_target = target;
        yield* this._launch_fade(this._fade, target);
    }

    *_launch_fade(from, to){
        this.cancel();
        this._current_generator = tween(from, to, this.duration_ms, value => this._fade = value);
        yield* this._current_generator;
    }

    fade_in(){
        this._current_promise = this._animator.play(this.generate_fade_in());
        return this._current_promise;
    }

    fade_out(){
        this._current_promise = this._animator.play(this.generate_fade_in());
        return this._current_promise;
    }

}