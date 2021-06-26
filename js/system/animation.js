// This file provides tools for animating stuffs procedurally,
// it uses coroutines for combining and sequencing animations.


export {
    AnimationGroup,
    in_parallel,
    in_parallel_any,
    wait,
    delay,
    wait_until,
    wait_while,

    CancelToken,
}

import * as debug from "../system/debug.js";
import { not } from "./utility.js";


function* in_parallel(...animations){
    while(animations.length > 0){
        const delta_time = yield;
        animations.forEach((animation_iterator, index)=>{
            const state = animation_iterator.next(delta_time);
            if(state.done)
                animations.splice(index, 1);
        });
    }
}


function* in_parallel_any(...animations){
    while(animations.length > 0){
        const delta_time = yield;
        for(const animation_iterator of animations){
            const state = animation_iterator.next(delta_time);
            if(state.done)
                return;
        }
    }
}

function* wait(duration_ms){
    debug.assertion(()=>typeof duration_ms === "number");
    let time_since_start = 0;
    while(time_since_start < duration_ms){
        const delta_time = yield;
        debug.assertion(()=>typeof(delta_time) === 'number');
        time_since_start += delta_time;
    }
    return time_since_start;
}


function* wait_while(predicate){
    debug.assertion(()=>predicate instanceof Function);
    let time_since_start = 0;
    while(predicate()){
        const delta_time = yield;
        debug.assertion(()=>typeof(delta_time) === 'number');
        time_since_start += delta_time;
    }
    return time_since_start;
}

function* wait_until(predicate){
    return wait_while(not(predicate));
}


function* delay(duration_ms, animation_function){
    yield* wait(duration_ms);
    yield* animation_function();
}

class CancelToken {};

// Animations that must be executed together.
class AnimationGroup {
    animations = [];

    update(delta_time){
        this.animations.forEach((animation, idx) => {
            const animation_state = animation.iterator.next(delta_time);
            if(animation_state.done){
                this.animations.splice(idx, 1);
                animation.resolver(animation_state.value); // Notify promise that this animation is finished.
            }
        });
    }

    // Start an animation and return a Promise for sequencing.
    // Here an animation is a generator object (probably obtained by calling a coroutine).
    play(animation_iterator){
        const animation_state = animation_iterator.next(0); // Get to the first step of the animation
        if(animation_state.done){ // Skip when there was actually no animation
            const promise = Promise.resolve(animation_state.value);
            promise.cancel = function(){}; // All promises from this function must have a cancel function.
            return promise;
        }

        let resolver;
        const promise = new Promise(resolve => resolver = resolve);

        const animation = {
            iterator: animation_iterator,
            resolver: resolver,
        };
        this.animations.push(animation);

        promise.cancel = ()=>{
            this.animations.slice(this.animations.indexOf(animation), 1);
            animation.resolver(new CancelToken());
        };

        return promise;
    }

    clear() {
        this.animations.forEach(animation => animation.resolver(new CancelToken()));
        this.animations = [];
    }

    get animation_count() { return this.animations.length; }

};


