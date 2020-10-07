export {
    Level_1_IntroScreen,
    Level_2_IntroScreen,
    Level_3_IntroScreen,
    Level_4_IntroScreen,
}

import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import * as input from "./system/input.js";
import * as fsm from "./system/finite-state-machine.js";
import * as ui from "./system/ui.js";
import { ScreenFader } from "./system/screenfader.js";
import { invoke_on_members } from "./system/utility.js";
import { game_levels } from "./definitions-world.js";
import { music_id } from "./game-assets.js";

//ashleigh is trying to create a const to pass in the *entry coroutine
// I just realized this is *absolutely* not where these lines would live
/*
let glitch = new GlitchyGlitchMacGlitchy();
const character_view = new CharacterView(glitch);
*/

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

    *enter(player_character){
        this.player_character = player_character;
        if(!this.info_display){
            this.on_canvas_resized();
        }
        audio.stopEvent(music_id.title); // In case we came from the title.
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
        this.state_machine.push_action("continue", this.level_idx, this.player_character);
    }

    on_canvas_resized(){
        this.info_display = new LevelInfoDisplay(this.title);
    }

};

class Level_1_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 1 - WIP (need your help)", 0);
    }

    *enter(player_character){
        yield* super.enter(player_character);
    }

    *leave(){
        yield* super.leave();
    }
};

class Level_2_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 2 - WIP (need your help)", 1);
    }

    *enter(player_character){
        yield* super.enter(player_character);
    }

    *leave(){
        yield* super.leave();
    }
};

class Level_3_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 3 - WIP (need your help)", 2);
    }


    *enter(player_character){
        yield* super.enter(player_character);
    }

    *leave(){
        yield* super.leave();
    }
};

class Level_4_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("Intro to Level 4 - WIP (need your help)", 3);
    }


    *enter(player_character){
        yield* super.enter(player_character);
    }

    *leave(){
        yield* super.leave();
    }
};

