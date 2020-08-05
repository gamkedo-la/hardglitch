// This file provide a simple way to do a fade-in or fade-out of a screen.
export {
    ScreenFader,
}

import * as graphics from "./graphics.js";
import { tween } from "./tweening.js";
import { Color } from "./color.js";
import { AnimationGroup } from "./animation.js";


class ScreenFader {
    color = new Color(0, 0, 0);
    duration_ms = 1000;

    _fade = 0;
    _animator = new AnimationGroup();

    get is_fading() { return this._fade !== 1; }

    // To be called at each update cycle.
    update(delta_time){
        this._animator.update(delta_time);
    }

    // To be called last in graphic rendering.
    display(canvas_context){
        if(this.is_fading){
            this.color.a = 1.0 - this._fade;
            graphics.execute_without_transform(canvas_context, ()=>{
                graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), this.color.toString());
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

    *generate_fade_in(){
        this.cancel();
        this._fade = 0;
        this._current_generator = tween(this._fade, 1, this.duration_ms, value => this._fade = value);
        yield* this._current_generator;
    }

    *generate_fade_out(){
        this.cancel();
        this._current_generator = tween(this._fade, 0, this.duration_ms, value => this._fade = value);
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