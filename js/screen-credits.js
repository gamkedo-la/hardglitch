export {
    CreditsScreen,

}

import * as ui from "./system/ui.js";
import * as input from "./system/input.js";
import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import * as fsm from "./system/finite-state-machine.js";
import { KEY } from "./game-input.js";
import { music_id, sprite_defs } from "./game-assets.js";
import { invoke_on_members } from "./system/utility.js";
import { ScreenFader } from "./system/screenfader.js";

const credits_text =
`Lorem ipsum dolor sit amet, consectetur adipiscing elit.Praesent fermentum erat eu lobortis imperdiet.
Sed dignissim lacus lectus, vitae imperdiet ipsum fermentum nec. In hac habitasse platea dictumst.
Maecenas sed placerat turpis. Etiam arcu magna, semper eu mattis quis, vulputate tristique ipsum.
Curabitur lorem felis, rhoncus ut fermentum vitae,
suscipit eget enim. Maecenas sit amet enim sit amet nisi blandit suscipit sit amet sit amet odio.
Sed condimentum consectetur varius. Nam dictum et nunc vitae fermentum.

Phasellus orci leo, pharetra a enim a, accumsan feugiat risus. Proin vel mollis lacus.
Suspendisse pellentesque ex ut nulla volutpat sagittis. Proin at feugiat tortor.
Aenean eget quam gravida, consectetur risus id, sodales erat. Aliquam facilisis justo justo, quis posuere eros tincidunt non.
Phasellus auctor egestas nisi et maximus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;
Maecenas consectetur viverra massa eget feugiat. Nunc a orci lectus. Integer sed urna ac dui mattis sagittis. In euismod dictum dui.
Sed id mi quam. Nam libero diam, molestie ac aliquam a, ornare sit amet sapien. Integer id tempor odio.
Mauris posuere ipsum vehicula, commodo neque nec, dignissim nisi.

Aliquam congue lacinia tincidunt. Morbi tempus, augue at luctus convallis, elit tellus malesuada metus,
et blandit dui lectus non ex. Nullam volutpat interdum velit. Praesent sodales quam quis volutpat sodales.
Pellentesque a quam sed leo dictum dictum. Suspendisse sollicitudin scelerisque lacus.
Aliquam quis augue at quam vehicula luctus. Mauris eu enim nisi. Etiam sagittis quam at facilisis porta.
Nulla in elit quis diam placerat sodales. Integer id volutpat neque.
Nam dapibus leo in tellus aliquam, a aliquam risus elementum.

Duis id nisi sit amet erat interdum aliquet. Etiam sit amet dolor vel augue tincidunt pretium sit amet a lectus.
Quisque fermentum vehicula augue, eget aliquam mi fermentum vel. Fusce euismod arcu mauris, vel posuere neque tincidunt ut.
Cras condimentum, nisl at ultricies eleifend, orci nibh euismod libero, at faucibus justo magna nec nisl.
Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus sed tellus rutrum,
sagittis mauris non, convallis elit. Donec sed erat non ante faucibus egestas nec et nibh.
Aliquam fermentum, lectus sed faucibus tristique, nulla nisl rutrum libero, non consectetur lorem mi eget quam.
Aliquam leo velit, dignissim vel orci ac, faucibus consequat odio. Orci varius natoque penatibus et magnis dis parturient montes,
nascetur ridiculus mus. Praesent sagittis velit ut leo feugiat, non malesuada enim congue.

Nullam sit amet vulputate metus. Interdum et malesuada fames ac ante ipsum primis in faucibus. In sit amet diam mauris.
Suspendisse cursus, magna et porttitor mollis, turpis libero elementum massa, porta dapibus tortor justo ut ex.
Cras at arcu in nisl efficitur mollis eu at ante. Aenean egestas varius tortor, quis vehicula nunc consequat eget.
Duis purus magna, euismod vel orci id, placerat sollicitudin risus. Proin molestie luctus felis, sit amet consequat risus pharetra eu.
Aenean gravida ullamcorper eros et pellentesque. Nunc sollicitudin purus nec mi tincidunt, nec tempus nisi porta.
In in odio sapien. Duis pulvinar neque at turpis euismod, at suscipit ante lacinia. Nam feugiat lacus in sem gravida, ut feugiat tellus sollicitudin.
Ut quis tellus dui. Phasellus iaculis, ex nec dapibus egestas, turpis tortor ornare mi, in lobortis ipsum elit non massa.
Vestibulum nec quam commodo, mattis ante eget, pharetra nisl.
`;

class Credits {
    constructor(on_back_button){

        this.title = new ui.Text({
            text: "CREDITS",
            font: "80px ZingDiddlyDooZapped",
            background_color: "#ffffff00",
        });

        this.title.position = {
                                x: graphics.canvas_center_position().translate({ x: -(this.title.width / 2), y: 8 }).x,
                                y: 8,
                              };

        this.back_button = new ui.TextButton({
            text: "Back To Title",
            action: on_back_button,
            position: {x:0, y:0},
            sprite_def: sprite_defs.button_menu,
            sounds:{
                over: 'selectButton',
                down: 'clickButton',
            }
        });
        this.back_button.position = {
                                        x: graphics.canvas_rect().width - this.back_button.width - 8,
                                        y: 8,
                                    };

        // FOR CHRIS: this works but will end up overflowing the screen if too big text.
        // maybe we can add some way to move the text or something.
        this.credits_text = new ui.Text({
            text: credits_text,
            font: "12px Space Mono",
            background_color: "#ffffff00",
        });
        this.credits_text.position = graphics.centered_rectangle_in_screen(this.credits_text).position;
    }


    update(delta_time){
        invoke_on_members(this, "update", delta_time);
    }

    draw(canvas_context){
        invoke_on_members(this, "draw", canvas_context);
    }

}

class CreditsScreen extends fsm.State {
    fader = new ScreenFader();

    create_ui(){
        this.credits = new Credits(()=> this.go_back());
    }

    *enter(){
        if(!this.credits){
            this.create_ui();
        }
        yield* this.fader.generate_fade_in();
    }

    *leave(){
        yield* this.fader.generate_fade_out();
        audio.stopEvent(music_id.gameover_success); // In case we came from the gameover-success screen.
    }

    go_back(){
        this.state_machine.push_action("back");
    }

    update(delta_time){
        if(input.keyboard.is_just_down(KEY.ESCAPE) || input.keyboard.is_just_down(KEY.SPACE)){
            this.go_back();
        }

        this.credits.update(delta_time);

        this.fader.update(delta_time);
    }

    display(canvas_context){
        graphics.draw_rectangle(canvas_context, graphics.canvas_rect(), "grey");

        this.credits.draw(canvas_context);

        this.fader.display(canvas_context);
    }

    on_canvas_resized(){
        this.create_ui();
    }

};








