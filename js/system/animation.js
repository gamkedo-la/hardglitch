// This file provides tools for animating stuffs procedurally,
// it uses coroutines for combining and sequencing animations.

export {
    in_parallel,

}



function *in_parallel(...animations){
    while(animations.length > 0){
        const delta_time = yield;
        animations.map((animation, index)=>{
            const state = animation.next(delta_time);
            if(state.done)
                animations.splice(index, 1);
        });
    }
}

// Animations that must be executed together.
class AnimationGroup {
    animations = [];

    update(delta_time){

    }

    // Start an animation and return a Promise for sequencing.
    // Here an animation is a generator object (probably obtained by calling a coroutine).
    play(animation_iterator){
        const animation_state = animation_iterator.next(); // Get to the first step of the animation
        if(animation_state.done) // Skip when there was actually no animation
            return Promise.resolve();

        let resolver;
        const promise = new Promise(resolve=>resolver = resolve);
        this.animations.push({
            iterator: animation_iterator,
            resolver: resolver,
        });

        return promise;
    }

    get animation_count() { return this.animations.length; }

};


