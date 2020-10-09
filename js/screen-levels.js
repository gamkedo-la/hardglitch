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

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.camera.begin_in_screen_rendering();
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");
        

        this.draw_level_transition(canvas_context);
        this.info_display.draw(canvas_context);

        //graphics.draw_circle(canvas_context, 500, 500, 100, 'red');
        this.fader.display(canvas_context);
        graphics.camera.end_in_screen_rendering();
    }

    continue() {
        this.state_machine.push_action("continue", this.level_idx, this.player_character);
    }

    on_canvas_resized(){
        this.info_display = new LevelInfoDisplay(this.title);
    }

    init_level_transition(){
        // Initialize sprites and other things necessary to display the level transition
        const fixed_size = { x: 1100, y: 750 };
        this.level_transition_canvas_context = graphics.create_canvas_context(fixed_size.x, fixed_size.y);
        this.animations = new AnimationGroup();
        //this.circlePos = {x: 500, y:500};

        const background_y_move = (this.level_idx + 1) * 100; // TODO: ASHLEIGH maybe replace this by specific y positions in for each level to move the background to.
        //could I make this a prop instead? to be changed in each extension of this class?

        this.background = new graphics.Sprite(sprite_defs.level_transition);

        this.background.position = {
            x: center_in_rectangle(this.background.area, this.level_transition_canvas_context.canvas).position.x,
            y: -this.background.size.height + background_y_move + 400,
        };

        this.character_view = new CharacterView(this.player_character);
        this.character_view.position = center_in_rectangle(this.character_view.area, this.level_transition_canvas_context.canvas)
                                        .position.translate({ y: 200 });

        this.animations.play(this.animation());
        this.animations.play(this.move_background(background_y_move));
    }

    draw_level_transition(screen_canvas_context){
        this.level_transition_canvas_context.fillStyle = "black"; // Background color
        this.level_transition_canvas_context.clearRect(0, 0, this.level_transition_canvas_context.canvas.width, this.level_transition_canvas_context.canvas.height);

        // We draw all the content of the level transition in the fixed-size canvas...
        this.background.draw(this.level_transition_canvas_context);
        this.character_view.render_graphics(this.level_transition_canvas_context);

        // Then draw that fixed-sized canvas on the screen.
        const center_pos = graphics.centered_rectangle_in_screen(this.level_transition_canvas_context.canvas).position;
        screen_canvas_context.drawImage(this.level_transition_canvas_context.canvas, center_pos.x, 0);
    }

    *move_background(y_translation){

        const update_background_pos = (new_pos)=>{ this.background.position = new_pos; };

        yield* tween(this.background.position, this.background.position.translate({ y: y_translation }),
            5000, update_background_pos, easing.linear
        );

        // yield* wait(1000);
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
    }

    *animation(){

        yield * tween(this.character_view.position, this.character_view.position.translate({ y: -20 }),
            4000, (new_pos)=>{ this.character_view.position = new_pos; }, easing.linear
        );

    }

};

class Level_1_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("First text", 0);
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

