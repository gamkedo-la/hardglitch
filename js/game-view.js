// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, BodyView, graphic_position };

import * as graphics from "./system/graphics.js";
import { random_int } from "./system/utility.js";

import { assets } from "./game-assets.js";
import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";

import * as debug from "./debug.js";

const PIXELS_PER_TILES_SIDE = 64;
const HALF_PIXELS_PER_TILES_SIDE = PIXELS_PER_TILES_SIDE / 2;

// Return a vector in the graphic-world by interpreting a game-world position.
function graphic_position(vec2){
    return new Vector2({ x: (vec2.x * PIXELS_PER_TILES_SIDE)
                       , y: (vec2.y * PIXELS_PER_TILES_SIDE)
                       });
}


// Representation of a body.
class BodyView {
    is_performing_animation = false;

    constructor(body_position, body_assets){
        console.assert(body_position);
        console.assert(body_assets);
        this.sprite = new graphics.Sprite(body_assets.graphics.sprite_def);
        this.sprite.position = graphic_position(body_position);

        this.some_value = -99999.0 + random_int(0, 7);
    }

    update(delta_time){ // TODO: make this a generator with an infinite loop
        if(!this.is_performing_animation){ // true or false, it's just for fun
            this.some_value += 0.5;
            const some_direction = {x:Math.sin(this.some_value), y:Math.cos(this.some_value)};
            this.position = this.position.translate(some_direction);
        }
        this.sprite.update(delta_time);
    }

    render_graphics(){
        this.sprite.draw();
    }

    // This is used in animations to set the graphics at specific squares of the grid.
    set game_position(new_game_position){
        this.position = graphic_position(new_game_position);
    }

    get position(){
        return this.sprite.position;
    }
    set position(new_position){
        this.sprite.position = new_position;
    }

    *animate_event(event){
        this.is_performing_animation = true;
        yield* event.animation(this); // Let the event describe how to do it!
        this.is_performing_animation = false;
    }


};

class GameView {
    tile_grid = new graphics.TileGrid();
    body_views = {};
    is_time_for_player_to_chose_action = true;
    animation_queue = []; // Must contain only js generators. // TODO: make the animation system separately to be used anywhere there are animations to play.
    current_animation = null; // Must be a js generator.

    constructor(game){
        console.assert(game instanceof Game);
        this.game = game;
        this.reset();
    }

    interpret_turn_events() {
        console.assert(this.animation_queue.length == 0);

        let events = this.game.last_turn_info.events; // turns.PlayerTurn
        events.forEach(event => {
            if(event.body_id == 0){ // 0 means it's a World event.
                // Launch the event's animation, if any.
                this.animation_queue.push(event.animation());

            } else { // If it's not a World event, it's a character-related event.
                const body_view = this.body_views[event.body_id];
                // TODO: handle the case where a new one appeared
                if(body_view){
                    // Add the animation to do to represent the event, for the player to see, if any.
                    this.animation_queue.push(body_view.animate_event(event));
                }
            }
        });
    }

    update(delta_time){

        // Update the current animation, if any, or switch to the next one, until there isn't any left.
        if(this.current_animation || this.animation_queue.length > 0){
            if(this.is_time_for_player_to_chose_action){
                this.is_time_for_player_to_chose_action = false;
                debug.setText("PROCESSING NPC TURNS...");
            }

            if(!this.current_animation){
                this.current_animation = this.animation_queue.shift(); // pop!
            }

            const animation_state = this.current_animation.next(delta_time); // Updates the animation.
            if(animation_state.done){
                this.current_animation = null;
                if(this.animation_queue.length == 0){
                    this.is_time_for_player_to_chose_action = true;
                    debug.setText("PLAYER'S TURN!");
                }
            }
        }

        // Update all body-views.
        for(const body_view of Object.values(this.body_views)){
            body_view.update(delta_time);
        };
    }

    render_graphics(){
        this.tile_grid.draw();
        graphics.draw_grid_lines(PIXELS_PER_TILES_SIDE);

        for(const body_view of Object.values(this.body_views)){
            body_view.render_graphics();
        };

        if(this.game.world.is_game_over){
            graphics.draw_text("GAME OVER", graphics.canvas_center_position());
        }
    }

    // Re-interpret the game's state from scratch.
    reset(){
        // TODO: reset the tiles

        this.body_views = {};
        this.game.world.bodies.forEach(body => {
            const body_view = new BodyView(body.position, body.assets);
            this.body_views[body.body_id] = body_view;
        });
    }


    remove_view(...body_ids){
        for(const body_id of body_ids){
            delete this.body_views[body_id];
        }
    }

};



