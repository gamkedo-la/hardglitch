export {
    Level_1_IntroScreen,
    Level_2_IntroScreen,
    Level_3_IntroScreen,
    Level_4_IntroScreen,
}

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import { ScreenFader } from "./system/screenfader.js";
import { invoke_on_members } from "./system/utility.js";

class LevelInfoDisplay {
    constructor(title){

        this.title = new ui.Text({
            text: title,
            font: "60px ZingDiddlyDooZapped",
            background_color: "#ffffff00",
        });

        this.title.position = graphics.centered_rectangle_in_screen(this.title.area).position;

    }


    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

}

class LevelIntroScreen extends fsm.State {
    fader = new ScreenFader();

    constructor(level_title){
        super();
        this.title = level_title;
    }

    *enter(){
        if(!this.info_display){
            this.on_canvas_resized();
        }

        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
    }

    update(delta_time){
        if(input.keyboard.is_any_key_just_down() || input.mouse.buttons.is_any_key_just_down()){
            this.continue();
        }

        this.info_display.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "grey");

        this.info_display.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    continue() {
        this.state_machine.push_action("continue");
    }

    on_canvas_resized(){
        this.info_display = new LevelInfoDisplay(this.title);
    }

};

class Level_1_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 1 - WIP (need your help)");
    }
};

class Level_2_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 2 - WIP (need your help)");
    }
};

class Level_3_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 3 - WIP (need your help)");
    }
};

class Level_4_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 4 - WIP (need your help)");
    }
};
