import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { sprite_defs } from "../game-assets.js";

import * as editor from "../editor.js";
import { CharacterView } from "../view/character-view.js";
import { GameView } from "../game-view.js";
import { Character } from "../core/character.js";
import { current_game_view } from "../main.js";
import * as anim from "../system/animation.js";

export {
    Rule_GameOver,
    Rule_BasicActions,
    Rule_LevelExit,
    Wait,
    Waited,
    GameOver,
    PlayerExitLevel,
};

// That actor decided to take a pause.
class Waited extends concepts.Event {
    constructor(character){
        console.assert(character instanceof Character);
        super({
            allow_parallel_animation: true,
            description: `Entity ${character.id} Waited`,
        });
        this.character_id = character.id;
        this.character_position = character.position;
    }

    get focus_positions() { return [ this.character_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const character_view = game_view.get_entity_view(this.character_id);
        console.assert(character_view instanceof CharacterView);
        yield* anim.wait(333);
    }
};

// Action: Wait. Do Nothing. Almost like sleep but not quite.
class Wait extends concepts.Action {
    icon_def = sprite_defs.icon_action_wait;

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


// Check if that world is in a state where the game is over.
function is_game_over(world){
    // Currently, Game Over is when there is no player characters in game anymore.
    // Note that this is different from characters controlled by the player (Actor.decide_next_action() returns null)
    // but not being the player.
    for(const character of world.bodies){
        console.assert(character instanceof Character);
        if(character.is_player_actor) // found a player character: not game over
            return false;
    }
    return true; // didn't found any player character: game over
}

class GameOver extends concepts.Event {
    constructor(){
        super({
            description: "Game Over condition detected"
        });
    }
    get is_world_event() { return true; }

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
    constructor(character){
        console.assert(character instanceof Character);
        super({
            description: `Player character ${character.id} exited the level!`
        });
        this.character_id = character.id;
        this.exit_position = character.position;
    }

    get is_world_event() { return true; }

    get focus_positions() { return [ this.exit_position ]; }

    *animation(game_view){
        console.assert(game_view instanceof GameView);
        const character_view = game_view.get_entity_view(this.character_id);
        console.assert(character_view instanceof CharacterView);

        ///////////////////////////////////////////////////////////////
        // TEMPORARY ANIMATION
        editor.set_central_text("YOU WIN THIS LEVEL! - LOADING NEXT LEVEL ...");
        current_game_view.clear_focus();
        yield current_game_view.center_on_position(character_view.game_position);
        yield* anim.wait(4000);
        window.location.reload(); // TODO: replace by proper handling of the level exit
    }
};



class Rule_LevelExit extends concepts.Rule {
    update_world_after_character_turn(world, character_body){
        if(character_body.is_player_actor){ // Only check player bodies (only the player can exit the level).
            const exit_positions = world._surface_tile_grid.matching_positions(tile_id => tile_id == tiles.ID.EXIT); // TODO: keep a cache until the world's tiles have changed?
            if(exit_positions.some(position => character_body.position.equals(position))){
                world.is_finished = true;
                return [ new PlayerExitLevel(character_body) ];
            }
        }
        return [];
    }


}