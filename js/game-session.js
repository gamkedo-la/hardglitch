export {
    GameSession
}

import * as debug from "./system/debug.js";
import * as game_input from "./game-input.js";
import { Game } from "./game.js";
import { GameView } from "./game-view.js";
import { World } from "./core/concepts.js";
import { Character } from "./core/character.js";

// Gather all the data and systems that are needed to play a game level.
// This is manipulated by some other systems, like the screen state, the game-input system, the editor etc.
class GameSession {

    constructor(level_generator, open_menu, player_character){
        const world = level_generator();
        debug.assertion(()=>world instanceof World);
        this.game = new Game(world, player_character);
        this.view = new GameView(this.game, open_menu);
        // Lock the actions interfaces until we are ready.
        this.view.ui.lock_actions();
        this.view.clear_turn_message();
        this.view.clear_highlights_basic_actions();
    }

    get is_game_finished() { return this.game.is_finished; }
    get is_any_player_character_alive() { return this.game.player_characters.length > 0; }
    get is_player_character_exiting() { return this.game.world.exiting_character instanceof Character && this.game.world.exiting_character.is_player_actor; }

    get world() { return this.game.world; }

    start(){
        game_input.begin_game(this);
        this.view.ui.unlock_actions();
        this.view.refresh();
        this.view.show_turn_message();
    }

    stop(){
        game_input.end_game();
    }

    update(delta_time, config){
        game_input.update(delta_time, config);

        this.view.update(delta_time);
    }

    display(canvas_context){
        this.view.render_graphics(canvas_context);
    }

    on_canvas_resized(){
        this.view.on_canvas_resized();
    }

};



