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
import { music_id, sprite_defs } from "./game-assets.js";
import { CharacterView } from "./view/character-view.js";
import { GlitchyGlitchMacGlitchy } from "./characters/glitch.js";
import { center_in_rectangle, Vector2, Vector2_origin } from "./system/spatial.js";
import { AnimationGroup, in_parallel, wait } from "./system/animation.js";
import { easing, tween } from "./system/tweening.js";
import { draw_circle } from "./system/graphics.js";
import { draw_rectangle } from "./system/graphics.js";



//right now the below just outputs a title, we need to output a lil more.
//maybe change this to "title display" like a title object
class LevelInfoDisplay {
    constructor(title){

        this.title = new ui.Text({
            text: title,
            font: "48px ZingDiddlyDooZapped",
            background_color: "#ffffff0a",
            color: "white",
        });

        this.title.position = {
            x: graphics.centered_rectangle_in_screen(this.title.area).position.x,
            y: this.title.height + 12,
        };

    }


    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

}

class LevelDescDisplay {
    constructor(text, x, y){

        this.timer = 100;

        this.title = new ui.Text({
            text: text,
            font: "16px Space Mono",
            background_color: "#ffffff0a",
            color: "white",
        });

        this.title.position = {
            x: x,
            y: y
        };
    }

    update(delta_time){
        if(this.timer > 0){
            this.timer--;
        }
        console.log(this.timer);
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        if(this.timer <= 0){
            console.log('COUNTDOWN REACHED');
            invoke_on_members(this, "draw", canvas_context);
        }

    }

}

class LevelIntroScreen extends fsm.State {
    fader = new ScreenFader();

    constructor(level_title, level_idx, level_desc){
        super();
        console.assert(typeof level_title ===  "string");
        console.assert(Number.isInteger(level_idx) && level_idx < game_levels.length);
        this.title = level_title;
        this.desc = level_desc; //displays the level copy (prose about the level)
        this.level_idx = level_idx;
    }

    *enter(player_character){

        this.player_character = player_character ? player_character : new GlitchyGlitchMacGlitchy();
        this.init_level_transition();
        this.on_canvas_resized();

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

        this.animations.update(delta_time);

        this.background.update(delta_time);
        this.character_view.update(delta_time);
        this.info_display.update(delta_time);
        this.desc_display.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.camera.begin_in_screen_rendering();
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");

        this.draw_level_transition(canvas_context);
        this.info_display.draw(canvas_context);

        this.fader.display(canvas_context);
        graphics.camera.end_in_screen_rendering();
    }

    continue() {
        this.state_machine.push_action("continue", this.level_idx, this.player_character);
    }

    on_canvas_resized(){
        this.info_display = new LevelInfoDisplay(this.title);
        console.log(this.desc_display);
    }

    init_level_transition(){
        // Initialize sprites and other things necessary to display the level transition
        const fixed_size = { x: 1100, y: 750 };
        this.level_transition_canvas_context = graphics.create_canvas_context(fixed_size.x, fixed_size.y);
        this.animations = new AnimationGroup();

        this.desc_display = new LevelDescDisplay(this.desc, 500, 500);
        //this.level_num_display = new LevelNumDisplay(lvlNumIdkWhatThisValis);

        const background_y_move = (this.level_idx + 1) * 100; // TODO: ASHLEIGH maybe replace this by specific y positions in for each level to move the background to.

        this.background = new graphics.Sprite(sprite_defs.level_transition);

        this.background.position = {
            x: center_in_rectangle(this.background.area, this.level_transition_canvas_context.canvas).position.x,
            y: -this.background.size.height + background_y_move + 400,
        };

        this.character_view = new CharacterView(this.player_character);
        let glitchCentered = center_in_rectangle(this.character_view.area, this.level_transition_canvas_context.canvas).position.translate({ y: 200 });
        this.character_view.position = glitchCentered;
        console.log(glitchCentered);

        this.animations.play(this.animation());
        this.animations.play(this.move_background(background_y_move));
        this.animations.play(this.animateCopy());
    }

    draw_level_transition(screen_canvas_context){
        this.level_transition_canvas_context.fillStyle = "black"; // Background color
        this.level_transition_canvas_context.clearRect(0, 0, this.level_transition_canvas_context.canvas.width, this.level_transition_canvas_context.canvas.height);

        // We draw all the content of the level transition in the fixed-size canvas...
        this.background.draw(this.level_transition_canvas_context);
        graphics.draw_circle(this.level_transition_canvas_context,
                             this.character_view.position.x,
                             this.character_view.position.y,
                             100,
                             'red');

        //an attempt to draw a rectangle under the copy - Klaim: fixed, though note that ui.Text have a `background_color` desc value that you could use instead of this?
        graphics.draw_rectangle(this.level_transition_canvas_context, { position: { x: 300, y: 300 }, width: 500, height:500 }, 'green');

        this.character_view.render_graphics(this.level_transition_canvas_context);

        this.desc_display.draw(this.level_transition_canvas_context);

        // Then draw that fixed-sized canvas on the screen.
        const center_pos = graphics.centered_rectangle_in_screen(this.level_transition_canvas_context.canvas).position;
        screen_canvas_context.drawImage(this.level_transition_canvas_context.canvas, center_pos.x, 0);
    }

    *move_background(y_translation){

        const update_background_pos = (new_pos)=>{ this.background.position = new_pos; };

        yield* tween(this.background.position, this.background.position.translate({ y: y_translation }),
            5000, update_background_pos, easing.linear
        );

        //
        //  yield* wait(1000);
        // yield* tween(this.background.position, this.background.position.translate({ y: 200 }),
        //     3000, update_background_pos, easing.linear
        // );
        // yield* tween(this.background.position, this.background.position.translate({ x: -100 }),
        //     500, update_background_pos, easing.linear
        // );
        // yield* tween(this.background.position, this.background.position.translate({ x: 200 }),
        //     500, update_background_pos, easing.linear
        // );

        // yield* in_parallel(
        //     tween(this.background.position, this.background.position.translate({ x: -100 }),
        //         500, update_background_pos, easing.linear
        //     ),
        //     tween(this.background.position, this.background.position.translate({ y: -200 }),
        //         3000, update_background_pos, easing.linear
        //     )
        // );
        //
    }

    *animation(){

        yield * tween(this.character_view.position, this.character_view.position.translate({ y: -20 }),
            4000, (new_pos)=>{ this.character_view.position = new_pos; }, easing.linear
        );

    }

    //animates the level copy(prose)
    *animateCopy(){

        let xPos = this.desc_display.title.position.x //this is the x position of the level desc object
        //console.log(this.desc_display);
        /*
        yield * tween(xPos,
                      xPos + 500,
                      4000,
                      (new_pos)=>{ xPos = new_pos; },
                      easing.linear
        );
        */
    }

};

class Level_1_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("First text", 0, 'This is some prose that will appear in the desc info object bay bee');
    }
};

class Level_2_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("REPLACE THIS TEXT", 1);
    }

};

class Level_3_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("REPLACE THIS TEXT", 2);
    }

};

class Level_4_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("REPLACE THIS TEXT", 3);
    }

};

