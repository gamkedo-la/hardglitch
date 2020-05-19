// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView };

import * as graphics from "./system/graphics.js";
import { random_int } from "./system/utility.js";

import { assets } from "./game-assets.js";
import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";

import { Waited } from "./rules/rules-basic.js";
import { Moved } from "./rules/rules-movement.js";

import * as debug from "./debug.js";

const PIXELS_PER_TILES_SIDE = 64;
const HALF_PIXELS_PER_TILES_SIDE = PIXELS_PER_TILES_SIDE / 2;

// Return a vector in the graphic-world by interpreting a game-world position.
function graphic_position(vec2){
    return new Vector2({ x: (vec2.x * PIXELS_PER_TILES_SIDE) - HALF_PIXELS_PER_TILES_SIDE
                       , y: (vec2.y * PIXELS_PER_TILES_SIDE) - HALF_PIXELS_PER_TILES_SIDE
                       });
}

// Representation of a body.
class BodyView {
    sprite = new graphics.Sprite();
    is_performing_animation = false;

    constructor(body_position, body_assets){
        // TODO: make a better logic to let know how to load the body spritesheet
        if(body_assets)
            this.sprite.source_image = body_assets.spritesheet;
        else
            this.sprite.source_image = assets.images.warrior;

        this.position = graphic_position(body_position);
        this.sprite.position = this.position;

        this.some_value = -99999.0 + random_int(0, 7);
    }

    update(){ // TODO: make this a generator with an infinite loop
        this.sprite.position = this.position;
        if(this.is_performing_animation){ // true or false, it's just for fun
            this.some_value += 0.5;
            const some_direction = {x:Math.sin(this.some_value), y:Math.cos(this.some_value)};
            this.sprite.position = this.position.translate(some_direction);
        }
    }

    render_graphics(){
        this.sprite.draw();
    }

    // This is used in animations to set the graphics at specific squares of the grid.
    set game_position(new_game_position){
        this.position = graphic_position(new_game_position);
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
    event_view_animation_queue = []; // Must contain only js generators.
    current_animation = null; // Must be a js generator.

    constructor(game){
        console.assert(game instanceof Game);
        this.game = game;
        this.reset();
    }

    interpret_turn_events() {
        console.assert(this.event_view_animation_queue.length == 0);

        let events = this.game.last_turn_info.events; // turns.PlayerTurn
        events.forEach(event => {
            const body_view = this.body_views[event.body_id];
            console.assert(body_view); // TODO: handle the case where a new one appeared
            // Add the animation to do to represent the event, for the player to see.
            this.event_view_animation_queue.push(body_view.animate_event(event));
        });
    }

    update(){
        // Update the currently animating event view, if any.
        if(this.current_animation || this.event_view_animation_queue.length > 0){
            if(this.is_time_for_player_to_chose_action){
                this.is_time_for_player_to_chose_action = false;
                debug.setText("PROCESSING NPC TURNS...");
            }

            if(!this.current_animation){
                this.current_animation = this.event_view_animation_queue.shift();
            }

            const animation_state = this.current_animation.next(); // Updates the animation
            if(animation_state.done){
                this.current_animation = null;
                if(this.event_view_animation_queue.length == 0){
                    this.is_time_for_player_to_chose_action = true;
                    debug.setText("PLAYER'S TURN!");
                }
            }
        }

        for(const body_id in this.body_views){
            this.body_views[body_id].update();
        };
    }

    render_graphics(){
        this.tile_grid.draw();
        for(const body_id in this.body_views){
            this.body_views[body_id].render_graphics();
        };
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
};



