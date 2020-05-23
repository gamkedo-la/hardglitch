import * as concepts from "../core/concepts.js";

export {
    Rule_BasicActions,
    Wait,
    Waited,
    animation_wait_event
};

// That actor decided to take a pause.
class Waited extends concepts.Event {
    constructor(body){
        super(body.body_id);
    }

    *animation(body_view){
        yield* animation_wait_event(body_view);
    }
};

// Action: Wait. Do Nothing. Almost like sleep but not quite.
class Wait extends concepts.Action {
    constructor(){
        super("wait", "Wait");
    }

    execute(world, body) {
        return [ new Waited(body) ];
    }
};

// The most basic rules.
class Rule_BasicActions extends concepts.Rule {
    get_actions_for(body, world) {

        return {
            wait: new Wait() // Anyone can "wait".
        };
    }
};

// Animates the view for this event
function* animation_wait_event(body_view) {
    const start_time = Date.now();
    const duration_ms = 333;
    const target_time = start_time + duration_ms;
    while(Date.now() < target_time){
        yield;
    }
}

