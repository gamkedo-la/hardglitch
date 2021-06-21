export {
    Rule_Stream,
}

import * as debug from "../system/debug.js";
import * as audio from "../system/audio.js";
import * as concepts from "../core/concepts.js";
import * as tiles from "../definitions-tiles.js";
import * as spatial from "../system/spatial.js";
import { apply_directional_force, Pushed } from "./rules-forces.js";
import { GameView } from "../game-view.js";
import { Sprite } from "../system/graphics.js";
import { wait } from "../system/animation.js";
import { Character } from "../core/character.js";

function get_stream_sprites(game_view){
    const stream_sprites = tiles.stream_tile_ids.map(tile_id => game_view.tile_grid.floor_top_tile_grid.sprites[tile_id]).filter(sprite => sprite instanceof Sprite);
    return stream_sprites;
}

class Streams_StartedMoving extends concepts.Event
{
    constructor(){
        super({
            allow_parallel_animation: false,
            description: `Streams start moving...`,
        });

    }

    get focus_positions() { return [ ]; }
    get is_world_event() { return true; }

    *animation(game_view){
        debug.assertion(()=> game_view instanceof GameView);
        game_view.clear_focus();

        const stream_sprites = get_stream_sprites(game_view);
        debug.assertion(()=> stream_sprites instanceof Array && stream_sprites.every(sprite => sprite instanceof Sprite));

        audio.playEvent("Streaming");
        stream_sprites.forEach(stream_sprite => stream_sprite.start_animation('moving'));
        yield* wait(250);
    }
};

class Streams_StoppedMoving extends concepts.Event
{
    constructor(){
        super({
            allow_parallel_animation: false,
            description: `Streams stops moving...`,
            is_world_event: true,
        });

    }

    get focus_positions() { return [ ]; }
    get is_world_event() { return true; }

    *animation(game_view){
        debug.assertion(()=> game_view instanceof GameView);
        game_view.clear_focus();

        const stream_sprites = get_stream_sprites(game_view);
        debug.assertion(()=> stream_sprites instanceof Array && stream_sprites.every(sprite => sprite instanceof Sprite));

        audio.stopEvent("Streaming");
        stream_sprites.forEach(stream_sprite => stream_sprite.start_animation('idle'));
        yield* wait(250);
    }
};

class Rule_Stream extends concepts.Rule {

    apply_stream_rule(world, stream_tile_id, translation) {
        debug.assertion(()=>world instanceof concepts.World);
        debug.assertion(()=>Number.isInteger(stream_tile_id));
        debug.assertion(()=>translation instanceof spatial.Vector2);
        const events = [];
        world.entities.filter(entity => world.tiles_at(entity.position).some(tile_id => tile_id === stream_tile_id))
            .forEach((entity) => {
                events.push(...apply_directional_force(world, entity.position, translation, Pushed));
            });
        return events;
    }

    update_world_at_the_beginning_of_game_turn(world){
        debug.assertion(()=>world instanceof concepts.World);

        const events = [
            ...this.apply_stream_rule(world, tiles.ID.STREAM_RIGHT, spatial.Vector2_unit_x),
            ...this.apply_stream_rule(world, tiles.ID.STREAM_LEFT, spatial.Vector2_negative_unit_x),
            ...this.apply_stream_rule(world, tiles.ID.STREAM_UP, spatial.Vector2_negative_unit_y),
            ...this.apply_stream_rule(world, tiles.ID.STREAM_DOWN, spatial.Vector2_unit_y),
        ];

        if(events.length == 0)
            return [];

        const player_bodies = world.bodies.filter(body=> body.is_player_actor);
        debug.assertion(()=> player_bodies instanceof Array && player_bodies.every(body => body instanceof Character && body.is_player_actor));
        const events_focus_positions = events.flatMap(event=> event.focus_positions);
        const are_events_visible_to_player = player_bodies.some(player_character => player_character.can_see_any(...events_focus_positions));

        if(are_events_visible_to_player)
            return [
                new Streams_StartedMoving(),
                ...events,
                new Streams_StoppedMoving(),
            ];
        else
            return events;
    }
};




