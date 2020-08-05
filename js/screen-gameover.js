export {
    GameOverScreen_Success,
    GameOverScreen_Failure,
}

import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import { Color } from "./system/color.js";
import { ScreenFader } from "./system/screenfader.js";

class GameOverScreen_Success extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,255,255);
    }

    *enter(){
        if(!this.message){
            this.message = new ui.Text({
                text: "Congratulations! You escaped the computer and will survive on the internet!",
                position: graphics.canvas_center_position().translate({x:-200, y:0}),
            });
        }
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }

    update(delta_time){
        if(input.keyboard.is_any_key_just_down() || input.mouse.buttons.is_any_key_just_down()){
            this.state_machine.push_action("ok");
        }

        this.message.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "white");

        this.message.draw(canvas_context);

        this.fader.display(canvas_context);
    }


};


class GameOverScreen_Failure extends fsm.State {
    fader = new ScreenFader();

    constructor(){
        super();
        this.fader.color = new Color(255,0,0);
    }

    *enter(){
        if(!this.message){
            this.message = new ui.Text({
                text: "Game Over - Please retry, 'Glitch' needs to escape!",
                position: graphics.canvas_center_position().translate({x:-200, y:0}),
            });
        }
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }

    update(delta_time){
        if(input.keyboard.is_any_key_just_down() || input.mouse.buttons.is_any_key_just_down()){
            this.state_machine.push_action("ok");
        }

        this.message.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "red");

        this.message.draw(canvas_context);

        this.fader.display(canvas_context);
    }

};




