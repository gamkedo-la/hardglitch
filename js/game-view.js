// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, CharacterView, graphic_position };

import * as debug from "./system/debug.js";
import * as graphics from "./system/graphics.js";
import * as audio from "./system/audio.js";
import * as ui from "./system/ui.js";
import * as anim from "./system/animation.js";
import * as visibility from "./core/visibility.js";
import { mouse } from "./system/input.js";

import * as concepts from "./core/concepts.js";
import { Character } from "./core/character.js";

import { Game } from "./game.js";
import { Vector2, Rectangle, keep_in_rectangle, is_point_under } from "./system/spatial.js";


import * as tiles from "./definitions-tiles.js";
import {
    graphic_position, PIXELS_PER_TILES_SIDE, square_half_unit_vector,
    EntityView,
} from "./view/entity-view.js";
import { TileGridView } from "./view/tilegrid-view.js";
import { CharacterView } from "./view/character-view.js";
import { GameInterface } from "./game-ui.js";
import { mouse_grid_position, mouse_game_position, } from "./game-input.js";
import { sprite_defs } from "./game-assets.js";
import { Move } from "./rules/rules-movement.js";
import { ItemView } from "./view/item-view.js";
import { FogOfWar } from "./view/fogofwar.js";
import { TakeItem } from "./rules/rules-items.js";
import { GameFxView } from "./game-effects.js";
import { add_text_line, group_per_type, position_from_index, predicate_unique } from "./system/utility.js";
import { config } from "./game-config.js";
import { turn_sequence } from "./core/action-turn.js";
import { grid_ID } from "./definitions-world.js";
import { Corruption } from "./rules/rules-corruption.js";
import { Unstability } from "./rules/rules-unstability.js";
import { show_info } from "./ui/ui-infobox.js";
import { item_description } from "./definitions-texts.js";
import { CameraControl } from "./view/camera-control.js";
import { BlackBox, CryptoFile } from "./definitions-items.js";

const a_very_long_time = 99999999999999;
const goal_message = "Find The Exit!";
const turn_message_player_turn = "Play";
const turn_message_processing_turns = "...Processing Cycles...";
const turn_message_action_selection = "Select A Target";
const turn_message_display_begin_ms = 0;
const turn_message_display_end_ms = 3000;

class Highlight{
    enabled = true;

    // Reuse a sprite for highlighting.
    constructor(position, sprite, tooltip, info_text, events){
        debug.assertion(()=>Number.isInteger(position.x) && Number.isInteger(position.y));
        debug.assertion(()=>sprite instanceof graphics.Sprite);
        debug.assertion(()=>tooltip === undefined || typeof tooltip === 'string');
        debug.assertion(()=>info_text === undefined || typeof info_text === 'string');
        this._sprite = sprite;
        if(tooltip){
            this._help_text = new ui.HelpText({
                text: tooltip,
                area_to_help: new Rectangle(), // will be updated when we set the position.
                in_screenspace: false, // We will display the text in the game space.
                delay_ms: 200,
            });
        }
        this.position = position;
        this.events = events;
        this.info_text = info_text;
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
                const mouse_pos = mouse_grid_position();
                if(mouse_pos){
                    let text_pos = graphic_position(mouse_pos.translate({ x:1, y:0 }));
                    this._help_text.position = text_pos;
                    text_pos = keep_in_rectangle(this._help_text._area, graphics.camera.rectangle).position; // Adjust to always be in screen.
                    this._help_text.position = text_pos;
                }
            }
        }


        if(this.events){
            debug.assertion(()=>this._help_text);
            if(this._help_text.is_mouse_over_area_to_help){
                if(!this._mouse_is_over){
                    this._mouse_is_over = true;
                    this.events.on_mouse_over_begin();
                }
            } else {
                if(this._mouse_is_over){
                    this._mouse_is_over = false;
                    this.events.on_mouse_over_end();
                }
            }
        }
    }

    draw(canvas_context){
        // if(!graphics.camera.can_see(this._sprite.area)) // TODO: this is buggy, check why
        //     return;
        debug.assertion(()=>!graphics.camera.is_rendering_in_screen);
        if(!this.enabled)
            return;

        this._sprite.position = graphic_position(this._position); // BEWARE: We share the sprite with other highlights so we need to reposition it before each redraw.
        this._sprite.draw(canvas_context);
        this._drawn_since_last_update = true;

        // We have to do this in the draw function to make sure we get the info of the updated sprite.
        if(typeof this.info_text === "string"
        && is_point_under(mouse_game_position(), this._sprite.area)){
            show_info(this.info_text);
        }
    }

    draw_help(){
        debug.assertion(()=>!graphics.camera.is_rendering_in_screen);
        if(this._help_text && this._drawn_since_last_update){
            this._help_text.draw(graphics.screen_canvas_context);
        }
    }

};

class GameView {
    entity_views = {};
    is_time_for_player_to_chose_action = true;
    fx_view = new GameFxView();
    current_animations = new anim.AnimationGroup(); // Plays event animations that have started.
    skipped_animations = new anim.AnimationGroup(); // Plays event animations that needs to be done in one update.
    special_animations = new anim.AnimationGroup();
    player_actions_highlights = []; // Must contain Highlight objects for the currently playable actions.
    action_range_highlights = []; // Must contain Highlight objects for the currently pointed action's range.
    item_drop_highlights = []; // Must contain Highlight objects for possible item drop positions.
    delay_between_animations_ms = Math.round(1000 / 10); // we'll try to keep a little delay between each beginning of parallel animation.
    enable_parallel_animations = false;
    enable_edition = false; // Turn on to limit view for editor mode.

    camera_control = new CameraControl();

    get enable_fog_of_war() { return this._enable_fog_of_war; };
    set enable_fog_of_war(new_value) {
        debug.assertion(()=>typeof(new_value) === "boolean");
        if(new_value !== this._enable_fog_of_war){
            this._enable_fog_of_war = new_value;
            this._require_tiles_update = true;
        }
    };

    get enable_tile_rendering_debug() { return this._enable_tile_rendering_debug; };
    set enable_tile_rendering_debug(new_value) {
        debug.assertion(()=>typeof(new_value) === "boolean");
        if(new_value !== this._enable_tile_rendering_debug){
            this._require_tiles_update = true;
            this._enable_tile_rendering_debug = new_value;
            if(this._enable_tile_rendering_debug === false)
                this._requires_reset = true;
        }
    };

    enable_auto_camera_center = true;

    constructor(game, open_menu){
        debug.assertion(()=>game instanceof Game);
        this.game = game;
        this._requires_reset = true;
        this._require_tiles_update = true;
        this._enable_fog_of_war = true;
        this._enable_tile_rendering_debug = false;
        this._corrutions_count = 0;

        const ui_config = {
            on_action_selection_begin: (...args) => {
                this._last_action_selection_args = [...args];
                this.on_action_selection_begin(...args);
            },
            on_action_selection_end: (...args) => this.on_action_selection_end(...args),
            on_action_pointed_begin: (...args) => {
                // if(!this.ui.is_selecting_action_target){
                    this.clear_highlights_basic_actions();
                    this.highlight_action_range(...args);
                    this._last_action_pointed_data = [...args];
                // }
            },
            on_action_pointed_end: (...args) => {
                if(this.ui.is_selecting_action_target && this._last_action_selection_args instanceof Array){
                    this.clear_action_range_highlight();
                    ui_config.on_action_selection_begin(...this._last_action_selection_args);
                } else {
                    this.clear_action_range_highlight(...args);
                    this.highlight_available_basic_actions();
                    delete this._last_action_selection_args;
                }
            },
            toggle_autofocus: () => {
                this.enable_auto_camera_center = !this.enable_auto_camera_center;
                if(this.enable_auto_camera_center){
                    this.focus_on_current_player_character();
                } else {
                    this.camera_control.stop();
                }
            },
            open_menu: open_menu,
            is_autofocus_enabled: () => this.enable_auto_camera_center,
            on_item_dragging_begin: (drop_positions)=> this.highlight_item_drops(drop_positions),
            on_item_dragging_end: ()=> this.clear_item_drop_highlight(),
            view_finder: (entity_id) => this.get_entity_view(entity_id),
            visibility_predicate: (position) => this.fog_of_war.is_visible(position),
        };

        this.ui = new GameInterface(ui_config);

        this._highlight_sprites = {
            neutral: new graphics.Sprite(sprite_defs.highlight_blue),
            movement: new graphics.Sprite(sprite_defs.highlight_green),
            take: new graphics.Sprite(sprite_defs.highlight_gray),
            drop: new graphics.Sprite(sprite_defs.highlight_gray),
            basic_action: new graphics.Sprite(sprite_defs.highlight_yellow),
            action_range: new graphics.Sprite(sprite_defs.highlight_yellow),
            action_range_forbidden: new graphics.Sprite(sprite_defs.highlight_gray),
            action: new graphics.Sprite(sprite_defs.highlight_red),
            edit: new graphics.Sprite(sprite_defs.highlight_purple),
            turn: new graphics.Sprite(sprite_defs.highlight_purple),
        };

        this._pointed_highlight = new Highlight({x:0, y:0}, this._highlight_sprites.neutral, "Tile");
        this._pointed_highlight_edit = new Highlight({x:0, y:0}, this._highlight_sprites.edit, "EDITOR");
        this._character_focus_highlight = new Highlight({x:0, y:0}, this._highlight_sprites.turn, "Character");

        this.fog_of_war = new FogOfWar(this.game.world);

        this._turn_message = new ui.Text({
            text: turn_message_player_turn,
            font: "32px ZingDiddlyDooZapped",
            background_color: "#000000a0",
            color: "orange",
            enabled: false,
        });
        this._time_since_beginning_turn_message = 0;
        this._need_show_player_turn = true;

        this._central_message = new ui.Text({
            text: goal_message,
            font: "50px ZingDiddlyDooZapped",
            background_color: "#000000a0",
            color: "white",
            enabled: true,
            align: "center",
        });

        this.reset();

        if(this.player_character){
            // force-place the camera centered on the player character.
            const gfx_position = this.get_entity_view(this.player_character.id).position;
            graphics.camera.center_position = gfx_position;
        }

        // Display the goal message and disappear.
        const goal_display_duration_ms = 6000;
        this.show_central_message(goal_message, goal_display_duration_ms);
    }

    interpret_turn_events(event_sequence) {
        debug.assertion(()=>event_sequence);

        this.event_sequence = event_sequence;
        this._launch_next_animation_batch();
    }

    _pop_next_event_animation(){
        this.next_event = this.event_sequence.next();

        while(!this.next_event.done){
            const event = this.next_event.value;
            debug.assertion(()=>event instanceof concepts.Event);

            if(event.animation){
                debug.assertion(()=>event.focus_positions);
                const animation = {
                        start_animation: ()=> this._start_event_animation(event),
                        parallel: event.allow_parallel_animation,
                        focus_positions: event.focus_positions,
                        is_world_event: event.is_world_event,
                        force_skip_animation: event.force_skip_animation,
                    };
                return animation;
            }


            this.next_event = this.event_sequence.next();
        }

        delete this.next_event;
    }

    *_start_event_animation(event){
        debug.assertion(()=>event instanceof concepts.Event);
        yield* event.animation(this);
    };

    _add_highlight(position, sprite, tooltip, description, events){
        this.player_actions_highlights.push(new Highlight(position, sprite, tooltip, description, events));
    }

    get_entity_view(entity_id){
        debug.assertion(()=>Number.isInteger(entity_id));
        const entity_view = this.entity_views[entity_id];
        return entity_view;
    }

    focus_on_entity(entity_id, force){
        const entity_view = this.get_entity_view(entity_id);

        if(entity_view instanceof EntityView
        && this.fog_of_war.is_visible(entity_view.game_position)
        ){
            this.focus_on_position(entity_view.game_position);

            if(this.enable_auto_camera_center){
                if((entity_view instanceof CharacterView && entity_view.is_player))
                    this.camera_control.track(entity_view);
                // else
                //     this.camera_control.focus_on(entity_view.game_position);
            } else {
                if(force){
                    this.camera_control.focus_on(entity_view.game_position, window.camera_tracking.target_radius);
                }
            }
        }
        return entity_view;
    }

    focus_on_current_player_character(force=false){
        if(this.player_character){
            return this.focus_on_entity(this.player_character.id, force);
        }
    }

    _action_highlight_events(action){
        const events = {
            on_mouse_over_begin: () => {
                if(this.player_character){
                    const preview_costs = {
                        action_points: this.player_character.stats.action_points.value - action.constructor.costs.action_points.value,
                    };
                    this.ui.character_status.begin_preview_costs(preview_costs);
                    this.ui.timeline.begin_preview_costs(preview_costs);
                }
            },
            on_mouse_over_end: () => {
                this.ui.timeline.end_preview_costs();
                this.ui.character_status.end_preview_costs();
            },
        };
        return events;
    }

    help_text_over_action(action){
        debug.assertion(()=>action instanceof concepts.Action);
        const help_texts = this.help_texts_at(action.target_position);
        const maybe_linejump = help_texts.tooltip.length > 0 ? `\n` : '';
        const action_tooltip = `-> ACTION: ${action.name} (${action.constructor.costs.action_points.value} AP)`;
        help_texts.tooltip = add_text_line(help_texts.tooltip, action_tooltip);
        help_texts.info = add_text_line(help_texts.info, `${maybe_linejump}-> ACTION: ${action.constructor.action_type_name}\n(see Action buttons for details)`);
        return help_texts;
    }

    // Setup highlights for actions that are known with a target position.
    highlight_available_basic_actions(){
        this.clear_highlights_basic_actions(); // Clear previous highlighting
        if(!this.player_character)
            return;

        debug.assertion(()=>this.player_character instanceof Character);
        const available_actions = this.game.turn_info.possible_actions;
        for(const action of Object.values(available_actions).filter(predicate_unique)){ // Each action once (otherwise we get multiple descriptions for the same action)
            debug.assertion(()=>action instanceof concepts.Action);
            if(action.is_basic ){ //&& action.is_safe){
                const help_texts = this.help_text_over_action(action);
                debug.assertion(()=>typeof help_texts.info === "string" && help_texts.info.length > 0);
                debug.assertion(()=>typeof help_texts.tooltip === "string" && help_texts.tooltip.length > 0);
                const events = this._action_highlight_events(action);
                if(action instanceof Move)
                    this._add_highlight(action.target_position, this._highlight_sprites.movement, help_texts.tooltip, help_texts.info, events);
                else if(action instanceof TakeItem)
                    this._add_highlight(action.target_position, this._highlight_sprites.take, help_texts.tooltip, help_texts.info, events);
                else
                    this._add_highlight(action.target_position, this._highlight_sprites.basic_action, help_texts.tooltip, help_texts.info, events);
            }
        }

    }

    clear_highlights_basic_actions(){
        this.ui.character_status.end_preview_costs();
        this.player_actions_highlights = [];
    }

    highlight_selected_action_targets(action_info){
        this.clear_highlights_basic_actions(); // Clear previous highlighting

        for(const action of action_info.actions){
            debug.assertion(()=>this.player_character instanceof Character);
            if(action.target_position){
                const help_texts = this.help_text_over_action(action);
                this._add_highlight(action.target_position, this._highlight_sprites.action, help_texts.tooltip, help_texts.info, this._action_highlight_events(action));
            }
        }
    }

    highlight_action_range(action_range, action_targets){
        debug.assertion(()=>action_targets instanceof Array);
        debug.assertion(()=>action_targets.every(target=> target instanceof concepts.Position));

        this.clear_highlights_basic_actions();
        this.clear_action_range_highlight();

        if(action_range instanceof Function)
            action_range = action_range(this.player_character);

        if(action_range instanceof visibility.RangeShape){
            const possible_targets = visibility.positions_in_range(this.player_character.position, action_range, (pos)=>this.game.world.is_valid_position(pos));
            possible_targets.forEach(target =>{
                const highlight_sprite = action_targets.some(action_target=> action_target.equals(target)) ? this._highlight_sprites.action_range : this._highlight_sprites.action_range_forbidden;
                this.action_range_highlights.push(new Highlight(target, highlight_sprite));
            });
        }
    }

    clear_action_range_highlight(){
        this.action_range_highlights = [];
    }

    highlight_item_drops(possible_drops){
        debug.assertion(()=>possible_drops instanceof Array);
        this.clear_item_drop_highlight();
        possible_drops.forEach(drop_position => {
            this.item_drop_highlights.push(new Highlight(drop_position, this._highlight_sprites.drop));
        });
    }

    clear_item_drop_highlight(){
        this.item_drop_highlights = [];
    }

    on_action_selection_begin(action_info){
        debug.assertion(()=>this.ui.is_selecting_action_target);
        this.highlight_selected_action_targets(action_info);
        this.clear_action_range_highlight();
        this.show_turn_message(turn_message_action_selection);
    }

    on_action_selection_end(action){
        if(action instanceof concepts.Action){
            this.clear_highlights_basic_actions();
        } else {
            // Action selection was cancelled.
            this.highlight_available_basic_actions();
        }
    }

    update(delta_time){

        ///////////////////////////////////////////////////////////////////////////
        // Any animation in this group should be iterated just once and be done.
        audio.set_events_enabled(false); // We want to hear no audio coming from the animation.
        this.skipped_animations.update(a_very_long_time);
        audio.set_events_enabled(true);
        ///////////////////////////////////////////////////////////////////////////

        if(mouse.is_dragging){
            this.camera_control.stop();
        }
        this.camera_control.update(delta_time);

        this._update_highlights(delta_time);

        if(this._requires_reset){
            this.reset();
            if(this.enable_edition)
                return;
        }


        this.tile_grid.update(delta_time);

        this._update_animations(delta_time);
        this._update_entities(delta_time);

        this.special_animations.update(delta_time);
        this.fx_view.update(delta_time);

        if(this.enable_edition)
            return;

        this.fog_of_war.update(delta_time);

        if(this.player_character){
            this.ui.timeline.is_corruption_visible = this._corrutions_count > 0
                                                    && this.fog_of_war.can_see(pos=> this.game.world.grids[grid_ID.corruption].get_at(pos) instanceof Corruption);
            this.ui.update(delta_time, this.player_character, this.game.world);
        }

        this._update_turn_message(delta_time);

        this._central_message.update(delta_time);
    }

    _update_turn_message(delta_time){
        this._time_since_beginning_turn_message += delta_time;
        if(this._turn_message.enabled){
            if(this._time_since_beginning_turn_message < this._turn_message_end_ms){
                this._turn_message.visible = this._time_since_beginning_turn_message > this._turn_message_begin_ms;
            } else {
                this._turn_message.enabled = false;
            }
        }
        this._turn_message.update(delta_time);
    }

    _launch_next_animation_batch(){
        debug.assertion(()=>this.current_animations.animation_count === 0);
        // Get the next animations that are allowed to happen in parallel.
        let delay_for_next_animation = 0;
        const max_frame_time = 3000.0;
        const begin_time = performance.now();
        while(performance.now() - begin_time < max_frame_time){ // timeout!

            debug.assertion(()=>this.enable_parallel_animations || this.current_animations.animation_count === 0);

            const animation = this._pop_next_event_animation();
            if(!animation) // End of event/animation sequences.
                break;

            const is_visible_to_player = this.fog_of_war.is_any_visible(...animation.focus_positions);
            if((!is_visible_to_player && !animation.is_world_event)
            || animation.force_skip_animation
            ){
                // No need to play the action in a visible way, just skip it (but still play it).
                audio.set_events_enabled(false); // Don't play audio coming from skipped animations
                this.skipped_animations.play(animation.start_animation());
                audio.set_events_enabled(true);
                continue;
            }

            // Start the animation, delayed by the previous parallel one:
            if(this.enable_parallel_animations && this.delay_between_animations_ms > 0){
                if(delay_for_next_animation > 0){
                    animation.iterator = anim.delay(delay_for_next_animation, ()=>{ return animation.start_animation(); });
                }
                delay_for_next_animation += this.delay_between_animations_ms;
            }

            if(!animation.iterator){
                animation.iterator = animation.start_animation();
            }

            this.current_animations.play(animation.iterator)
                .then(()=> {
                    // Refresh the FOW after each event, to make sure we always see the most up to date world.
                    this.fog_of_war.refresh(this.game.world);
                    this._require_tiles_update = true;
                });

            if(!this.enable_parallel_animations || animation.parallel === false)
                break; // We need to only play the animations that are next to each other and parallel.

        }
    }

    // This is a "hack" to "fix" the following issue: when entity views are moving (through animations) outside the FOV of the player,
    // they might end up 1 square shifted from the actual position they should be in.
    // Here we detect that situation and correct the view positions, just to be completely sure.
    _sync_fix_entity_view_positions(){
        // We assume that the world's entities and views are in sync right now (this must not be called while animations are being played).
        this.list_entity_views
            .forEach(view => {
                const entity = view._character ? view._character : view._item; // this.game.world.get_entity(view.id); // it should have been this but oh well...
                debug.assertion(()=>entity instanceof concepts.Entity);
                if(!view.game_position.equals(entity.position)){
                    // console.log(`WTF ${entity.id}: view = { ${view.game_position.x}, ${view.game_position.y} }, entity = { ${entity.position.x}, ${entity.position.y} }`);
                    view.game_position = entity.position;
                    if(entity instanceof Character
                    && !entity.position.equals(entity.field_of_vision.position)){
                        console.warn(`INCONSISTENT FOV  ${entity.id}: entity = { ${entity.position.x}, ${entity.position.y} }, fov = { ${entity.field_of_vision.position.x}, ${entity.field_of_vision.position.y} } - auto-fixing...`);
                        entity.field_of_vision.position = entity.position;
                        entity.field_of_vision.update(this.game.world);
                    }
                }
            });
    }

    _update_animations(delta_time){
        // Update the current animation, if any, or switch to the next one, until there isn't any left.
        if(this.current_animations.animation_count != 0 || (this.next_event && !this.next_event.done)){
            if(this.is_time_for_player_to_chose_action){
                this._stop_player_turn();
            }

            if(this.current_animations.animation_count === 0){
                this._launch_next_animation_batch();
            }

            this.current_animations.update(delta_time);

            if(!this.is_time_for_player_to_chose_action
            && this.current_animations.animation_count === 0
            && this.next_event === undefined
            ){
                this._sync_fix_entity_view_positions();
                this.start_player_turn();
            } else {
                if(this.player_character
                && (this.player_character.stats.action_points.value <= 0
                    || this.player_character.skip_turn
                )){
                    if(this.is_any_npc_visible){ // Only show the turn message when there are other characters that needs to be displayed
                        this.show_turn_message(turn_message_processing_turns, 0);
                        this._need_show_player_turn = true;
                    }
                }
            }
        }
    }

    get is_any_npc_visible(){
        const all_npcs_position = this.list_entity_views
            .filter(entity=> entity instanceof CharacterView && !entity.is_player)
            .map(character=>character.game_position);
        return this.fog_of_war.is_any_visible(...all_npcs_position);
    }

    get player_character() {
        return this.game.turn_info.player_character;
    }

    _stop_player_turn(){
        this.is_time_for_player_to_chose_action = false;
        this.clear_highlights_basic_actions();
        this.ui.lock_actions();
    }

    start_player_turn(){
        this.is_time_for_player_to_chose_action = true;
        this._clear_current_playing_character_view();
        if(this.player_character != null){

            const player_view = this.get_entity_view(this.player_character.id);
            if(player_view instanceof CharacterView){
                player_view.is_playing = true;
            }

            if(this.enable_auto_camera_center){
                this.focus_on_current_player_character();
            }

            this.focus_on_current_player_character();
            this.ui.unlock_actions();
            this.refresh();
            if(this._need_show_player_turn){
                this.show_turn_message(turn_message_player_turn);
                this._need_show_player_turn = false;
            }

        } else {
            // Case where there is no player character at all.
            this.clear_focus();
            this.lock_actions();
        }
    }

    _clear_current_playing_character_view(){
        this.list_entity_views.forEach(view=> view.is_playing = false);
    }

    show_turn_message(message, begin_ms = turn_message_display_begin_ms, end_ms = turn_message_display_end_ms){
        debug.assertion(()=>message === undefined || typeof message === "string");
        if(message !== undefined){
            this._turn_message.text = message;
        }

        this._time_since_beginning_turn_message = 0;
        this._turn_message.enabled = config.enable_turn_message;
        this._turn_message_begin_ms = begin_ms;
        this._turn_message_end_ms = end_ms;
    }

    clear_turn_message(){
        this._turn_message.enabled = false;
    }


    _update_entities(delta_time){
        const entity_views = this.list_entity_views;
        debug.assertion(()=>typeof(delta_time) === 'number');
        debug.assertion(()=>entity_views instanceof Array);
        for(const entity_view of entity_views){
            debug.assertion(()=>entity_view instanceof EntityView);
            entity_view.update(delta_time);
            if(entity_view.persist_visibility){
                entity_view.force_visible =  !this.fog_of_war.is_visible(entity_view.game_position) && this.fog_of_war.was_visible(entity_view.game_position);
            }
        };
    }

    get list_entity_views() { return Object.values(this.entity_views); }

    _render_entities(canvas_context, filter){
        debug.assertion(()=>filter instanceof Function);
        // We need to render the entities in order of verticality so that things souther
        // than other things can be drawn over, allowing to display higher sprites.
        this.list_entity_views
            .filter(filter)
            .sort((left_view, right_view) => left_view.position.y - right_view.position.y)
            .forEach(view => view.render_graphics(canvas_context));
    }

    _render_pointed_character_extra_info(canvas_context){
        if(!this.is_time_for_player_to_chose_action)
            return;
        const entity_view = this.list_entity_views.find(entity_view=> entity_view.is_mouse_over);
        if(entity_view instanceof CharacterView
        && this.fog_of_war.is_visible(entity_view.game_position)
        ){
            entity_view.draw_extra_info(canvas_context);
        }
    }

    _clear_pointed_highlight(){
        delete this._last_mouse_grid_pos;
        this._pointed_highlight_edit.enabled = false;
        this._pointed_highlight.enabled = false;
    }

    _update_highlights(delta_time){
        const mouse_pos = mouse_grid_position();
        const is_pointing_valid_square = mouse_pos !== undefined // We have a valid mouse position
                                       && (
                                            (   !this.ui.is_mouse_over // we are not pointing over the UI.
                                             && this.fog_of_war.is_visible(mouse_pos) // Player can see the pointed square
                                             && this.player_actions_highlights.every(highlight=> !highlight.position.equals(mouse_pos)) // Not already pointing an action highlight.
                                            )
                                           || this.enable_edition // Or we are in editor mode
                                          );
        if(is_pointing_valid_square){
            if(!this._last_mouse_grid_pos || !mouse_pos.equals(this._last_mouse_grid_pos)){
                this._last_mouse_grid_pos = mouse_pos;
                if(this.enable_edition){
                    this._change_highlight_position(this._pointed_highlight_edit, mouse_pos);
                }
                else {
                    this._change_highlight_position(this._pointed_highlight, mouse_pos);
                }
            }
        } else {
            this._clear_pointed_highlight();
        }

        for(const highlight_sprite of Object.values(this._highlight_sprites)){
            highlight_sprite.update(delta_time);
        }

        for(const highlight of this.action_range_highlights){
            highlight.update(delta_time);
        }

        for(const highlight of this.item_drop_highlights){
            highlight.update(delta_time);
        }

        const is_mouse_dragging = mouse.is_dragging;
        for(const highlight of this.player_actions_highlights){
            highlight.enabled = !is_mouse_dragging && (!this.ui.is_mouse_over || this.ui.is_selecting_action_target);
            highlight.update(delta_time);
        }
        this._pointed_highlight.update(delta_time);
        this._pointed_highlight_edit.update(delta_time);
        this._character_focus_highlight.update(delta_time);
    }

    _change_highlight_position(highlight, new_pos){
        highlight.enabled = true;
        highlight.position = new_pos;
        const help_texts = this.help_texts_at(new_pos);
        highlight.text = help_texts.tooltip;
        highlight.info_text = help_texts.info;
    }

    _visibility_predicate(allow_past_visibility = false){
        // Filter tiles to draw depending on the player's visibility.
        if(!this._require_tiles_update)
            return undefined; // No need to update tiles.

        const was_visible = position => this.fog_of_war.was_visible(position);
        const is_visible = position => this.fog_of_war.is_visible(position);
        const predicate = allow_past_visibility ? was_visible : is_visible;


        if(this.enable_tile_rendering_debug){ // Used for debugging the tiles rendering.
            // Force the fog-of-war filter to "see" how the rendering is done, even if fog is disabled.
            return predicate;
        }

        const everything = () => true;
        // With fog of war disabled, draw all tiles.
        return this.enable_fog_of_war ? predicate : everything;
    }

    _effects_visibility_predicate(){
        // Effects are never displayed if not visible.
        return (gfx_position)=>{
            // Translate position of particles into position in the grid.
            const position = this.grid_position(gfx_position);
            return this.fog_of_war.is_visible(position); // Only display effects in view.
        };
    }

    render_graphics(){
        const visibility_predicate = this._visibility_predicate();
        const wide_visibility_predicate = this._visibility_predicate(true);
        const effect_visibility_predicate = this._effects_visibility_predicate();

        this.tile_grid.draw_floor(graphics.screen_canvas_context, visibility_predicate);

        this._render_ground_highlights();
        this._render_entities(graphics.screen_canvas_context, entity_view => this.enable_edition || (!entity_view.is_flying && !entity_view.force_visible));

        if(!this.ui.is_selecting_action_target)
            this._render_pointed_character_extra_info(graphics.screen_canvas_context);

        if(this.enable_fog_of_war){
            this.fog_of_war.display(graphics.screen_canvas_context);
        }

        this.tile_grid.draw_surface(graphics.screen_canvas_context, visibility_predicate);
        this.tile_grid.draw_effects(graphics.screen_canvas_context, effect_visibility_predicate);

        this.fog_of_war.capture_visible_squares(this.tile_grid.canvas_context);

        this.fx_view.draw(graphics.screen_canvas_context, effect_visibility_predicate);

        this._render_entities(graphics.screen_canvas_context, entity_view => (entity_view.is_flying && this.fog_of_war.is_visible(entity_view.game_position)) || entity_view.force_visible || this.enable_edition);

        this._render_top_highlights();

        if(!this.enable_edition && this.player_character)
            this.ui.display();

        this._render_turn_message();

        this._render_help(); // TODO: replace this by highlights being UI elements?

        this._require_tiles_update = false;
    }

    _render_turn_message(){
        if(this._turn_message.enabled
        && config.enable_turn_message
        && !this.enable_edition
        ){

            this._turn_message.position = {
                x: graphics.centered_rectangle_in_screen(this._turn_message.area).position.x,
                y: this.ui.action_buttons_top - this._turn_message.height - 16,
            };

            graphics.camera.begin_in_screen_rendering();
            this._turn_message._reset(graphics.screen_canvas_context); // To make sure it's always at the right position.
            this._turn_message.draw(graphics.screen_canvas_context);
            graphics.camera.end_in_screen_rendering();
        }
    }

    _render_ground_highlights(){
        if(!this.player_actions_highlights.some(highlight=> this._character_focus_highlight.position.equals(highlight.position)))
            this._character_focus_highlight.draw();

        if(!mouse.is_dragging
        && !this.enable_edition
        ){
            if(this.is_time_for_player_to_chose_action
            && (!this.ui.is_mouse_over || this.ui.is_selecting_action_target)
            ){
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

            if(!this.enable_edition && this.is_time_for_player_to_chose_action){
                this.action_range_highlights.forEach(highlight => highlight.draw());
            }

            if(this.enable_edition){
                this._pointed_highlight_edit.draw();
            }
        }

        this.item_drop_highlights.forEach(highlight => highlight.draw());
    }

    _render_help(){
        this.player_actions_highlights.forEach(highlight => highlight.draw_help());
        this._pointed_highlight.draw_help();
        this._character_focus_highlight.draw_help();
        this._pointed_highlight_edit.draw_help();


        graphics.camera.begin_in_screen_rendering();
        if(this._central_message.enabled)
            this._central_message.draw(graphics.screen_canvas_context);
        graphics.camera.end_in_screen_rendering();
    }

    focus_on_position(position){
        debug.assertion(()=>position instanceof concepts.Position);
        this._character_focus_highlight.enabled = true;
        this._change_highlight_position(this._character_focus_highlight, position);
    }

    clear_focus(){
        this._character_focus_highlight.enabled = false;
    }

    help_texts_at(position){

        const help_texts = {
            tooltip: "",
            info: "",
        };

        const things_found = this.game.world.everything_at(position);
        while(things_found.length){
            const entity_or_tileid = things_found.pop();
            if(entity_or_tileid instanceof concepts.Entity){

                if(!this.fog_of_war.is_visible(position)) // Skip entities if we are pointing somwewhere that is currently not visible.
                    continue;

                const entity = entity_or_tileid;
                if(entity instanceof Character ){
                    const controller = entity.is_player_actor ? "(Player)" : "(AI)";
                    help_texts.tooltip = add_text_line(help_texts.tooltip, `${entity.name} ${controller}`);
                    help_texts.info = add_text_line(help_texts.info, `@ ${entity.name}:\n${entity.description}`);
                } else {
                    const item_desc = entity.can_be_taken ? "! ITEM: " : "! ";
                    help_texts.tooltip = add_text_line(help_texts.tooltip, `${item_desc}${entity.name}`);
                    help_texts.info = add_text_line(help_texts.info, `${item_desc}${item_description(entity)}`);
                }
            } else if(Number.isInteger(entity_or_tileid)){ // Integers are tiles ids.
                if(config.enable_ground_descriptions || !tiles.defs[entity_or_tileid].is_ground){
                    const tile_id = entity_or_tileid;
                    const tile_name = tiles.name_text(tile_id);
                    help_texts.tooltip = add_text_line(help_texts.tooltip, `# ${tile_name}`);
                    help_texts.info = add_text_line(help_texts.info, `# ${tile_name}:\n${tiles.info_text(tile_id)}`);
                }
            } else {
                const thing = entity_or_tileid; // Probably an effect. We just want to display something
                help_texts.tooltip = add_text_line(help_texts.tooltip, `*${thing.name}*`);
                help_texts.info = add_text_line(help_texts.info, `*${thing.name}*:\n${thing.description}`);
            }
        }
        return help_texts;
    }

    // Re-interpret the game's state from scratch.
    reset(){
        debug.assertion(()=>this._requires_reset);

        const world = this.game.world;
        debug.assertion(()=>world);

        this._reset_tilegrid(world);
        this.reset_effects_layers();

        this.reset_entities();

        this.refresh();

        this._requires_reset = false;
    }

    reset_entities(){
        this.fog_of_war.clear_fovs();

        this._recreate_entity_views(this.game.world.entities);
    }

    reset_effects_layers(){

        const add_fx_to_effect = (grid_id, effect_type, effect_func) => {
            const grid = this.game.world.grids[grid_id];
            grid.elements.forEach((effect, idx) => {
                debug.assertion(()=>effect instanceof effect_type);
                if(!effect.fx){
                    const position = position_from_index(this.game.world.width, this.game.world.height, idx);
                    const fx_position = graphic_position(position).translate(square_half_unit_vector);
                    effect.fx = effect_func(fx_position);
                    if(effect_type === Corruption){
                        ++this._corrutions_count;
                    }
                }
            });
        };

        add_fx_to_effect(grid_ID.corruption, Corruption, (pos)=>this.fx_view.corrupt(pos));
        add_fx_to_effect(grid_ID.unstable, Unstability, (pos)=>this.fx_view.unstable(pos));

    }

    refresh(){
        this.fog_of_war.refresh(this.game.world);

        if(!this._last_turn_ids_sequence)
            this._last_turn_ids_sequence = turn_sequence(this.game.world);
        this.ui.timeline.request_refresh(this._last_turn_ids_sequence);
        this._require_tiles_update = true;
        if(!this.enable_edition && this.enable_auto_camera_center){
            this.focus_on_current_player_character();
        }
        this.highlight_available_basic_actions();
        if(this.player_character){

            const actions_infos = this.player_character.get_all_enabled_actions_types()
                .map(action_type => {
                    debug.assertion(()=>action_type.prototype instanceof concepts.Action);
                    const action_type_name = action_type.name;
                    return {
                        [action_type_name]: {
                            actions: [],
                            action_type: action_type
                        },
                    };
                }).reduce((result, value) => {
                    return Object.assign(result, value);
                }, {});


            const allowed_actions = Object.values(this.game.turn_info.possible_actions);
            debug.assertion(()=>allowed_actions instanceof Array);
            debug.assertion(()=>allowed_actions.every(action => action instanceof concepts.Action));
            const allowed_actions_per_types = group_per_type(allowed_actions);
            for(const [action_type_name, actions] of Object.entries(allowed_actions_per_types)){
                if(actions_infos[action_type_name]){
                    actions_infos[action_type_name].actions = actions;
                } else {
                    actions_infos[action_type_name] = {
                        actions: actions,
                        action_type: actions[0].constructor,
                    }
                }
            }

            this.ui.show_action_buttons(actions_infos);

        }
    }

    on_canvas_resized(){
        this.ui.cancel_action_target_selection(false);
        this.ui.on_canvas_resized();
        this.notify_edition();
        this.focus_on_current_player_character();

        this._relocate_goal_text();
    }

    _relocate_goal_text(){
        this._central_message._reset(graphics.screen_canvas_context); // To make sure it's always at the right position.
        this._central_message.position = graphics.centered_rectangle_in_screen(this._central_message)
                                                .position
                                                .translate({ y: 120 });
    }

    _reset_tilegrid(world){
        if(this.tile_grid)
            this.tile_grid.reset(new Vector2(), new Vector2({ x: world.width, y: world.height }), world.grids[grid_ID.floor], world.grids[grid_ID.surface]);
        else
            this.tile_grid = new TileGridView(new Vector2(), new Vector2({ x: world.width, y: world.height }), world.grids[grid_ID.floor], world.grids[grid_ID.surface]);

        this.tile_grid.update(0);
    }

    _recreate_entity_views(entities){
        debug.assertion(()=>entities instanceof Array);
        this.entity_views = {};
        entities.forEach(entity => {
            this.add_entity_view(entity);
        });
    }

    add_entity_view(entity_or_view_or_id){
        debug.assertion(()=>entity_or_view_or_id instanceof concepts.Entity || entity_or_view_or_id instanceof EntityView || Number.isInteger(entity_or_view_or_id));

        let entity_view;
        if(Number.isInteger(entity_or_view_or_id)){
            const entity_id = entity_or_view_or_id;
            entity_or_view_or_id = this.game.world.get_entity(entity_id);
            if(entity_or_view_or_id === undefined) return;
            debug.assertion(()=>entity_or_view_or_id instanceof concepts.Entity);
        }

        if(entity_or_view_or_id instanceof concepts.Entity){
            const entity = entity_or_view_or_id;
            const view_type = entity instanceof Character ? CharacterView : ItemView;
            entity_view = new view_type(entity);
            // We want to keep some types of entities always visible as soon as they have been seen once.
            if(entity instanceof CryptoFile
            || entity instanceof BlackBox
            ){
                entity_view.persist_visibility = true;
            }
        } else {
            debug.assertion(()=>entity_or_view_or_id instanceof EntityView);
            entity_view = entity_or_view_or_id;
        }

        debug.assertion(()=>entity_view instanceof EntityView);
        const entity = entity_view instanceof ItemView ? entity_view._item : entity_view._character;
        if(entity.is_player_actor){
            this.fog_of_war.add_fov(entity.id, entity.field_of_vision);
            this._require_tiles_update = true;
        }
        if(entity.id === this.player_character.id){
            entity_view.is_playing = true;
        }

        debug.assertion(()=>entity_view instanceof EntityView);
        debug.assertion(()=>this.entity_views[entity_view.id] === undefined || this.entity_views[entity_view.id].id === entity_view.id);
        this.entity_views[entity_view.id] = entity_view;
        entity_view.update(0);
        return entity_view;
    }

    remove_entity_view(entity_or_view_or_id){
        let entity_id = entity_or_view_or_id;
        if(entity_or_view_or_id instanceof EntityView)
            entity_id = entity_or_view_or_id.id;
        const entity_view = this.entity_views[entity_id];
        delete this.entity_views[entity_id];
        this.fog_of_war.remove_fov(entity_id);
        if(entity_view instanceof CharacterView && entity_view.is_player){
            this.last_removed_player_fov = entity_view._character.field_of_vision;
        }
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

    stop_camera_animation(){
        this.camera_control.stop();
    }

    center_on_position(grid_position){
        return this.camera_control.focus_on(grid_position);
    }

    show_central_message(text, duration_ms = 0){
        if(this._promise_central_message_stop){
            this._promise_central_message_stop.cancel();
            delete this._promise_central_message_stop;
        }
        this._central_message.enabled = true;
        this._central_message.text = text;
        this._relocate_goal_text();
        if(duration_ms > 0){
            this._promise_central_message_stop = this.special_animations.play(anim.wait(duration_ms));
            this._promise_central_message_stop.then((token)=> {
                if(token instanceof anim.CancelToken)
                    return;
                this._central_message.enabled = false
            });
        }
    }

};




