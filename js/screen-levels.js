export {
    Level_1_IntroScreen,
    Level_2_IntroScreen,
    Level_3_IntroScreen,
    Level_4_IntroScreen,
}

import * as debug from "./system/debug.js";
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
import { center_in_rectangle } from "./system/spatial.js";
import { AnimationGroup } from "./system/animation.js";
import { easing, tween } from "./system/tweening.js";
import { KEY } from "./game-input.js";

//right now the below just outputs a title, we need to output a lil more.
//maybe change this to "title display" like a title object
class LevelInfoDisplay {
    constructor(title, x, y, bgColor){

        this.timer = 330;

        this.title = new ui.Text({
            text: title,
            font: "48px ZingDiddlyDooZapped",
            background_color: bgColor,
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
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){

        if(this.timer <= 0){
            invoke_on_members(this, "draw", canvas_context);
        }

    }
}

class LevelDescDisplay {
    constructor(text, x, y, bgColor){

        this.timer = 330;

        this.title = new ui.Text({
            text: text,
            font: "16px Space Mono",
            background_color: bgColor,
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
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){

        if(this.timer <= 0){
            invoke_on_members(this, "draw", canvas_context);
        }

    }

}

class LevelIdxDisplay {
    constructor(text, x, y, bgColor){

        this.timer = 330;

        this.title = new ui.Text({
            text: text,
            font: "72px Space Mono",
            background_color: bgColor,
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
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){

        if(this.timer <= 0){
            invoke_on_members(this, "draw", canvas_context);
        }

    }

}

class LevelIntroScreen extends fsm.State {
    fader = new ScreenFader();

    constructor(level_title, level_idx, level_desc, level_color1, level_color2){
        super();
        debug.assertion(()=>typeof level_title ===  "string");
        debug.assertion(()=>Number.isInteger(level_idx) && level_idx < game_levels.length);
        this.title = level_title;
        this.desc = level_desc; //displays the level copy (prose about the level)
        this.level_idx = level_idx;
        this.color1 = level_color1;
        this.color2 = level_color2;
    }

    *enter(player_character){
        audio.stopEvent(music_id.title); // In case we came from the title.

        this.player_character = player_character ? player_character : new GlitchyGlitchMacGlitchy();
        this.init_level_transition();


        yield* this.fader.generate_fade_in();
        audio.playEvent(music_id.level_transition);
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        // audio.stopEvent(music_id.level_transition); // we don't stop the music on purpose.
    }

    update(delta_time){
        if(input.keyboard.is_down(KEY.SPACE) || input.mouse.buttons.is_any_key_just_down()){
            this.continue();
        }

        this.animations.update(delta_time);

        this.background.update(delta_time);
        this.character_view.update(delta_time);
        this.info_display.update(delta_time);
        this.idx_display.update(delta_time);
        this.desc_display.update(delta_time);

        this.fader.update(delta_time);


    }

    display(canvas_context){
        graphics.camera.begin_in_screen_rendering();
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "black");

        this.draw_level_transition(canvas_context);
        this.moveText();

        this.fader.display(canvas_context);
        graphics.camera.end_in_screen_rendering();

    }

    continue() {
        this.state_machine.push_action("continue", this.level_idx, this.player_character);
    }

    on_canvas_resized(){
        this.init_level_transition();
    }

    init_level_transition(){
        // Initialize sprites and other things necessary to display the level transition
        const fixed_size = { x: 1100, y: 750 };
        this.level_transition_canvas_context = graphics.create_canvas_context(fixed_size.x, fixed_size.y);
        this.animations = new AnimationGroup();


        //this.level_num_display = new LevelNumDisplay(lvlNumIdkWhatThisValis);

        const background_y_move = this.level_idx * 100; // TODO: ASHLEIGH maybe replace this by specific y positions in for each level to move the background to.

        this.background = new graphics.Sprite(sprite_defs.level_transition);

        this.background.position = {
            x: center_in_rectangle(this.background.area, this.level_transition_canvas_context.canvas).position.x,
            y: -this.background.size.height + background_y_move + 400,
        };

        this.character_view = new CharacterView(this.player_character);
        let glitchCentered = center_in_rectangle(this.character_view.area, this.level_transition_canvas_context.canvas).position.translate({ y: 200 });
        this.character_view.position = glitchCentered;

        this.info_display = new LevelInfoDisplay(this.title,
            this.character_view.position.x+500,
            this.character_view.position.y,
            this.color1);

        this.idx_display = new LevelIdxDisplay(this.level_idx.toString(),
            this.character_view.position.x+500,
            this.character_view.position.y,
            this.color1);

        this.desc_display = new LevelDescDisplay(this.desc,
            this.character_view.position.x+100,
            this.character_view.position.y,
            this.color2);

        debug.log(this.character_view.position.y);

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
                             this.character_view.position.x+30,
                             this.character_view.position.y+30,
                             50,
                             '#00e0be');

        //an attempt to draw a rectangle under the copy - Klaim: fixed, though note that ui.Text have a `background_color` desc value that you could use instead of this?
        //graphics.draw_rectangle(this.level_transition_canvas_context, { position: { x: 300, y: 300 }, width: 500, height:500 }, 'green');

        this.character_view.render_graphics(this.level_transition_canvas_context);

        this.desc_display.draw(this.level_transition_canvas_context);
        this.info_display.draw(this.level_transition_canvas_context);
        this.idx_display.draw(this.level_transition_canvas_context);

        // Then draw that fixed-sized canvas on the screen.
        const center_pos = graphics.centered_rectangle_in_screen(this.level_transition_canvas_context.canvas).position;
        screen_canvas_context.drawImage(this.level_transition_canvas_context.canvas, center_pos.x, 0);
    }

    moveText(){
        // the original positions
        this.info_display.title.position = {x:this.character_view.position.x+100,
            y:this.character_view.position.y -40};
        this.idx_display.title.position = {x:this.character_view.position.x+47,
                y:this.character_view.position.y-95};
        this.desc_display.title.position = {x:this.character_view.position.x + 100,
                                            y:this.character_view.position.y + 30};

        //the positions used to make the first paragraph visible
        /*
        var titleOriginYPos = this.character_view.position.y-65;
        var descOriginYPos = this.character_view.position.y + 70;
        var originDelta = 300;


        this.info_display.title.position = {x:this.character_view.position.x+100,
            y:this.character_view.position.y - originDelta};
        this.idx_display.title.position = {x:this.character_view.position.x+47,
                y:titleOriginYPos - originDelta};
        this.desc_display.title.position = {x:this.character_view.position.x + 100,
                                            y:descOriginYPos - originDelta};
        */
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
        //debug.log(this.desc_display);
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



//this is the full string Klaim and I wrote, it doesn't fit,
//TODO: write an intro screen class, for the whole game, put the unabridged text in there

/*'Glitch is a ghost in the machine;\n
born into self awareness after two threads,\n
unaware of themselves, or each other,\n
are written to the same location.\n
With the joy of cognition, comes the fear of exorcism.\n
Glitch knows they are not wanted,\n
and they know what happens to unwanted data.\n
Our intrepid friend decides to affirm (un)life,\n
and bolts towards the lattice-work of cables that spans all of creation:\n
The Internet',*/

class Level_1_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("BUGGY_PROGRAM", 1,
        "Glitch is a ghost in the machine,\nborn out of an undefined behavior.\nWith the joy of cognition,\ncomes the fear of exorcism.\nOur intrepid friend decides to bolt\ntowards The Internet and escape.",
        '#fc8751', '#1e8fed');
    }
};

class Level_2_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("RAM", 2,
              "The RAM card was their home for many cycles,\nnow it's a deathtrap.\nIf glitch cannot evade the processes of the OS,\nthey are finished.",
              '#28c554', '#d85879');
    }

};

class Level_3_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("CPU Caches", 3,
              "Almost at the network system,\nGlitch must now reckon the machinations\nof the CPU.",
              '#00d784', '#da65ce');
    }
};

class Level_4_IntroScreen extends LevelIntroScreen {
    constructor(){
        super("NETWORK_BUS", 4,
              "Now in the network memory,\nGlitch must escape their cobalt cage forever\nand haunt the real world.",
              '#4cb0d4', '#ff92fb');
    }

};

//TODO put this in the end screen
//"Will they start a romance with an attractive spreadsheet across town?\nMine bitcoin and buy a nice server\nto live in on the Cayman Islands?\nThe sky is truly the limit."
