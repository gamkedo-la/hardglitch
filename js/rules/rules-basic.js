import * as concepts from "../core/concepts.js";

export {
    Rule_GameOver,
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

// Check if that world is in a state where the game is over.
function is_game_over(world){
    // Currently, Game Over is when there is no player characters in game anymore.
    // Note that this is different from characters controlled by the player (Actor.decide_next_action() returns null)
    // but not being the player (the Actor inherits from Player).
    for(const character_body of world.bodies){
        console.assert(character_body instanceof concepts.Body);
        if(character_body.actor instanceof concepts.Player) // found a player character: not game over
            return false;
    }
    return true; // didn't found any player character: game over
}

class GameOver extends concepts.Event {
    constructor(){
        super(0); // body_id==0 means "the world"
    }
}

class Rule_GameOver extends concepts.Rule {

    check_game_over(world){
        world.is_game_over = is_game_over(world);
        if(world.is_game_over)
            return [ new GameOver() ]; // This event will notify the rest of the code that the game is over.
        else
            return []; // Nothing happens otherwise.
    }

    // We check after each actor's turn.
    update_world_after_actor_turn(world){
        return this.check_game_over(world);
    }

    // We also check at the beginning of each game turn.
    update_world_at_the_beginning_of_game_turn(world){
        return this.check_game_over(world);
    }
};