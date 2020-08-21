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
import { game_levels } from "./definitions-world.js";

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

    constructor(level_title, level_idx){
        super();
        console.assert(typeof level_title ===  "string");
        console.assert(Number.isInteger(level_idx) && level_idx < game_levels.length);
        this.title = level_title;
        this.level_idx = level_idx;
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
        this.state_machine.push_action("continue", this.level_idx);
    }

    on_canvas_resized(){
        this.info_display = new LevelInfoDisplay(this.title);
    }

};

class Level_1_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 1 - WIP (need your help)", 0);
    }
};

class Level_2_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 2 - WIP (need your help)", 1);
    }
};

class Level_3_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 3 - WIP (need your help)", 2);
    }
};

class Level_4_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 4 - WIP (need your help)", 3);
    }
};

