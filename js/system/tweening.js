// This file provides tweening functions and easing functions to use with them.

import { is_number } from "./utility.js";

export { tween, easing }

const easing = {
    linear: function(begin_value, end_value, ratio){
        // TODO: I feel like there is something wrong here, feel free to reduce this code to remove that if.
        const diff = Math.abs(begin_value - end_value);
        if(begin_value <= end_value)
            return begin_value + (diff * ratio);
        else
            return begin_value - (diff * ratio);
    }
};

class AnimatedValue {
    constructor(initial_value, target_value, easing_func){
        this.initial_value = initial_value;
        this.target_value = target_value;
        this.easing_func = easing_func;
    }

    get_value(ratio){
        return this.easing_func(this.initial_value, this.target_value, ratio);
    }

};


function* tween(initial_values, target_values, duration_ms, easing_funcs = easing.linear){
    console.assert(is_number(duration_ms));
    console.assert(duration_ms > 0);

    const animated_values = {}; // Only AnimatedValue objects.

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
            console.assert(easing_funcs instanceof Object);
        }

        // Then register each value to modify (based on the target values, because the object passed for initial values might have more members than the ones we want to animate).
        for(const value_id in target_values){
            animated_values[value_id] = new AnimatedValue(initial_values[value_id], target_values[value_id], easing_funcs[value_id]);
        }
    }
    else{
        // We have only one value to animate.
        console.assert(easing_funcs instanceof Function);
        animated_values = new AnimatedValue(initial_values, target_values, easing_funcs);
    }

    function reduce_values(ratio){
        console.assert(ratio >= 0 && ratio <=1);
        if(animated_values instanceof Object){
            const result_values = {};
            for(const id in animated_values){
                result_values[id] = animated_values[id].get_value(ratio);
            }
            return result_values;
        } else {
            return animated_values.get_value(ratio);
        }
    }

    let current_values = reduce_values(0);
    let time_since_start = 0;
    while(time_since_start < duration_ms){
        const delta_time = yield current_values;
        console.assert(is_number(delta_time));
        time_since_start += delta_time;

        if(time_since_start > duration_ms){
            time_since_start = duration_ms;
        }

        const ratio = time_since_start / duration_ms;
        current_values = reduce_values(ratio);
    }
}

// const x = tween(0, 42, 1000);

// const y = tween({x:0, y:0}, {x:42, y:42}, 1000, { x:easing_linear, y:easing_linear });

// const z = tween(sprite.position, {x:42, y:42}, 1000, { x:easing_linear, y:easing_linear });


// x.next(delta_time);
// const new_value = x.value;

// function* sprite_animation(sprite, ...args){
//     const tw = tween(sprite.position, ...args);
//     while(!tw.done){
//         sprite.position = tw.value;
//         const delta_time = yield;
//         tw.next(delta_time);
//     }
// }

// function run_tween(...args){

// }

