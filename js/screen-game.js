export {
    GameScreen,

}


import * as game_input from "./game-input.js";
import { GameView } from "./game-view.js";
import { Game } from "./game.js";
import { make_test_world } from "./testing/test-level.js";
import { Screen } from "./screen.js";

import * as level1 from "./levels/level1.js";

class GameScreen extends Screen {

    *enter(level){
        if(level === "test"){
            this.game = new Game(make_test_world());
        } else {
            this.game = new Game(level1.generate_world());
        }

        this.game_view = new GameView(this.game);
        this.game_view.update(0);
        yield* super.enter();

        game_input.begin_game(this.game, this.game_view);
    }

    *leave(){
        game_input.end_game();

        yield* super.leave();
        // ...
        delete this.game;
        delete this.game_view;
    }

    update(delta_time){
        if(this.is_fading)
            return;

        game_input.update(delta_time);
        this.game_view.update(delta_time);
    }

    display(canvas_context){
        this.game_view.render_graphics();

        super.display(canvas_context)
    }

};








