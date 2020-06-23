// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, CharacterView as BodyView, graphic_position };

import * as graphics from "./system/graphics.js";

import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";

import * as editor from "./editor.js";

import { graphic_position, PIXELS_PER_TILES_SIDE, square_half_unit_vector } from "./view/common-view.js";
import { TileGridView } from "./view/tilegrid-view.js";
import { CharacterView } from "./view/character-view.js";
import { GameInterface } from "./game-ui.js";
import { mouse_grid_position, mouse_is_pointing_walkable_position } from "./game-input.js";
import { sprite_defs } from "./game-assets.js";
import { mouse } from "./system/input.js";
import { Move } from "./rules/rules-movement.js";
import { Position } from "./core/concepts.js";

class Highlight{
    // Reuse a sprite for highlighting.
    constructor(position, sprite){
        console.assert(Number.isInteger(position.x) && Number.isInteger(position.y));
        console.assert(sprite instanceof graphics.Sprite);
        this._position = position;
        this._sprite = sprite;
    }

    set position(new_pos) {
        this._position = new_pos;
    }

    draw(canvas_context){
        if(!this._position)
            return;
        this._sprite.position = graphic_position(this._position);
        this._sprite.draw(canvas_context);
    }
};

class GameView {
    body_views = {};
    is_time_for_player_to_chose_action = true;
    animation_queue = []; // Must contain only js generators + parallel: (true||false). // TODO: make the animation system separately to be used anywhere there are animations to play.
    current_animations = []; // Must be a set of js generators, each one an animation that can be played together.
    player_actions_highlights = []; // Must contain Highlight objects for the currently playable actions.

    ui = new GameInterface();

    constructor(game){
        console.assert(game instanceof Game);
        this.game = game;
        this._requires_reset = true;

        this._highlight_sprites = {
            neutral: new graphics.Sprite(sprite_defs.highlight_blue),
            movement: new graphics.Sprite(sprite_defs.highlight_green),
            action: new graphics.Sprite(sprite_defs.highlight_yellow),
            edit: new graphics.Sprite(sprite_defs.highlight_purple),
            turn: new graphics.Sprite(sprite_defs.highlight_purple),
        };

        this._pointed_highlight = new Highlight({x:0, y:0}, this._highlight_sprites.neutral);
        this._pointed_highlight_edit = new Highlight({x:0, y:0}, this._highlight_sprites.edit);
        this._character_focus_highlight = new Highlight({x:0, y:0}, this._highlight_sprites.turn);

        this.reset();
    }

    interpret_turn_events() {
        console.assert(this.animation_queue.length == 0);

        const events = this.game.last_turn_info.events; // turns.PlayerTurn
        for(const event of events){
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
                        focus_position: new Position(body_view.game_position),
                    });
                }
            }
        }

        this.highlight_available_basic_actions();
        this.ui.show_action_buttons(Object.values(this.game.last_turn_info.possible_actions));
    }

    // Setup highlights for actions that are known with a target position.
    highlight_available_basic_actions(){
        this.player_actions_highlights = [];
        const add_highlight = (position, sprite)=>{
            this.player_actions_highlights.push(new Highlight(position, sprite));
        };

        const available_actions = this.game.last_turn_info.possible_actions;
        for(const action of Object.values(available_actions)){
            if(action instanceof Move){
                add_highlight(action.target_position, this._highlight_sprites.movement);
            }
        }

        if(this.game.last_turn_info.player_body)
            this._change_character_focus(this.game.last_turn_info.player_body.position);
    }

    update(delta_time){

        this._update_highlights(delta_time);

        if(editor.is_enabled){
            if(this._requires_reset){
                this.reset();
            }
            return;
        }

        this.tile_grid.update(delta_time);

        this._update_animations(delta_time);
        this._update_characters(delta_time);

        this.ui.update(delta_time);
    }

    _update_animations(delta_time){
        // Update the current animation, if any, or switch to the next one, until there isn't any left.
        if(this.current_animations.length != 0 || this.animation_queue.length > 0){
            if(this.is_time_for_player_to_chose_action){
                this.is_time_for_player_to_chose_action = false;
                editor.set_text("PROCESSING NPC TURNS...");
            }

            const delay_between_animations_ms = 0; // we'll try to keep a little delay between each beginning of parallel animation.

            if(this.current_animations.length == 0){
                // Get the next animations that are allowed to happen in parallel.
                let delay_for_next_animation = 0;
                while(this.animation_queue.length > 0){
                    const animation = this.animation_queue.shift(); // pop!
                    const animation_state = animation.animation.next(); // Get to the first step of the animation
                    if(animation_state.done) // Skip when there was actually no animation.
                        continue;
                    // Start the animation:
                    this._change_character_focus(animation.focus_position);
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
                this._change_character_focus(this.game.last_turn_info.player_body.position);
                this.ui.unlock_actions();
                editor.set_text("PLAYER'S TURN!");
            }
        }
    }

    _update_characters(delta_time){
        // Update all body-views.
        for(const body_view of Object.values(this.body_views)){
            body_view.update(delta_time);
        };
    }


    _update_highlights(delat_time){
        const mouse_pos = mouse_grid_position();
        if(mouse_pos){
            if(editor.is_enabled)
                this._pointed_highlight_edit.position = mouse_pos;
            else
                this._pointed_highlight.position = mouse_pos;
        }

        for(const highlight_sprite of Object.values(this._highlight_sprites)){
            highlight_sprite.update(delat_time);
        }
    }


    render_graphics(){
        this.tile_grid.draw_floor();

        this._render_highlights();

        for(const body_view of Object.values(this.body_views)){
            body_view.render_graphics();
        };


        this.tile_grid.draw_surface();

        this.ui.display();
    }

    _render_highlights(){
        this._character_focus_highlight.draw();

        if(!mouse.is_dragging){

            if(!editor.is_enabled && this.is_time_for_player_to_chose_action){
                for(const highlight of this.player_actions_highlights){
                    highlight.draw();
                }
            }

            if(editor.is_enabled){
                this._pointed_highlight_edit.draw();
            } else {
                if(mouse_is_pointing_walkable_position())
                    this._pointed_highlight.draw();
            }
        }
    }

    _change_character_focus(character_pos){
        this._character_focus_highlight.position = character_pos;
    }

    // Re-interpret the game's state from scratch.
    reset(){
        console.assert(this._requires_reset);

        const world = this.game.world;
        console.assert(world);

        this._reset_tilegrid(world);
        this._reset_characters(world);
        this.highlight_available_basic_actions();
        this.ui.show_action_buttons(Object.values(this.game.last_turn_info.possible_actions));

        this._requires_reset = false;
    }

    _reset_tilegrid(world){
        if(this.tile_grid)
            this.tile_grid.reset(new Vector2(), new Vector2({ x: world.width, y: world.height }), world._floor_tile_grid, world._surface_tile_grid);
        else
            this.tile_grid = new TileGridView(new Vector2(), new Vector2({ x: world.width, y: world.height }), world._floor_tile_grid, world._surface_tile_grid);

        this.tile_grid.update(0);
    }

    _reset_characters(world){
        this.body_views = {};
        this.game.world.bodies.forEach(body => {
            const body_view = new CharacterView(body.position, body.assets);
            this.body_views[body.body_id] = body_view;
            body_view.update(0);
        });
    }


    // Called by the editor code when editing the game in a way the require re-interpreting the game's state.
    notify_edition(){
        this._requires_reset = true;
    }

    remove_view(...body_ids){
        for(const body_id of body_ids){
            delete this.body_views[body_id];
        }
    }

    // Returns the position on the grid of a graphic position in the game space (not taking into account the camera scrolling).
    // returns undefined if the positing isn't on the grid.
    grid_position(game_position){
        const grid_pos = graphics.from_graphic_to_grid_position(game_position, PIXELS_PER_TILES_SIDE, this.tile_grid.position);

        if(grid_pos.x < 0 || grid_pos.x >= this.tile_grid.width
        || grid_pos.y < 0 || grid_pos.y >= this.tile_grid.height
        ){
            return undefined;
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



