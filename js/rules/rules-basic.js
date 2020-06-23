import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import * as graphics from "../system/graphics.js";

import * as editor from "../editor.js";

export {
    Rule_GameOver,
    Rule_BasicActions,
    Rule_LevelExit,
    Wait,
    Waited,
    GameOver,
    PlayerExitLevel,
    animation_wait_event
};

// That actor decided to take a pause.
class Waited extends concepts.Event {
    constructor(body){
        super(body.body_id, {
            allow_parallel_animation: true,
        });
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
    // but not being the player.
    for(const character_body of world.bodies){
        console.assert(character_body instanceof concepts.Body);
        if(character_body.is_player_actor) // found a player character: not game over
            return false;
    }
    return true; // didn't found any player character: game over
}

class GameOver extends concepts.Event {
    constructor(){
        super(0); // body_id==0 means "the world"
    }

    *animation(){ // TEMPORARY ANIMATION
        editor.set_central_text("GAME OVER! - RELOAD TO RESTART");
        while(true) yield;
    }
}

class Rule_GameOver extends concepts.Rule {

    check_game_over(world){
        world.is_finished = is_game_over(world);
        if(world.is_finished)
            return [ new GameOver() ]; // This event will notify the rest of the code that the game is over.
        else
            return []; // Nothing happens otherwise.
    }

    // We check after each character's turn.
    update_world_after_character_turn(world){
        return this.check_game_over(world);
    }

    // We also check at the beginning of each game turn.
    update_world_at_the_beginning_of_game_turn(world){
        return this.check_game_over(world);
    }
};


class PlayerExitLevel extends concepts.Event {
    constructor(){
        super(0);
    }

    *animation(){ // TEMPORARY ANIMATION
        let time_left = 4000;
        editor.set_central_text("YOU WIN THIS LEVEL! - LOADING NEXT LEVEL ...");
        while(time_left > 0){
            const delta_time = yield;
            time_left -= delta_time;
        }
        window.location.reload(); // TODO: replace by proper handling of the level exit
    }
};



class Rule_LevelExit extends concepts.Rule {
    update_world_after_character_turn(world, character_body){
        if(character_body.is_player_actor){ // Only check player bodies (only the player can exit the level).
            const exit_positions = world._surface_tile_grid.matching_positions(tile_id => tile_id == tiles.ID.EXIT); // TODO: keep a cache until the world's tiles have changed?
            if(exit_positions.some(position => character_body.position.equals(position))){
                world.is_finished = true;
                return [ new PlayerExitLevel() ];
            }
        }
        return [];
    }


}