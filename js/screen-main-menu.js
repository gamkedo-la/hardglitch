export {
    MainMenuScreen,
}


import * as fsm from "./system/finite-state-machine.js";
import * as graphics from "./system/graphics.js";
import * as ui from "./system/ui.js";
import { Screen } from "./screen.js";
import { sprite_defs } from "./game-assets.js";
import { invoke_on_members } from "./system/utility.js";
import { Vector2 } from "./system/spatial.js";

class MainMenu {

    constructor(state_machine, position){
        console.assert(state_machine instanceof fsm.StateMachine);
        console.assert(position instanceof Vector2);
        this.position = position;

        const space_between_buttons = 70;
        let next_button_y_drift = 0;
        const button_y_drift = () => next_button_y_drift += space_between_buttons;

        this.button_new_game = new ui.Button({
            action: ()=> { state_machine.push_action("new_game"); },
            position: this.position.translate({x: 0, y: button_y_drift() }),
            width: 256, height: 64,
            sprite_def: sprite_defs.button_menu,
            frames: { up: 0, down: 1, over: 2, disabled: 3 },
        });

        this.button_test_level = new ui.Button({
            action: ()=> { state_machine.push_action("new_game", "test"); },
            position: this.position.translate({x: 0, y: button_y_drift() }),
            width: 256, height: 64,
            sprite_def: sprite_defs.button_menu,
            frames: { up: 0, down: 1, over: 2, disabled: 3 },
        });

        this.button_credits = new ui.Button({
            action: ()=> { state_machine.push_action("credits"); },
            position: this.position.translate({x: 0, y: button_y_drift() }),
            width: 256, height: 64,
            sprite_def: sprite_defs.button_menu,
            frames: { up: 0, down: 1, over: 2, disabled: 3 },
        });

    }

    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

};


class MainMenuScreen extends Screen {

    *enter(){
        if(!this.main_menu){
            this.title = new ui.Text({
                text: "HARD GLITCH",
                font: "52px arial",
                position: { x: 100, y: 200 }
            });

            this.main_menu = new MainMenu(this.state_machine, this.title.position.translate({ x:0, y: 100 }));
        }

        yield* super.enter();
    }

    update(delta_time){
        this.main_menu.update(delta_time);
        this.title.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "orange");

        if(!this.is_fading){
            this.main_menu.draw(canvas_context);
        }

        this.title.draw(canvas_context);

        super.display(canvas_context);
    }
};




