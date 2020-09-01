// This file provide animations as coroutines to be used when effects are played.

export {
    default_move_duration_ms,
    default_destruction_duration_ms,
    wait,
    move,
    jump,
    bounce,
    swap,
    destroyed,
    take_damage,
    repaired,
    missile,
    deleting_missile,
    take_item,
    drop_item,
    dissolve_item,
    decrypt_file,
    pushed,
    pulled,
}

import { graphic_position, EntityView, PIXELS_PER_HALF_SIDE, square_half_unit_vector, PIXELS_PER_TILES_SIDE } from "./view/entity-view.js";
import { tween, easing } from "./system/tweening.js";
import * as animation from "./system/animation.js";
import { Vector2 } from "./system/spatial.js";
import { GameFxView } from "./game-effects.js";
import * as audio from "./system/audio.js";
import { CharacterView } from "./view/character-view.js";
import { ItemView } from "./view/item-view.js";
import { Position } from "./core/concepts.js";
import { GameView } from "./game-view.js";
import { Sprite } from "./system/graphics.js";
import { is_number, random_float } from "./system/utility.js";

const default_move_duration_ms = 250;
const default_destruction_duration_ms = 666;

function* translate(thing_with_position, target_gfx_pos, duration_ms, easing){
    console.assert(thing_with_position.position instanceof Vector2);
    yield* tween(thing_with_position.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, duration_ms,
        (updated_position)=>{
            thing_with_position.position = updated_position;
        }, easing);
}

function* move(fx_view, entity_view, target_game_position, duration_ms=default_move_duration_ms){
    console.assert(entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);
    audio.playEvent('moveAction');
    const fx = fx_view.move(entity_view.position.translate(square_half_unit_vector));
    yield* animation.in_parallel(
        translate(fx, target_gfx_pos.translate(square_half_unit_vector), duration_ms),
        translate(entity_view, target_gfx_pos, duration_ms)
    );
    fx.done = true;
    entity_view.game_position = target_game_position;
}

function* wait(fx_view, character_view, duration_ms){
    console.assert(character_view instanceof CharacterView);
    // TODO: add some kind of animation here to show that the character is passing their turn.
    if(character_view.is_player){
        audio.playEvent('wait');
    } else {
        // TODO: here play the sound of NPCs (probably just the same sound but lower volume)
    }
    let fx_pos = character_view.position.translate(square_half_unit_vector);
    let fx = fx_view.wait(fx_pos, duration_ms);
    yield* animation.wait(duration_ms);
}

function* jump(fx_view, entity_view, target_game_position){
    console.assert(fx_view instanceof GameFxView);
    console.assert(entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);

    const jump_height = 50;
    const jump_duration_ms = 500;
    audio.playEvent('hoverAction');

    const top_initial_pos = entity_view.position.translate({ x:0, y: -jump_height });
    const top_target_pos = target_gfx_pos.translate({ x:0, y: -jump_height });

    let jump_up_fx = fx_view.jump_up(entity_view.position.translate(square_half_unit_vector));
    entity_view.is_flying = true;
    yield* translate(entity_view, top_initial_pos, jump_duration_ms, easing.in_out_quad);
    entity_view.is_visible = false;
    jump_up_fx.done = true;

    const fx_origin = top_initial_pos.translate({x:PIXELS_PER_HALF_SIDE, y: PIXELS_PER_HALF_SIDE});
    const fx_target = top_target_pos.translate({x:PIXELS_PER_HALF_SIDE, y: PIXELS_PER_HALF_SIDE});
    const jump_distance = fx_target.substract(fx_origin).length;
    const fx_duration = jump_distance * 2.5;
    let fx = fx_view.lightningJump(fx_origin, fx_target);
    audio.playEvent('jumpAction');
    yield* translate(fx, fx_target, fx_duration, easing.in_out_quad);
    fx.done = true;

    //const jump_effect_move_speed = 10.0;
    //yield* missile(fx_view.missile(top_initial_pos), top_target_pos, jump_effect_move_speed);

    let jump_down_fx = fx_view.jump_down(top_target_pos.translate(square_half_unit_vector));
    entity_view.position = top_target_pos;
    entity_view.is_visible = true;
    audio.playEvent('lowerAction');
    yield* translate(entity_view, target_gfx_pos, jump_duration_ms, easing.in_out_quad);
    jump_down_fx.done = true;

    entity_view.game_position = target_game_position;
    entity_view.is_flying = false;
}

function* bounce(entity_view, target_game_position, duration_ms=default_move_duration_ms){
    const initial_position = entity_view.game_position;
    const initial_gfx_pos = graphic_position(initial_position);
    const target_gfx_pos = graphic_position(target_game_position);
    const translation = target_gfx_pos.substract(initial_gfx_pos).normalize().multiply(PIXELS_PER_HALF_SIDE / 2);
    const bounce_limit_gfx_pos = initial_gfx_pos.translate(translation);
    audio.playEvent('bounce');
    yield* translate(entity_view, bounce_limit_gfx_pos, duration_ms / 2);
    yield* translate(entity_view, initial_gfx_pos, duration_ms / 2);
    entity_view.game_position = initial_position;
}

function* swap(fx_view, left_entity_view, right_entity_view){
    console.assert(fx_view instanceof GameFxView);
    console.assert(left_entity_view instanceof EntityView);
    console.assert(right_entity_view instanceof EntityView);

    const left_final_pos = right_entity_view.game_position;
    const right_final_pos = left_entity_view.game_position;
    yield* animation.in_parallel(
        jump(fx_view, left_entity_view, left_final_pos),
        jump(fx_view, right_entity_view, right_final_pos)
    );
}

function* destroyed(fx_view, entity_view, duration_ms=default_destruction_duration_ms){
    console.assert(fx_view instanceof GameFxView);
    console.assert(entity_view instanceof EntityView);
    // Center the sprite so that the rotation origin is in the center of it.
    const effect = fx_view.destruction(entity_view.position.translate(square_half_unit_vector));
    const initial_position = entity_view.position;
    entity_view.position = initial_position.translate(square_half_unit_vector);
    entity_view.for_each_sprite(sprite=>sprite.move_origin_to_center());
    entity_view.is_being_destroyed = true;
    // WwhwhhiiiiiiiiiIIIIIIIIIiiiizzzzzzzzzzZZZZZZZZZZZZZ
    audio.playEvent('explode');
    yield* tween( {
                scale_x: entity_view.scale.x,
                scale_y: entity_view.scale.y,
                orientation: entity_view.orientation,
            }, {
                scale_x: 0,
                scale_y: 0,
                orientation: entity_view.orientation + 360,
            },
            duration_ms,
            (values) => {
                entity_view.scale = { x: values.scale_x, y: values.scale_y };
                entity_view.orientation = values.orientation;
            },
            easing.in_out_quad
    );
    effect.done = true;
    entity_view.is_visible = false;
    entity_view.for_each_sprite(sprite=>sprite.reset_origin());
    entity_view.position = initial_position;
}

function* take_damage(fx_view, entity_view){
    console.assert(fx_view instanceof GameFxView);
    console.assert(entity_view instanceof EntityView);
    // WwhwhhiiiiiiiiiIIIIIIIIIiiiizzzzzzzzzzZZZZZZZZZZZZZ
    const intensity = 10;
    const time_per_move = Math.round(500 / 4);
    const initial_position = new Vector2(entity_view.position);
    const effect = fx_view.damage(initial_position.translate(square_half_unit_vector));
    audio.playEvent('takeDamage');
    yield* translate(entity_view, initial_position.translate({ x: intensity, y: 0}), time_per_move);
    yield* translate(entity_view, initial_position.translate({ x: -intensity, y: 0}), time_per_move);
    yield* translate(entity_view, initial_position.translate({ x: 0, y: -intensity}), time_per_move);
    yield* translate(entity_view, initial_position.translate({ x: 0, y: intensity}), time_per_move);
    yield* translate(entity_view, initial_position, time_per_move);
    effect.done = true;
}

function* repaired(fx_view, entity_view){
    console.assert(entity_view instanceof EntityView);
    const intensity = 32;
    const time_per_move = Math.round(500 / 2);
    const initial_position = new Vector2(entity_view.position);
    const fx = fx_view.repair(initial_position.translate(square_half_unit_vector));
    // TODO: Insert effect here
    audio.playEvent('repairAction');
    yield* translate(entity_view, initial_position.translate({ x: 0, y: -intensity}), time_per_move);
    yield* translate(entity_view, initial_position, time_per_move);
    //yield* translate(fx, fx_target, fx_duration, easing.in_out_quad);
    fx.done = true;
}

// Speed is square per seconds
function* missile(missile_effect, target_gfx_position, speed = 4.0){
    missile_effect.position = missile_effect.position.translate(square_half_unit_vector);
    const duration = ((target_gfx_position.distance(missile_effect.position) / PIXELS_PER_TILES_SIDE) / speed) * 1000;
    yield* translate(missile_effect, target_gfx_position.translate(square_half_unit_vector), duration);
    missile_effect.done = true;
}

function* deleting_missile(fx_view, source_position, target_position){
    console.assert(fx_view instanceof GameFxView);
    const missile_effect = fx_view.deleteBall(graphic_position(source_position));
    audio.playEvent('deleteAction');
    yield* missile(missile_effect, graphic_position(target_position));
}

function* take_item(fx_view, taker_view, item_view){
    console.assert(taker_view instanceof CharacterView);
    console.assert(item_view instanceof ItemView);
    const take_duration_ms = 500;
    audio.playEvent('item');
    const initial_position = item_view.position;
    const initial_scale = item_view.scale;
    item_view.for_each_sprite(sprite=>sprite.move_origin_to_center());
    item_view.position = initial_position.translate(square_half_unit_vector);
    let fx_pos = initial_position.translate(square_half_unit_vector);
    const fx = fx_view.take(fx_pos);
    yield* animation.in_parallel(
        tween( { scale_x: item_view.scale.x, scale_y: item_view.scale.y, }, { scale_x: 0, scale_y: 0, },
                take_duration_ms,
                (values) => {
                    item_view.scale = { x: values.scale_x, y: values.scale_y };
                },
                easing.in_out_quad
            ),
        translate(item_view, taker_view.position.translate(square_half_unit_vector), take_duration_ms),
    );
    item_view.is_visible = false;
    item_view.scale = initial_scale;
    item_view.position = initial_position;
    item_view.for_each_sprite(sprite => sprite.reset_origin());
    fx.done = true;
}

function* drop_item(fx_view, drop_position) {
    let fx_pos = graphic_position(drop_position).translate(square_half_unit_vector);
    const fx = fx_view.drop(fx_pos);
    yield* animation.wait(300);
    fx.done = true;
}


function* dissolve_item(item_view){
    console.assert(item_view instanceof ItemView);
    // TODO: replace this by something better :/
    const duration_ms = 500;
    audio.playEvent('item'); // TODO: Replace by another sound?
    // TODO: add effects here ;__;
    const initial_scale = item_view.scale;
    const initial_position = item_view.position;
    item_view.for_each_sprite(sprite=>sprite.move_origin_to_center());
    item_view.position = initial_position.translate(square_half_unit_vector);
    yield* tween( item_view.scale.y, 0, duration_ms,
                (value) => { item_view.scale = { x: initial_scale.x, y: value }; },
                easing.in_out_quad
            );
    item_view.is_visible = false;
    item_view.scale = initial_scale;
    item_view.position = initial_position;
    item_view.for_each_sprite(sprite => sprite.reset_origin());
}

function* shake(entity_view, amplitude, frequency_ms, duration_or_predicate){
    console.assert(entity_view instanceof EntityView);
    console.assert(is_number(amplitude));
    console.assert((Number.isInteger(duration_or_predicate) && duration_or_predicate >= 0) || duration_or_predicate instanceof Function);
    let time_passed = 0;
    let time_since_shake = frequency_ms;
    const predicate = duration_or_predicate instanceof Function ? duration_or_predicate : (time_passed)=> time_passed < duration_or_predicate;
    const initial_position = entity_view.position;
    const random_shift = ()=> random_float(-amplitude, amplitude);
    const shifted_position = () => { return { x: random_shift(), y: random_shift() } };
    while(predicate(time_passed)){
        if(time_since_shake >= frequency_ms){
            entity_view.position = initial_position.translate( shifted_position() );
            time_since_shake = 0;
        }
        const delta_time = yield;
        time_passed += delta_time;
        time_since_shake += delta_time;
    }
    entity_view.position = initial_position;
}

function* decrypt_file(file_view){
    console.assert(file_view instanceof ItemView);
    const file_sprite = file_view.get_sprite("body");
    console.assert(file_sprite instanceof Sprite);
    yield* animation.wait(500);
    file_sprite.start_animation("decrypt");
    const until_the_animation_ends = ()=> file_sprite.is_playing_animation === true;
    yield* shake(file_view, 4, 1000 / 24, until_the_animation_ends);
    audio.playEvent('item');
    file_view.is_visible = false;
    // TODO: replace by another sound
    // TODO: Effect for spawing a new object?
    // TODO: add an effect here
}

function* pushed(fx_view, entity_view, to_position){
    console.assert(entity_view instanceof EntityView);
    console.assert(to_position instanceof Position);
    audio.playEvent('pushPull');
    const fx_start_pos = entity_view.position.translate(square_half_unit_vector);
    const fx_stop_pos = graphic_position(to_position).translate(square_half_unit_vector);
    let push_fx = fx_view.pushed(fx_start_pos, fx_stop_pos);
    yield* move(entity_view, to_position);
    push_fx.done = true;
}

const pulled = pushed;


