export {
    Rule_GameOver,
    Rule_BasicActions,
    Rule_LevelExit,
    Rule_Destroy_NoIntegrity,
    Wait,
    Waited,
    GameOver,
    PlayerExitLevel,
    fail_game,
};

import * as debug from "../system/debug.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import { sprite_defs } from "../game-assets.js";

import * as editor from "../editor.js"; // FIXME: removing this unused import will trigger a dependency cycle error????
import { CharacterView } from "../view/character-view.js";
import { GameView } from "../game-view.js";
import { Character } from "../core/character.js";
import * as anim from "../game-animations.js";
import { destroy_entity } from "./destruction.js";
import * as audio from "../system/audio.js";
import { grid_ID } from "../definitions-world.js";
import { auto_newlines } from "../system/utility.js";

// That actor decided to take a pause.
class Waited extends concepts.Event {
    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super({
            allow_parallel_animation: true,
            description: `Entity ${character.id} Waited`,
        });
        this.character_id = character.id;
        this.character_position = character.position;
    }

    get focus_positions() { return [ this.character_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const character_view = game_view.focus_on_entity(this.character_id);
        debug.assertion(()=>character_view instanceof CharacterView);
        yield* anim.wait(game_view.fx_view, character_view, 333);
    }
};

// Action: Wait. Do Nothing. Almost like sleep but not quite.
class Wait extends concepts.Action {
    static get icon_def(){ return sprite_defs.icon_action_wait; }
    static get action_type_name() { return "Wait"; }
    static get action_type_description() { return auto_newlines("Pass the current turn without spending Action Points.\nThe AP left will be usable next turn.", 35); }
    static get costs(){
        return {
            action_points: { value: 0 },
        };
    }

    constructor(character){
        debug.assertion(()=>character instanceof Character);
        super("wait", "Wait", undefined,
        ); // Costs the rest of the current AP of the character
        this.is_generated = true;
    }

    execute(world, character) {
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>character instanceof Character);
        character.skip_turn = true;
        return [ new Waited(character) ];
    }

    static get range() { }
};

// The most basic rules.
class Rule_BasicActions extends concepts.Rule {
    get_actions_for(character, world) {
        debug.assertion(()=>character instanceof Character);

        return {
            wait: new Wait(character) // Anyone can "wait".
        };
    }
};


// Check if that world is in a state where the game is over.
function is_game_over(world){
    // Currently, Game Over is when there is no player characters in game anymore.
    // Note that this is different from characters controlled by the player (Actor.decide_next_action() returns null)
    // but not being the player.
    for(const character of world.bodies){
        debug.assertion(()=>character instanceof Character);
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

    get focus_positions() { return []; }
    get is_world_event() { return true; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        game_view.show_central_message("  GAME OVER!\nPRESS ANY KEY");
        while(true) yield;
    }
}

function fail_game(world){
    world.is_finished = true;
    return [ new GameOver() ]; // This event will notify the rest of the code that the game is over.
}

class Rule_GameOver extends concepts.Rule {

    check_game_over(world){
        if(world.is_finished) // The game is already finished.
            return [];

        const failed = is_game_over(world);
        if(failed)
            return fail_game(world);
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
        debug.assertion(()=>character instanceof Character);
        super({
            description: `Player character ${character.id} exited the level!`
        });
        this.character_id = character.id;
        this.exit_position = character.position;
    }

    get is_world_event() { return true; }

    get focus_positions() { return [ this.exit_position ]; }

    *animation(game_view){
        debug.assertion(()=>game_view instanceof GameView);
        const character_view = game_view.focus_on_entity(this.character_id);
        debug.assertion(()=>character_view instanceof CharacterView);

        game_view.show_central_message("YOU FOUND AN EXIT!\n     PRESS ANY KEY");
        game_view.clear_focus();
        let ready_to_exit = false;
        game_view.center_on_position(character_view.game_position).then(()=> ready_to_exit = true );
        audio.playEvent("exit_bus");
        while(!ready_to_exit) yield;
        debug.log("here before exited");
        yield* anim.exited(game_view.fx_view, character_view);
        debug.log("here after exited");
        while(true) yield;
    }
};



class Rule_LevelExit extends concepts.Rule {

    any_player_character_on_exit_tile_exits_level(world){
        debug.assertion(()=>world instanceof concepts.World);

        if(world.is_finished) // The game is already finished.
            return [];

        const exit_positions = world.grids[grid_ID.surface].matching_positions(tile_id => tile_id == tiles.ID.EXIT);
        const player_characters = world.bodies.filter(character => character.is_player_actor);

        for(const player_character of player_characters){
            debug.assertion(()=>player_character instanceof Character)
            const player_position = player_character.position;
            if(exit_positions.some(position => player_position.equals(position))){
                world.is_finished = true;
                world.exiting_character = player_character;
                return [ new PlayerExitLevel(player_character) ];
            }
        }
        return [];
    }

    update_world_after_character_turn(world){
        return this.any_player_character_on_exit_tile_exits_level(world);
    }

    update_world_at_the_beginning_of_game_turn(world){
        return this.any_player_character_on_exit_tile_exits_level(world);
    }

}


class Rule_Destroy_NoIntegrity extends concepts.Rule {

    destroy_characters_with_no_integrity(world){
        const events = [];
        world.bodies.forEach(character =>{
            debug.assertion(()=>character instanceof Character);
            if(character.stats.integrity.value <= 0){
                events.push(...destroy_entity(character, world));
            }
        });
        return events;
    }

    // We check after each character's turn.
    update_world_after_character_turn(world){
        return this.destroy_characters_with_no_integrity(world);
    }

    // We also check at the beginning of each game turn.
    update_world_at_the_beginning_of_game_turn(world){
        return this.destroy_characters_with_no_integrity(world);
    }
};