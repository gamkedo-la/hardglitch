// This file provides tweening functions and easing functions to use with them.

export { Tweening, tween, easing }

import * as debug from "../system/debug.js";
import { is_number } from "./utility.js";

// Inspired by https://gist.github.com/gre/1650294
const easing = {
    linear: ratio => ratio,
    in_out_quad: ratio => ratio < .5 ? 2 * ratio * ratio : -1 + ( 4 - 2 * ratio ) * ratio,

};

function value_from_ratio(begin_value, end_value, ratio){
    const diff = Math.abs(begin_value - end_value);
    if(begin_value <= end_value)
        return begin_value + (diff * ratio);
    else
        return begin_value - (diff * ratio);
}

class AnimatedValue {
    constructor(initial_value, target_value, easing_func){
        this.initial_value = initial_value;
        this.target_value = target_value;
        this.easing_func = easing_func;
    }

    get_value(ratio){
        return value_from_ratio(this.initial_value, this.target_value, this.easing_func(ratio));
    }

};

class Tweening{
    constructor(initial_values, target_values, duration_ms, easing_funcs = easing.linear){
        debug.assertion(()=>is_number(duration_ms));
        debug.assertion(()=>duration_ms >= 0);

        this.duration = duration_ms;
        this.time_since_start = 0;
        this.animated_values = {}; // Only AnimatedValue objects.

        if(target_values instanceof Object){
            // Make sure we have one easing function per value with a target.
            // If only one function was provided, just use that same function for each value.
            if(easing_funcs instanceof Function){
                const func = easing_funcs;
                easing_funcs = {};
                for(const value_id in target_values){
                    easing_funcs[value_id] = func;
                }
            } else {
                debug.assertion(()=>easing_funcs instanceof Object);
            }

            // Then register each value to modify (based on the target values, because the object passed for initial values might have more members than the ones we want to animate).
            for(const value_id in target_values){
                this.animated_values[value_id] = new AnimatedValue(initial_values[value_id], target_values[value_id], easing_funcs[value_id]);
            }
        }
        else{
            // We have only one value to animate.
            debug.assertion(()=>easing_funcs instanceof Function);
            this.animated_values = new AnimatedValue(initial_values, target_values, easing_funcs);
        }
    }

    get_values(ratio){
        debug.assertion(()=>ratio >= 0 && ratio <=1);
        if(this.animated_values instanceof AnimatedValue){
            return this.animated_values.get_value(ratio);
        } else {
            const result_values = {};
            for(const id in this.animated_values){
                result_values[id] = this.animated_values[id].get_value(ratio);
            }
            return result_values;
        }
    }

    get ratio(){ return this.duration !== 0 ? this.time_since_start / this.duration : 1.0; };
    get values() { return this.get_values(this.ratio); }
    get done() { return this.time_since_start === this.duration; }

    update(delta_time){
        debug.assertion(()=>typeof(delta_time) === 'number');
        this.time_since_start += delta_time;

        if(this.time_since_start > this.duration){
            this.time_since_start = this.duration;
        }

        return this.values;
    }

    *run(update_callback){
        debug.assertion(()=>update_callback);
        this.time_since_start = 0;
        do {
            const delta_time = yield this.values;
            debug.assertion(()=>typeof(delta_time) === 'number');
            update_callback(this.update(delta_time));
        }
        while(!this.done);
    }

}

function* tween(initial_values, target_values, duration_ms, update_func = ()=>{}, easing_funcs = easing.linear){
    const tweening = new Tweening(initial_values, target_values, duration_ms, easing_funcs);
    yield* tweening.run(update_func);
}

