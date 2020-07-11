// This file provides tools for animating stuffs procedurally,
// it uses coroutines for combining and sequencing animations.

export {
    AnimationGroup,
    in_parallel,
    wait,
    delay,
}



function* in_parallel(...animations){
    while(animations.length > 0){
        const delta_time = yield;
        animations.map((animation_iterator, index)=>{
            const state = animation_iterator.next(delta_time);
            if(state.done)
                animations.splice(index, 1);
        });
    }
}

function* wait(duration_ms){
    console.assert(Number.isInteger(duration_ms));
    let time_since_start = 0;
    while(time_since_start < duration_ms){
        const delta_time = yield;
        console.assert(Number.isInteger(delta_time));
        time_since_start += delta_time;
    }
    return time_since_start;
}

function* delay(duration_ms, animation_iterator){
    yield* wait(duration_ms);
    yield* animation_iterator;
}

// Animations that must be executed together.
class AnimationGroup {
    animations = [];

    update(delta_time){
        this.animations.map((animation, idx) => {
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
        if(animation_state.done) // Skip when there was actually no animation
            return Promise.resolve(animation_state.value);

        let resolver;
        const promise = new Promise(resolve => resolver = resolve);
        this.animations.push({
            iterator: animation_iterator,
            resolver: resolver,
        });

        return promise;
    }

    get animation_count() { return this.animations.length; }

};


