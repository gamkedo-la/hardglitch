import * as concepts from "../core/concepts.js";

export { BasicRules, Wait, Waited };

// That agent decided to take a pause.
class Waited extends concepts.Event {  };

// Action: Wait. Do Nothing. Almost like sleep but not quite.
class Wait extends concepts.Action {
    execute(world, agent) {
        return [ new Waited(agent) ];
    }
};

// The most basic rules.
class BasicRules extends concepts.Rule {
    get_actions_for(agent, world) {
        return {
            "wait" : new Wait()
        };
    }
};