// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, BodyView, graphic_position };

import * as graphics from "./system/graphics.js";

import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";

import * as debug from "./debug.js";

import { graphic_position, PIXELS_PER_TILES_SIDE, square_half_unit_vector } from "./view/common-view.js";
import { TileGridView } from "./view/tilegrid-view.js";
import { BodyView } from "./view/character-view.js";
import { GameInterface } from "./game-ui.js";

class GameView {
    body_views = {};
    is_time_for_player_to_chose_action = true;
    animation_queue = []; // Must contain only js generators + parallel: (true||false). // TODO: make the animation system separately to be used anywhere there are animations to play.
    current_animations = []; // Must be a set of js generators, each one an animation that can be played together.

    ui = new GameInterface();

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

            const delay_between_animations_ms = 33; // we'll try to keep a little delay between each beginning of parallel animation.

            if(this.current_animations.length == 0){
                // Get the next animations that are allowed to happen in parallel.
                let delay_for_next_animation = 0;
                while(this.animation_queue.length > 0){
                    const animation = this.animation_queue.shift(); // pop!
                    const animation_state = animation.animation.next(); // Get to the first step of the animation
                    if(animation_state.done) // Skip when there was actually no animation.
                        continue;
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

        this.ui.update(delta_time);
    }

    render_graphics(){
        this.tile_grid.draw();

        for(const body_view of Object.values(this.body_views)){
            body_view.render_graphics();
        };

        this.ui.display();
    }

    // Re-interpret the game's state from scratch.
    reset(){
        this.tile_grid = new TileGridView(new Vector2(), new Vector2({ x: this.game.world.width, y: this.game.world.height }),
                                            this.game.world._floor_tile_grid, this.game.world._surface_tile_grid);

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

    // Returns the position on the grid of a graphic position in the game space (not taking into account the camera scrolling).
    // returns {} if the positing isn't on the grid.
    grid_position(game_position){
        const grid_pos = graphics.from_graphic_to_grid_position(game_position, PIXELS_PER_TILES_SIDE, this.tile_grid.position);

        if(grid_pos.x < 0 || grid_pos.x >= this.tile_grid.width
        || grid_pos.y < 0 || grid_pos.y >= this.tile_grid.height
        ){
            return {};
        }

        return grid_pos;
    }

    center_on_player(){
        const player_characters = this.game.player_characters;
        const player = player_characters.shift();
        const player_position = player.position;
        const graphic_player_position = graphics.from_grid_to_graphic_position(player_position, PIXELS_PER_TILES_SIDE);
        const graphic_player_center_square_position = graphic_player_position.translate(square_half_unit_vector);
        graphics.camera.center(graphic_player_center_square_position);
    }

};



