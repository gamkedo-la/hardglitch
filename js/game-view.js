// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, CharacterView, graphic_position };

import * as graphics from "./system/graphics.js";

import { Game } from "./game.js";
import { Vector2, Rectangle } from "./system/spatial.js";

import * as concepts from "./core/concepts.js";
import * as editor from "./editor.js";

import {
    graphic_position, PIXELS_PER_TILES_SIDE, square_half_unit_vector,
    EntityView,
} from "./view/entity-view.js";
import { TileGridView } from "./view/tilegrid-view.js";
import { CharacterView } from "./view/character-view.js";
import { GameInterface } from "./game-ui.js";
import { mouse_grid_position, mouse_game_position, game_position_from_graphic_position, } from "./game-input.js";
import { sprite_defs } from "./game-assets.js";
import { mouse } from "./system/input.js";
import { Move } from "./rules/rules-movement.js";
import { ItemView } from "./view/item-view.js";
import * as ui from "./system/ui.js";
import * as tiles from "./definitions-tiles.js";
import * as visibility from "./core/visibility.js";
import * as anim from "./system/animation.js";
import { FogOfWar } from "./view/fogofwar.js";
import { tween, easing } from "./system/tweening.js";
import { TakeItem } from "./rules/rule-takeitem.js";

const a_very_long_time = 99999999999999;

class Highlight{
    enabled = true;

    // Reuse a sprite for highlighting.
    constructor(position, sprite, text){
        console.assert(Number.isInteger(position.x) && Number.isInteger(position.y));
        console.assert(sprite instanceof graphics.Sprite);
        console.assert(text === undefined || typeof text === 'string');
        this._sprite = sprite;
        if(text){
            this._help_text = new ui.HelpText({
                text: text,
                area_to_help: new Rectangle(), // will be updated when we set the position.
                in_screenspace: false, // We will display the text in the game space.
                delay_ms: 666,
            });
        }
        this.position = position;
    }

    set position(new_pos) {
        this._position = new concepts.Position(new_pos);

        this._sprite.position = graphic_position(this._position);
        if(this._help_text)
            this._help_text.area_to_help = new Rectangle(this._sprite.area);
    }

    get position(){
        return new concepts.Position(this._position);
    }

    set text(new_text) {
        if(this._help_text.text)
            this._help_text.text = new_text;
    }

    update(delta_time){
        this._drawn_since_last_update = false;
        if(!this.enabled)
            return;
        // BEWARE: We must re-calculate the sprite position on rendering because it is dependent on the camera position.
        if(this._help_text){
            this._help_text.update(delta_time);
            if(this._help_text.visible){
                const text_pos = mouse_game_position().translate({x:0, y:-50}); // TODO: something less arbitrary?
                if(text_pos.x > graphics.camera.rectangle.bottom_right.x - 60)
                    text_pos.x = text_pos.x - 100;
                if(text_pos.y < graphics.camera.rectangle.top_left.y + 60)
                    text_pos.y = text_pos.y + 100;
                this._help_text.position = text_pos;
            }
        }
    }

    draw(canvas_context){
        // if(!graphics.camera.can_see(this._sprite.area)) // TODO: this is buggy, check why
        //     return;
        console.assert(!graphics.camera.is_rendering_in_screen);
        if(!this.enabled)
            return;

        this._sprite.position = graphic_position(this._position); // BEWARE: We share the sprite with other highlights so we need to reposition it before each redraw.
        this._sprite.draw(canvas_context);
        this._drawn_since_last_update = true;
    }

    draw_help(){
        console.assert(!graphics.camera.is_rendering_in_screen);
        if(this._help_text && this._drawn_since_last_update){
            this._help_text.draw();
        }
    }
};

class GameView {
    entity_views = {};
    is_time_for_player_to_chose_action = true;
    current_animations = new anim.AnimationGroup(); // Plays animations that have started.
    skipped_animations = new anim.AnimationGroup(); // Plays animations that needs to be done in one update.
    camera_animations = new anim.AnimationGroup(); // Plays camera animations.
    player_actions_highlights = []; // Must contain Highlight objects for the currently playable actions.
    action_range_highlights = []; // Must contain Highlight objects for the currently pointed action's range.
    delay_between_animations_ms = Math.round(1000 / 5); // we'll try to keep a little delay between each beginning of parallel animation.

    get enable_fog_of_war() { return this._enable_fog_of_war; };
    set enable_fog_of_war(new_value) {
        console.assert(typeof(new_value) === "boolean");
        this._enable_fog_of_war = new_value;
        this._require_tiles_update = true;
    };

    get enable_tile_rendering_debug() { return this._enable_tile_rendering_debug; };
    set enable_tile_rendering_debug(new_value) {
        console.assert(typeof(new_value) === "boolean");
        this._enable_tile_rendering_debug = new_value;
        this._require_tiles_update = true;
        if(this._enable_tile_rendering_debug === false)
            this._requires_reset = true;
    };

    enable_auto_camera_center = true;

    constructor(game){
        console.assert(game instanceof Game);
        this.game = game;
        this._requires_reset = true;
        this._require_tiles_update = true;
        this._enable_fog_of_war = true;
        this._enable_tile_rendering_debug = false;

        this.ui = new GameInterface((...args)=>this.on_action_selection_begin(...args), // On action selection begin.
            (...args)=>this.on_action_selection_end(...args),   // On action selection end.
            (...args)=>this.highlight_action_range(...args),    // On action pointed begin.
            (...args)=>{ this.clear_action_range_highlight(...args) }, // On action pointed end.
            );

        this._highlight_sprites = {
            neutral: new graphics.Sprite(sprite_defs.highlight_blue),
            movement: new graphics.Sprite(sprite_defs.highlight_green),
            take: new graphics.Sprite(sprite_defs.highlight_green),
            basic_action: new graphics.Sprite(sprite_defs.highlight_yellow),
            action_range: new graphics.Sprite(sprite_defs.highlight_yellow),
            action: new graphics.Sprite(sprite_defs.highlight_red),
            edit: new graphics.Sprite(sprite_defs.highlight_purple),
            turn: new graphics.Sprite(sprite_defs.highlight_purple),
        };

        this._pointed_highlight = new Highlight({x:0, y:0}, this._highlight_sprites.neutral, "Tile");
        this._pointed_highlight_edit = new Highlight({x:0, y:0}, this._highlight_sprites.edit, "EDITOR");
        this._character_focus_highlight = new Highlight({x:0, y:0}, this._highlight_sprites.turn, "Character");

        window.addEventListener('resize', ()=> this.on_canvas_resized());


        this.fog_of_war = new FogOfWar(this.game.world);

        this.reset();
        this.center_on_player();
    }

    interpret_turn_events(event_sequence) {
        console.assert(event_sequence);

        this.clear_focus();

        this.event_sequence = event_sequence;
        this._launch_next_animation_batch();
    }

    _pop_next_event_animation(){
        this.next_event = this.event_sequence.next();

        if(!this.next_event.done){
            const event = this.next_event.value;
            console.assert(event instanceof concepts.Event);
            console.assert(event.focus_positions);
            const animation = {
                    start_animation: ()=> this._start_event_animation(event),
                    parallel: event.allow_parallel_animation,
                    focus_positions: event.focus_positions,
                    is_world_event: event.is_world_event,
                };
            return animation;
        } else {
            this.next_event = undefined;
        }
    }

    *_start_event_animation(event){
        console.assert(event instanceof concepts.Event);
        yield* event.animation(this);
    };

    _add_highlight(position, sprite, text){
        this.player_actions_highlights.push(new Highlight(position, sprite, text));
    }

    get_entity_view(entity_id){
        console.assert(Number.isInteger(entity_id));
        const entity_view = this.entity_views[entity_id];
        console.assert(entity_view instanceof EntityView);
        return entity_view;
    }

    focus_on_entity(entity_id){
        const entity_view = this.get_entity_view(entity_id);
        console.assert(entity_view instanceof EntityView);
        this.focus_on_position(entity_view.game_position);
        return entity_view;
    }

    _action_description(action){ // TODO: make a general function for this AND make it handle also more general description and action icons.
        console.assert(action instanceof concepts.Action);
        return `${action.name} -${action.cost} AP`;
    }

    // Setup highlights for actions that are known with a target position.
    highlight_available_basic_actions(){
        this.clear_highlights_basic_actions(); // Clear previous highlighting

        const available_actions = this.game.turn_info.possible_actions;
        for(const action of Object.values(available_actions)){
            if(action.is_basic && action.is_safe){
                if(action instanceof Move)
                    this._add_highlight(action.target_position, this._highlight_sprites.movement, this._action_description(action));
                else if(action instanceof TakeItem)
                    this._add_highlight(action.target_position, this._highlight_sprites.take, this._action_description(action));
                else
                    this._add_highlight(action.target_position, this._highlight_sprites.basic_action, this._action_description(action));
            }
        }

    }

    clear_highlights_basic_actions(){
        this.player_actions_highlights = [];
    }

    highlight_selected_action_targets(action_info){
        this.clear_highlights_basic_actions(); // Clear previous highlighting

        for(const action of action_info.actions){
            if(action.target_position){
                this._add_highlight(action.target_position, this._highlight_sprites.action, this._action_description(action));
            }
        }
    }

    highlight_action_range(action_range, action_targets){
        this.clear_action_range_highlight();
        if(action_range instanceof visibility.RangeShape){
            const possible_targets = visibility.positions_in_range(this.player_character.position,
                action_range,
                (pos)=>this.game.world.is_valid_position(pos));
            for(const target of possible_targets){
                const highlight_sprite = action_targets.some(action_target=> action_target.equals(target)) ? this._highlight_sprites.action : this._highlight_sprites.action_range;
                this.action_range_highlights.push(new Highlight(target, highlight_sprite));
            }
        }
    }

    clear_action_range_highlight(){
        this.action_range_highlights = [];
    }

    on_action_selection_begin(action_info){
        this.highlight_selected_action_targets(action_info);
        this.clear_action_range_highlight();
    }

    on_action_selection_end(action){
        if(!action){ // Action selection was cancelled.
            this.highlight_available_basic_actions();
        }
    }

    update(delta_time){

        this.skipped_animations.update(a_very_long_time); // Any animation in this group should be iterated just once and be done.
        this.camera_animations.update(delta_time);

        this._update_highlights(delta_time);

        if(this._requires_reset){
            this.reset();
            if(editor.is_enabled)
                return;
        }


        this.tile_grid.update(delta_time);

        this._update_animations(delta_time);
        this._update_entities(delta_time);

        this.fog_of_war.update(delta_time);

        this.ui.update(delta_time);
    }

    _launch_next_animation_batch(){
        // Get the next animations that are allowed to happen in parallel.
        let delay_for_next_animation = 0;
        const max_frame_time = 1000.0 / 30.0;
        const begin_time = performance.now();
        while(performance.now() - begin_time < max_frame_time){ // timeout!

            const animation = this._pop_next_event_animation();
            if(!animation) // End of event/animation sequences.
                break;

            animation.iterator = animation.start_animation();
            if(animation.iterator.next().done) // Skip non-animations.
                continue;

            const is_visible_to_player = this.fog_of_war.is_any_visible(...animation.focus_positions);
            if(!is_visible_to_player && !animation.is_world_event){
                // No need to play the action in a visible way, just skip it (but still play it).
                this.skipped_animations.play(animation.iterator)
                continue;
            }

            // Start the animation, delayed by the previous parallel one:
            if(this.delay_between_animations_ms > 0){
                if(delay_for_next_animation > 0)
                    animation.iterator = anim.delay(delay_for_next_animation, animation.start_animation());
                delay_for_next_animation += this.delay_between_animations_ms;
            }
            this.current_animations.play(animation.iterator)
                .then(()=> {
                    this.fog_of_war.refresh(this.game.world);
                    this._require_tiles_update = true;
                }); // Refresh the FOW after each event, to make sure we always see the most up to date world.

            if(animation.parallel === false)
                break; // We need to only play the animations that are next to each other and parallel.

        }
    }

    _update_animations(delta_time){
        // Update the current animation, if any, or switch to the next one, until there isn't any left.
        if(this.current_animations.animation_count != 0 || (this.next_event && !this.next_event.done)){
            if(this.is_time_for_player_to_chose_action){
                this.is_time_for_player_to_chose_action = false;
                this.ui.lock_actions();
                this.clear_focus();
            }

            if(this.current_animations.animation_count == 0){
                this._launch_next_animation_batch();
            }

            this.current_animations.update(delta_time);

            if(!this.is_time_for_player_to_chose_action
            && this.current_animations.animation_count == 0
            && this.next_event === undefined
            ){
                this._start_player_turn();
            }
        }
    }

    get player_character() {
        return this.game.turn_info.player_character;
    }

    _start_player_turn(){
        this.is_time_for_player_to_chose_action = true;
        if(this.player_character){
            this.ui.show_action_buttons(Object.values(this.game.turn_info.possible_actions));
            this.clear_highlights_basic_actions();
            const player_position = this.player_character.position;
            const setup = ()=>{
                this.focus_on_position(player_position);
                this.fog_of_war.refresh(this.game.world);
                this._require_tiles_update = true;
                this.ui.unlock_actions();
                this.highlight_available_basic_actions();
            };
            if(this.enable_auto_camera_center && this.player_character){
                this.center_on_limit_position_if_too_far(this.player_character.position, 500)
                    .then(setup);
            } else {
                setup();
            }

        } else {
            this.clear_focus();
            this.lock_actions();
        }
        editor.set_text("PLAYER'S TURN!");
    }

    _update_entities(delta_time){
        const entity_views = this.list_entity_views;
        console.assert(typeof(delta_time) === 'number');
        console.assert(entity_views instanceof Array);
        for(const entity_view of entity_views){
            console.assert(entity_view instanceof EntityView);
            entity_view.update(delta_time);
        };
    }

    get list_entity_views() { return Object.values(this.entity_views); }

    _render_entities(){
        // We need to render the entities in order of verticality so that things souther
        // than other things can be drawn over, allowing to display higher sprites.
        const entity_views = this.list_entity_views;
        entity_views.sort((left_view, right_view) => left_view.position.y - right_view.position.y);
        entity_views.map(view => view.render_graphics());
    }

    _update_highlights(delta_time){
        const mouse_pos = mouse_grid_position();
        if(mouse_pos){
            if(!this._last_mouse_grid_pos || !mouse_pos.equals(this._last_mouse_grid_pos)){
                this._last_mouse_grid_pos = mouse_pos;
                if(editor.is_enabled)
                    this._change_highlight_position(this._pointed_highlight_edit, mouse_pos);
                else
                    this._change_highlight_position(this._pointed_highlight, mouse_pos);
            }
        }

        for(const highlight_sprite of Object.values(this._highlight_sprites)){
            highlight_sprite.update(delta_time);
        }

        for(const highlight of this.action_range_highlights){
            highlight.update(delta_time);
        }

        for(const highlight of this.player_actions_highlights){
            highlight.update(delta_time);
        }
        this._pointed_highlight.update(delta_time);
        this._pointed_highlight_edit.update(delta_time);
        this._character_focus_highlight.update(delta_time);
    }

    _change_highlight_position(highlight, new_pos){
        highlight.position = new_pos;
        highlight.text = this.help_text_at(new_pos);
    }

    get _visibility_predicate(){
        // Filter tiles to draw depending on the player's visibility.
        if(!this._require_tiles_update)
            return undefined; // No need to update tiles.

        if(this.enable_tile_rendering_debug){ // Used for debugging the tiles rendering.
            // Force the fog-of-war filter to "see" how the rendering is done, even if fog is disabled.
            const predicate = position => this.fog_of_war.is_visible(position);
            this._require_tiles_update = false;
            return predicate;
        }

        // With fog of war disabled, draw all tiles.
        const predicate = this.enable_fog_of_war ? position => this.fog_of_war.is_visible(position) : () => true;
        this._require_tiles_update = false;
        return predicate;
    }

    get _effects_visibility_predicate(){
        // Effects are never displayed if not visible.
        return (gfx_position)=>{
            // Translate position of particles into position in the grid.
            const position = this.grid_position(gfx_position);
            return this.fog_of_war.is_visible(position);
        };
    }

    render_graphics(){
        const visibility_predicate = this._visibility_predicate;
        const effect_visibility_predicate = this._effects_visibility_predicate;

        this.tile_grid.draw_floor(graphics.screen_canvas_context, visibility_predicate);

        this._render_ground_highlights();
        this._render_entities();

        this.tile_grid.draw_surface(graphics.screen_canvas_context, visibility_predicate);
        this.tile_grid.draw_effects(graphics.screen_canvas_context, effect_visibility_predicate);

        if(this.enable_fog_of_war){
            this.fog_of_war.display(graphics.screen_canvas_context, this.tile_grid.canvas_context);
        }


        this._render_top_highlights();

        if(!editor.is_enabled)
            this.ui.display();
        this._render_help(); // TODO: replace this by highlights being UI elements?
    }

    _render_ground_highlights(){
        if(!this.player_actions_highlights.some(highlight=> this._character_focus_highlight.position.equals(highlight.position)))
            this._character_focus_highlight.draw();

        if(!mouse.is_dragging
        && !editor.is_enabled
        ){
            if(this.is_time_for_player_to_chose_action){
                this.player_actions_highlights
                    .filter(highlight=> !this.enable_fog_of_war || this.fog_of_war.is_visible(highlight.position))
                    .forEach(highlight => highlight.draw());
            }

            if(!this.ui.is_selecting_action_target
                && !this.ui.is_mouse_over
                && !this._pointed_highlight.position.equals(this._character_focus_highlight.position)
                && !this.player_actions_highlights.some(highlight=> this._pointed_highlight.position.equals(highlight.position))
                ){
                    if(!this.enable_fog_of_war
                    || this.fog_of_war.was_visible(this._pointed_highlight.position))
                        this._pointed_highlight.draw();
                }
        }

    }

    _render_top_highlights(){

        if(!mouse.is_dragging){

            if(!editor.is_enabled && this.is_time_for_player_to_chose_action){
                this.action_range_highlights.forEach(highlight => highlight.draw());
            }

            if(editor.is_enabled){
                this._pointed_highlight_edit.draw();
            }
        }
    }

    _render_help(){
        this.player_actions_highlights.forEach(highlight => highlight.draw_help());
        this._pointed_highlight.draw_help();
        this._character_focus_highlight.draw_help();
        this._pointed_highlight_edit.draw_help();
    }

    focus_on_position(position){
        console.assert(position instanceof concepts.Position);
        this._character_focus_highlight.enabled = true;
        this._change_highlight_position(this._character_focus_highlight, position);
    }

    clear_focus(){
        this._character_focus_highlight.enabled = false;
    }

    help_text_at(position){
        // TODO: consider displaying more than just the thing pointed on top.
        let help_text = "Hole"; // FIXMIE: This is a hack while "HOLE" have an undefined id.
        const things_found = this.game.world.everything_at(position);
        while(things_found.length){
            const entity_or_tileid = things_found.pop();
            if(entity_or_tileid instanceof concepts.Entity){

                if(!this.fog_of_war.is_visible(position)) // Skip entities if we are pointing somwewhere that is currently not visible.
                    continue;

                const entity = entity_or_tileid;
                if(entity instanceof concepts.Body && entity.is_player_actor){
                    help_text = `${entity.name} (player)`;
                } else {
                    help_text = entity.name;
                }
                break;
            } else {
                const tile_id = entity_or_tileid;
                help_text = tiles.info_text(tile_id);
            }
        }
        return help_text;
    }

    // Re-interpret the game's state from scratch.
    reset(){
        console.assert(this._requires_reset);

        const world = this.game.world;
        console.assert(world);

        this._reset_tilegrid(world);

        this.fog_of_war.clear_fovs();

        this.entity_views = Object.assign({}, this._create_entity_views(this.game.world.items, ItemView)
                                            , this._create_entity_views(this.game.world.bodies, CharacterView));

        this.fog_of_war.refresh(world);
        this._require_tiles_update = true;

        this.highlight_available_basic_actions();
        this.ui.show_action_buttons(Object.values(this.game.turn_info.possible_actions));

        this._requires_reset = false;
    }

    on_canvas_resized(){
        this.ui.cancel_action_target_selection();
        this.notify_edition();
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
            if(entity.is_player_actor){
                this.fog_of_war.add_fov(entity.id, entity.field_of_vision);
                this._require_tiles_update = true;
            }
        });
        return entity_views;
    }

    remove_entity_view(entity_id){
        delete this.entity_views[entity_id];
        this.fog_of_war.remove_fov(entity_id);
        this._require_tiles_update = true;
    }

    // Called by the editor code when editing the game in a way the require re-interpreting the game's state.
    notify_edition(){
        this._requires_reset = true;
    }

    // Returns the position on the grid of a graphic position in the game space (not taking into account the camera scrolling).
    // returns undefined if the positing isn't on the grid.
    grid_position(game_position){
        const grid_pos = graphics.from_graphic_to_grid_position(game_position, PIXELS_PER_TILES_SIDE, this.tile_grid.position);

        if(!this.game.world.is_valid_position(grid_pos)){
            return undefined;
        }

        return new concepts.Position(grid_pos);
    }

    center_on_player(){
        const player = this.player_character;
        const player_position = player.position;
        this.center_on_position(player_position);
    }

    center_on_player_if_too_far(){
        const player = this.player_character;
        console.assert(player);
        this.center_on_limit_position_if_too_far(player.position, 500);
    }

    center_on_position(grid_position, ms_to_center = 0){
        console.assert(Number.isInteger(grid_position.x) && Number.isInteger(grid_position.y));
        console.assert(Number.isInteger(ms_to_center) && ms_to_center >= 0);

        const gfx_position = graphics.from_grid_to_graphic_position(grid_position, PIXELS_PER_TILES_SIDE)
            .translate(square_half_unit_vector); // center in the square
        const camera_move_animation = tween(graphics.camera.center_position, gfx_position, ms_to_center, (new_center)=>{ // TODO: replace this by a steering behavior! Currently we are always moving even if we already are at the right place.
            graphics.camera.center(new Vector2(new_center));
        }, easing.in_out_quad);

        return this.camera_animations.play(camera_move_animation);
    }

    center_on_limit_position_if_too_far(grid_position, ms_to_center = 0){
        const camera_grid_position = this.grid_position(graphics.camera.center_position);

        if(!camera_grid_position){
            return this.center_on_position(grid_position, ms_to_center);
        }

        const limit_distance = { x: 6, y: 5 };
        if(Math.abs(camera_grid_position.x - grid_position.x) >= limit_distance.x
        || Math.abs(camera_grid_position.y - grid_position.y) >= limit_distance.y
        ) {
            return this.center_on_position(grid_position, ms_to_center);
        }

        return Promise.resolve();
    }

};



