// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, BodyView, graphic_position };

import * as graphics from "./system/graphics.js";
import * as input from "./system/input.js";
import { random_int, position_from_index } from "./system/utility.js";

import { assets } from "./game-assets.js";
import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";
import * as tiledefs from "./definitions-tiles.js";

import * as debug from "./debug.js";

const PIXELS_PER_TILES_SIDE = 64;

// Return a vector in the graphic-world by interpreting a game-world position.
function graphic_position(vec2){
    return graphics.from_grid_to_graphic_position(vec2, PIXELS_PER_TILES_SIDE);
}

// Return a vector in the game-world by interpreting a graphic-world position.
function game_position_from_graphic_po(vec2){
    return graphics.from_graphic_to_grid_position(vec2, PIXELS_PER_TILES_SIDE);
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

// Display tiles.
class TileGridView {
    enable_grid_lines = true;

    constructor(position, size, ground_tile_grid, surface_tile_grid){
        console.assert(position instanceof Vector2);
        console.assert(size instanceof Vector2 && size.x > 2 && size.y > 2);
        this.position = position;
        this.size = size;
        // TODO: replace this by just tiles we use, not all tiles in the world
        this.ground_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, ground_tile_grid);
        this.ground_tile_grid.enable_draw_background = true; // display the background
        this.surface_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, surface_tile_grid);
    }

    get width() { return this.size.x; }
    get height() { return this.size.y; }

    update(delta_time){
        this.ground_tile_grid.update(delta_time);
        this.surface_tile_grid.update(delta_time);
    }

    draw(){
        this.ground_tile_grid.draw();
        if(this.enable_grid_lines)
            graphics.draw_grid_lines(this.size.x, this.size.y, PIXELS_PER_TILES_SIDE, this.position);
        this.surface_tile_grid.draw();
    }

};

class GameView {
    body_views = {};
    is_time_for_player_to_chose_action = true;
    animation_queue = []; // Must contain only js generators + parallel: (true||false). // TODO: make the animation system separately to be used anywhere there are animations to play.
    current_animations = []; // Must be a set of js generators, each one an animation that can be played together.

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
                this.animation_queue.push({
                    animation:event.animation(),
                    parallel: event.allow_parallel_animation,
                });

            } else { // If it's not a World event, it's a character-related event.
                const body_view = this.body_views[event.body_id];
                // TODO: handle the case where a new one appeared
                if(body_view){
                    // Add the animation to do to represent the event, for the player to see, if any.
                    this.animation_queue.push({
                        animation: body_view.animate_event(event),
                        parallel: event.allow_parallel_animation,
                    });
                }
            }
        });
    }

    update(delta_time){

        this.tile_grid.update(delta_time);

        // Update the current animation, if any, or switch to the next one, until there isn't any left.
        if(this.current_animations.length != 0 || this.animation_queue.length > 0){
            if(this.is_time_for_player_to_chose_action){
                this.is_time_for_player_to_chose_action = false;
                debug.setText("PROCESSING NPC TURNS...");
            }

            const delay_between_animations_ms = 100; // we'll try to keep a little delay between each beginning of parallel animation.

            if(this.current_animations.length == 0){
                // Get the next animations that are allowed to happen in parallel.
                let delay_for_next_animation = 0;
                while(this.animation_queue.length > 0){
                    const animation = this.animation_queue.shift(); // pop!
                    animation.delay = delay_for_next_animation;
                    delay_for_next_animation += delay_between_animations_ms;
                    this.current_animations.push(animation);
                    if(animation.parallel === false)
                        break; // We need to only play the animations that are next to each other and parallel.
                }
            }

            for(const animation of this.current_animations){
                if(animation.delay <= 0){
                    const animation_state = animation.animation.next(delta_time); // Updates the animation.
                    animation.done = animation_state.done;
                } else {
                    animation.done = false;
                    animation.delay -= delta_time;
                    if(animation.delay < 0)
                        animation.delay = 0;
                }
            }
            this.current_animations = this.current_animations.filter(animation => !animation.done);

            if(this.current_animations.length == 0 && this.animation_queue.length == 0){
                this.is_time_for_player_to_chose_action = true;
                debug.setText("PLAYER'S TURN!");
            }
        }

        // Update all body-views.
        for(const body_view of Object.values(this.body_views)){
            body_view.update(delta_time);
        };
    }

    render_graphics(){
        this.tile_grid.draw();

        for(const body_view of Object.values(this.body_views)){
            body_view.render_graphics();
        };
    }

    // Re-interpret the game's state from scratch.
    reset(){
        this.tile_grid = new TileGridView(new Vector2(), new Vector2({ x: this.game.world.width, y: this.game.world.height }),
                                            this.game.world._floor_tile_grid.elements, this.game.world._surface_tile_grid.elements);

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

    // Returns the pixel position pointed by the mouse when taking into account the camera.
    get mouse_game_position(){
        return input.mouse.position.translate(graphics.camera.position);
    }

    // Returns the position of the mouse on the grid if pointing it,
    // returns { x:"?", y:"?"} if the mouse isn't pointing on the grid.
    get mouse_grid_position(){
        const grid_pos = graphics.from_graphic_to_grid_position(this.mouse_game_position, PIXELS_PER_TILES_SIDE, this.tile_grid.position);

        if(grid_pos.x < 0 || grid_pos.x >= this.tile_grid.width
        || grid_pos.y < 0 || grid_pos.y >= this.tile_grid.height
        ){
            return { x: "?", y: "?" }
        }

        return grid_pos;
    }

};



