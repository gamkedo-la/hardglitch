// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, CharacterView, graphic_position };

import * as graphics from "./system/graphics.js";

import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";

import * as concepts from "./core/concepts.js";
import * as editor from "./editor.js";

import {
    graphic_position, PIXELS_PER_TILES_SIDE, square_half_unit_vector,
    EntityView,
} from "./view/common-view.js";
import { TileGridView } from "./view/tilegrid-view.js";
import { CharacterView } from "./view/character-view.js";
import { GameInterface } from "./game-ui.js";
import { mouse_grid_position, mouse_is_pointing_walkable_position } from "./game-input.js";
import { sprite_defs } from "./game-assets.js";
import { mouse } from "./system/input.js";
import { Move } from "./rules/rules-movement.js";
import { ItemView } from "./view/item-view.js";

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
    character_views = {};
    item_views = {};
    is_time_for_player_to_chose_action = true;
    animation_queue = []; // Must contain only js generators + parallel: (true||false). // TODO: make the animation system separately to be used anywhere there are animations to play.
    current_animations = []; // Must be a set of js generators, each one an animation that can be played together.
    player_actions_highlights = []; // Must contain Highlight objects for the currently playable actions.


    constructor(game){
        console.assert(game instanceof Game);
        this.game = game;
        this._requires_reset = true;

        this.ui = new GameInterface((...args)=>this.on_action_selection_begin(...args), (...args)=>this.on_action_selection_end(...args));

        this._highlight_sprites = {
            neutral: new graphics.Sprite(sprite_defs.highlight_blue),
            movement: new graphics.Sprite(sprite_defs.highlight_green),
            basic_action: new graphics.Sprite(sprite_defs.highlight_yellow),
            action: new graphics.Sprite(sprite_defs.highlight_red),
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
            if(event.entity_id === 0){ // 0 means it's a World event.
                // Launch the event's animation, if any.
                this.animation_queue.push({
                    animation:event.animation(),
                    parallel: event.allow_parallel_animation,
                });

            } else { // If it's not a World event, it's a entity-related event.
                console.assert(event.entity_id);
                const entity_view = this._find_entity_view(event.entity_id);
                // TODO: handle the case where a new one appeared
                if(entity_view){
                    console.assert(entity_view instanceof EntityView);
                    // Add the animation to do to represent the event, for the player to see, if any.
                    this.animation_queue.push({
                        animation: entity_view.animate_event(event),
                        parallel: event.allow_parallel_animation,
                        focus_position: new concepts.Position(entity_view.game_position),
                    });
                }
            }
        }

        this.highlight_available_basic_actions();
        this.ui.show_action_buttons(Object.values(this.game.last_turn_info.possible_actions));
    }

    _find_entity_view(entity_id){
        const view = this.character_views[entity_id];
        if(view !== undefined){
            return view;
        }
        return this.item_views[entity_id];
    }

    _add_highlight(position, sprite){
        this.player_actions_highlights.push(new Highlight(position, sprite));
    }

    // Setup highlights for actions that are known with a target position.
    highlight_available_basic_actions(){
        this.player_actions_highlights = []; // Clear previous highlighting

        const available_actions = this.game.last_turn_info.possible_actions;
        for(const action of Object.values(available_actions)){
            if(action.is_basic){
                if(action instanceof Move)
                    this._add_highlight(action.target_position, this._highlight_sprites.movement);
                else
                    this._add_highlight(action.target_position, this._highlight_sprites.basic_action);
            }
        }

        if(this.game.last_turn_info.player_body)
            this._change_character_focus(this.game.last_turn_info.player_body.position);
    }

    highlight_selected_action_targets(action_info){
        this.player_actions_highlights = []; // Clear previous highlighting

        for(const action of action_info.actions){
            if(action.target_position)
                this._add_highlight(action.target_position, this._highlight_sprites.action);
        }
    }

    on_action_selection_begin(action_info){
        this.highlight_selected_action_targets(action_info);
    }

    on_action_selection_end(action){
        if(!action){ // Action selection was cancelled.
            this.highlight_available_basic_actions();
        }
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
        this._update_entities(delta_time, this.item_views);
        this._update_entities(delta_time, this.character_views);

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
                if(this.game.last_turn_info.player_body){
                    this._change_character_focus(this.game.last_turn_info.player_body.position);
                    this.ui.unlock_actions();
                }
                editor.set_text("PLAYER'S TURN!");
            }
        }
    }

    _update_entities(delta_time, entity_id_map){
        const entities = Object.values(entity_id_map);
        console.assert(Number.isInteger(delta_time));
        console.assert(entities instanceof Array);
        for(const entity_view of entities){
            console.assert(entity_view instanceof EntityView);
            entity_view.update(delta_time);
        };
    }

    get _all_entity_views() { return [ ...Object.values(this.character_views), ...Object.values(this.item_views) ]; }

    _render_entities(){
        // We need to render the entities in order of verticality so that things souther
        // than other things can be drawn over, allowing to display higher sprites.
        const entity_views = this._all_entity_views;
        entity_views.sort((left_view, right_view) => left_view.position.y - right_view.position.y);
        entity_views.map(view => view.render_graphics());
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

        this._render_entities(this.character_views);
        this._render_entities(this.item_views);

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
        this.item_views = this._create_entity_views(this.game.world.items, ItemView);
        this.character_views = this._create_entity_views(this.game.world.bodies, CharacterView);
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

    _create_entity_views(entities, view_type){
        console.assert(entities instanceof Array);
        console.assert(EntityView.isPrototypeOf(view_type));
        const entity_views = {};
        entities.forEach(entity => {
            console.assert(entity instanceof concepts.Entity);
            const entity_view = new view_type(entity);
            entity_views[entity.id] = entity_view;
            entity_view.update(0);
        });
        return entity_views;
    }

    // Called by the editor code when editing the game in a way the require re-interpreting the game's state.
    notify_edition(){
        this._requires_reset = true;
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



