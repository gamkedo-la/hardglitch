1// This file provide animations as coroutines to be used when effects are played.

export {
    default_move_duration_ms,
    default_destruction_duration_ms,
    wait,
    move,
    jump,
    bounce,
    swap,
    destroyed,
    take_hit_damage,
    repaired,
    missile,
    deleting_missile,
    repairing_missile,
    take_item,
    player_take_item,
    drop_item,
    inventory_add,
    inventory_remove,
    inventory_destroy,
    dissolve_item,
    decrypt_file,
    pushed,
    pulled,
    scanned,
    spawned,
    in_screen_spawn,
    exited,
    merge_characters,
    value_animation,
    integrity_value_change,
    action_points_value_change,
    lightning_between,
    invokation,
    shift_cast,
}

import * as debug from "./system/debug.js";
import { graphic_position, EntityView, PIXELS_PER_HALF_SIDE, square_half_unit_vector, PIXELS_PER_TILES_SIDE } from "./view/entity-view.js";
import { tween, easing } from "./system/tweening.js";
import * as animation from "./system/animation.js";
import * as ui from "./system/ui.js";
import { Vector2 } from "./system/spatial.js";
import { GameFxView } from "./game-effects.js";
import * as audio from "./system/audio.js";
import { CharacterView } from "./view/character-view.js";
import { ItemView } from "./view/item-view.js";
import { Position } from "./core/concepts.js";
import * as graphics from "./system/graphics.js";
import { is_number, random_float, random_int } from "./system/utility.js";
import { crypto_kind as crypto_kinds } from "./definitions-items.js";
import { GameView } from "./game-view.js";
import { Color } from "./system/color.js";

const default_move_duration_ms = 1000 / 8;
const default_destruction_duration_ms = 666;

function* translate(thing_with_position, target_gfx_pos, duration_ms, easing){
    debug.assertion(()=>thing_with_position.position instanceof Vector2);
    yield* tween(thing_with_position.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, duration_ms,
        (updated_position)=>{
            thing_with_position.position = updated_position;
        }, easing);
}

function* move(fx_view, entity_view, target_game_position, duration_ms=default_move_duration_ms){
    debug.assertion(()=>entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);
    audio.playEvent('moveAction'); // Add condition for enemy sound?
    const fx = fx_view.move(entity_view.position.translate(square_half_unit_vector));
    yield* animation.in_parallel(
        translate(fx, target_gfx_pos.translate(square_half_unit_vector), duration_ms),
        translate(entity_view, target_gfx_pos, duration_ms)
    );
    fx.done = true;
    entity_view.game_position = target_game_position;
}

function* wait(fx_view, character_view, duration_ms){
    debug.assertion(()=>character_view instanceof CharacterView);
    // if(character_view.is_player){
    //     audio.playEvent('wait');
    // } else {
    //     // TODO: here play the sound of NPCs (probably just the same sound but lower volume)
    // }
    let fx_pos = character_view.position.translate(square_half_unit_vector);
    let fx = fx_view.wait(fx_pos, duration_ms);
    yield* animation.wait(duration_ms);
}

function* jump(fx_view, entity_view, target_game_position){
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>entity_view instanceof EntityView);
    const target_gfx_pos = graphic_position(target_game_position);

    const jump_height = 50;
    const jump_duration_ms = 500;
    audio.playEvent('hoverAction');

    const top_initial_pos = entity_view.position.translate({ x:0, y: -jump_height });
    const top_target_pos = target_gfx_pos.translate({ x:0, y: -jump_height });

    let jump_up_fx = fx_view.jump_up(entity_view.position.translate(square_half_unit_vector));
    entity_view.is_flying = true;
    yield* translate(entity_view, top_initial_pos, jump_duration_ms, easing.in_out_quad);
    const previous_visibility = entity_view.is_visible;
    entity_view.is_visible = false;
    jump_up_fx.done = true;

    const fx_origin = top_initial_pos.translate({x:PIXELS_PER_HALF_SIDE, y: PIXELS_PER_HALF_SIDE});
    const fx_target = top_target_pos.translate({x:PIXELS_PER_HALF_SIDE, y: PIXELS_PER_HALF_SIDE});
    const jump_distance = fx_target.substract(fx_origin).length;
     const fx_duration = Math.min(1000, jump_distance * 2.5);
    let fx = fx_view.lightningJump(fx_origin, fx_target);
    audio.playEvent('jumpAction');
    yield* translate(fx, fx_target, fx_duration, easing.in_out_quad);
    fx.done = true;

    //const jump_effect_move_speed = 10.0;
    //yield* missile(fx_view.missile(top_initial_pos), top_target_pos, jump_effect_move_speed);

    let jump_down_fx = fx_view.jump_down(top_target_pos.translate(square_half_unit_vector));
    entity_view.game_position = target_game_position;
    entity_view.position = top_target_pos;
    entity_view.is_visible = previous_visibility;
    audio.playEvent('lowerAction');
    yield* translate(entity_view, target_gfx_pos, jump_duration_ms, easing.in_out_quad);
    jump_down_fx.done = true;


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
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>left_entity_view instanceof EntityView);
    debug.assertion(()=>right_entity_view instanceof EntityView);

    const left_final_pos = right_entity_view.game_position;
    const right_final_pos = left_entity_view.game_position;
    yield* animation.in_parallel(
        jump(fx_view, left_entity_view, left_final_pos),
        jump(fx_view, right_entity_view, right_final_pos)
    );
}

function* destroyed(fx_view, entity_view, duration_ms=default_destruction_duration_ms){
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>entity_view instanceof EntityView);
    // Center the sprite so that the rotation origin is in the center of it.
    const effect = fx_view.destruction(entity_view.position.translate(square_half_unit_vector));
    const initial_position = entity_view.position;
    entity_view.for_each_sprite(sprite=>sprite.move_origin_to_center());
    entity_view.position = initial_position.translate(square_half_unit_vector);
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

function* take_hit_damage(fx_view, entity_view){
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>entity_view instanceof EntityView);
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
    debug.assertion(()=>entity_view instanceof EntityView);
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
    debug.assertion(()=>fx_view instanceof GameFxView);
    const missile_effect = fx_view.deleteBall(graphic_position(source_position));
    audio.playEvent('deleteAction');
    yield* missile(missile_effect, graphic_position(target_position));
}

function* repairing_missile(fx_view, source_position, target_position){
    debug.assertion(()=>fx_view instanceof GameFxView);
    const missile_effect = fx_view.missile(graphic_position(source_position));
    audio.playEvent('shakeAnim'); // TODO: replace by a proper sound for this!
    yield* missile(missile_effect, graphic_position(target_position));
}

function* take_item(fx_view, taker_view, item_view, target_slot_pos){
    debug.assertion(()=>taker_view instanceof CharacterView);
    debug.assertion(()=>item_view instanceof ItemView);
    const take_duration_ms = 500;
    const initial_position = item_view.position;
    const initial_scale = item_view.scale;
    audio.playEvent('item');
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


function* player_take_item(fx_view, taker_view, item_view, target_slot_pos){
    debug.assertion(()=>taker_view instanceof CharacterView);
    debug.assertion(()=>item_view instanceof EntityView);
    const take_duration_ms = 500;

    // Make the move into the inventory visible:
    target_slot_pos = new Vector2(target_slot_pos).translate(graphics.camera.position);
    audio.playEvent('item');
    item_view.force_visible = true;
    yield* translate(item_view, target_slot_pos, take_duration_ms);
    item_view.force_visible = false;
}

function* drop_item(fx_view, drop_position, raw_position=false) {
    let fx_pos = (raw_position) ? drop_position : graphic_position(drop_position);
    fx_pos = fx_pos.translate(square_half_unit_vector);
    const fx = fx_view.drop(fx_pos, .3);
    audio.playEvent('dropItem');
}

function* inventory_add(fx_view, inv, idx) {
    if(inv._slots[idx] == null)
        return;
    const fx_pos = inv._slots[idx].position.translate({x:36,y:36});
    const fx = fx_view.drop(fx_pos, .25);
    audio.playEvent('swapItem');
}

function* inventory_remove(fx_view, inv, idx) {
    if(inv._slots[idx] == null)
        return;
    const fx_pos = inv._slots[idx].position.translate({x:36,y:36});
    const fx = fx_view.take(fx_pos, .25);
    audio.playEvent('swapItem');
}

function* inventory_destroy(fx_view, inv, idx) {
    if(inv._slots[idx] == null)
        return;
    const fx_pos = inv._slots[idx].position.translate({x:36,y:36});
    const fx = fx_view.destruction(fx_pos, .25);
    audio.playEvent('explode');
    return fx;
}

function* dissolve_item(item_view){
    debug.assertion(()=>item_view instanceof ItemView);
    // TODO: replace this by something better :/
    const duration_ms = 500;
    audio.playEvent('dissolveRev'); // TODO: Replace by another sound?
    // TODO: add effects here ;__;
    const initial_scale = item_view.scale;
    const initial_position = item_view.position;
    item_view.is_being_destroyed = true;
    item_view.for_each_sprite(sprite=>sprite.move_origin_to_center());
    yield* tween( item_view.scale.y, 0, duration_ms,
                (value) => {
                    item_view.scale = { x: initial_scale.x, y: value };
                },
                easing.in_out_quad
            );
    item_view.is_visible = false;
    item_view.scale = initial_scale;
    item_view.position = initial_position;
    item_view.for_each_sprite(sprite => sprite.reset_origin());
}

function* shake(entity_view, amplitude, frequency_ms, duration_or_predicate){
    debug.assertion(()=>entity_view instanceof EntityView);
    debug.assertion(()=>is_number(amplitude));
    debug.assertion(()=>(Number.isInteger(duration_or_predicate) && duration_or_predicate >= 0) || duration_or_predicate instanceof Function);
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

function* decrypt_file(file_view, file_fx_view, key_view, key_fx_view, crypto_kind){
    debug.assertion(()=>key_view instanceof ItemView);
    debug.assertion(()=>file_view instanceof ItemView);
    debug.assertion(()=>file_fx_view instanceof GameFxView);
    debug.assertion(()=>key_fx_view instanceof GameFxView);
    const file_sprite = file_view.get_sprite("body");
    debug.assertion(()=>file_sprite instanceof graphics.Sprite);
    yield* animation.wait(100);
    file_sprite.start_animation("decrypt");
    const until_the_animation_ends = ()=> file_sprite.is_playing_animation === true;
    audio.playEvent('shakeRev');
    audio.playEvent('shakeSparkle');
    let keyPos = key_view.position.translate(square_half_unit_vector);
    let keyFxTTL = 2.25;
    key_fx_view.unlock(keyPos, keyFxTTL);
    let filePos = file_view.position.translate(square_half_unit_vector);
    let fileFxTTL = 2.25;
    switch (crypto_kind) {
        case crypto_kinds.triangle:
            file_fx_view.unlockTriangle(filePos, fileFxTTL);
            break;
        case crypto_kinds.plus:
            file_fx_view.unlockPlus(filePos, fileFxTTL);
            break;
        case crypto_kinds.equal:
            file_fx_view.unlockEqual(filePos, fileFxTTL);
            break;
        case crypto_kinds.circle:
            file_fx_view.unlockCircle(filePos, fileFxTTL);
            break;
    }

    const file_view_pos_in_screen = ()=> file_view.position.translate(graphics.camera.position.inverse).translate(square_half_unit_vector);
    const key_view_pos_in_screen = key_view.position.translate(square_half_unit_vector);
    const fx = key_fx_view.lightningJump(file_view_pos_in_screen(), key_view_pos_in_screen, [ new Color(255, 255, 255), new Color(0, 0, 0), new Color(122, 64, 188), new Color(247, 173, 77) ]);
    const update_fx_pos = function*(){
        while(until_the_animation_ends()){
            fx.position = file_view_pos_in_screen();;
            yield;
        }
    };

    yield* animation.in_parallel(
        shake(file_view, 4, 1000 / 24, until_the_animation_ends),
        update_fx_pos()
    );

    fx.done = true;
    audio.playEvent('decryptRev');
    file_view.is_visible = false;
}

function* lightning_between(fx_view, source_objet, target_object, duration_ms, stop_predicate=()=>false){

    if(stop_predicate())
        return;

    const source_pos = source_objet.position.translate(square_half_unit_vector);
    const target_pos = target_object.position.translate(square_half_unit_vector);
    const fx = fx_view.lightningJump(target_pos, source_pos, [ new Color(255, 255, 255) ]);

    const update_fx_pos = function*(target_object, fx, stop_predicate){
        while(!stop_predicate()){
            fx.position = target_object.position.translate(square_half_unit_vector);
            yield;
        }
    };

    yield* animation.in_parallel_any(
        animation.wait(duration_ms),
        update_fx_pos(target_object, fx, stop_predicate),
    );

    fx.done = true;
}

function* pushed(fx_view, entity_view, to_position){
    debug.assertion(()=>entity_view instanceof EntityView);
    debug.assertion(()=>to_position instanceof Position);
    audio.playEvent('pushPull');
    const fx_start_pos = entity_view.position.translate(square_half_unit_vector);
    const fx_stop_pos = graphic_position(to_position).translate(square_half_unit_vector);
    let push_fx = fx_view.pushed(fx_start_pos, fx_stop_pos);
    yield* move(fx_view, entity_view, to_position, 1000 / 3);
    push_fx.done = true;
}

const pulled = pushed;

function* scanned(fx_view, game_pos){
    debug.assertion(()=>fx_view instanceof GameFxView);
    const fx_pos = graphic_position(game_pos).translate(square_half_unit_vector);
    const fx = fx_view.scan(fx_pos);
    audio.playEvent('scanAnim');
    yield* animation.wait(700);
}

function* spawned(fx_view, game_pos, with_sounds=true){
    debug.assertion(()=>fx_view instanceof GameFxView);
    const fx_pos = graphic_position(game_pos).translate(square_half_unit_vector);
    const fx = fx_view.spawn(fx_pos);
    if(with_sounds)
        audio.playEvent('spawnAnim');
    yield* animation.wait(1200);
}

function* in_screen_spawn(fx_view, object_pos){
    debug.assertion(()=>fx_view instanceof GameFxView);
    const fx = fx_view.spawn(object_pos);
    yield* animation.wait(400);
    fx.done = true;
}

function* exited(fx_view, entity_view){
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>entity_view instanceof EntityView);
    let fx_pos = entity_view.position.translate(square_half_unit_vector);
    let fx = fx_view.portalOut(fx_pos);
    let duration_ms = 1250;
    //entity_view.for_each_sprite(sprite=>sprite.move_origin_to_center());
    //const initial_position = entity_view.position;
    //entity_view.position = initial_position.translate(square_half_unit_vector);
    yield* tween( {
                scale_x: entity_view.scale.x,
                scale_y: entity_view.scale.y,
            }, {
                scale_x: 0,
                scale_y: 0,
            },
            duration_ms,
            (values) => {
                entity_view.scale = { x: values.scale_x, y: values.scale_y };
            },
            easing.in_out_quad
    );
    fx.done = true;
}

function* invokation(fx_view, entity_view_to_invoke, invoker_position){
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>entity_view_to_invoke instanceof CharacterView);

    entity_view_to_invoke.is_visible = false;

    const invoker_gfx_pos = graphic_position(invoker_position).translate(square_half_unit_vector);
    const invokation_gfx_pos = entity_view_to_invoke.position.translate(square_half_unit_vector);

    const fx_lightning = ()=>{
        audio.playEvent("deleteAction2");
        return fx_view.lightningJump(invokation_gfx_pos.translate({
            x: random_int(-40, 40),
            y: random_int(-40, 40)
        }), invoker_gfx_pos);
    };

    let ms_to_lightning = 1000;
    for(let i = 0; i < 8; ++i){
        let lightning = fx_lightning();
        yield* animation.wait(ms_to_lightning);
        lightning.done = true;
        ms_to_lightning = Math.log(i) * 100;
    }

    audio.playEvent("explode");
    const spawn_fxs = [
        fx_view.destruction(invokation_gfx_pos),
        fx_view.portalOut(invokation_gfx_pos),
        fx_view.exitPortal(invokation_gfx_pos),
    ];
    entity_view_to_invoke.is_visible = true;
    yield* animation.wait(1000);
    spawn_fxs.forEach(fx=>fx.done = true);
}


function* merge_characters(fx_view, merged_view_a, merged_view_b){
    debug.assertion(()=>fx_view instanceof GameFxView);
    debug.assertion(()=>merged_view_a instanceof CharacterView);
    debug.assertion(()=>merged_view_b instanceof CharacterView);
    // TODO: replace this by something better :/
    const duration_ms = 500;
    audio.playEvent('dissolveRev'); // TODO: Replace by another sound
    const initial_position = merged_view_a.position;
    const initial_scale = merged_view_a.scale;
    merged_view_a.for_each_sprite(sprite=>sprite.move_origin_to_center());
    merged_view_a.position = initial_position.translate(square_half_unit_vector);
    let fx_pos = initial_position.translate(square_half_unit_vector);
    const fx = fx_view.take(fx_pos);
    yield* animation.in_parallel(
        tween( { scale_x: merged_view_a.scale.x, scale_y: merged_view_a.scale.y, }, { scale_x: 0, scale_y: 0, },
                duration_ms, (values) => {
                    merged_view_a.scale = { x: values.scale_x, y: values.scale_y };
                },
                easing.in_out_quad
            ),
        translate(merged_view_a, merged_view_b.position.translate(square_half_unit_vector), duration_ms),
    );
    merged_view_a.is_visible = false;
    merged_view_a.scale = initial_scale;
    merged_view_a.position = initial_position;
    merged_view_a.for_each_sprite(sprite => sprite.reset_origin());
    fx.done = true;
}

function* value_animation(game_view, value, gfx_position, duration_ms, text_descs = {}){
    debug.assertion(()=> game_view instanceof GameView);
    debug.assertion(()=> Number.isInteger(value));
    debug.assertion(()=> typeof duration_ms === "number");
    debug.assertion(()=> gfx_position instanceof Object && is_number(gfx_position.x) &&is_number(gfx_position.y));
    debug.assertion(()=> text_descs instanceof Object);

    text_descs = Object.assign({
                                    text: `${value>0?'+':''}${value}`,
                                    position: gfx_position
                                }, text_descs);
    const value_text = new ui.Text(text_descs);
    if(game_view.ui._next_value_text_id === undefined){
        game_view.ui._next_value_text_id = 0;
    }
    const value_text_id = `value_text_${game_view.ui._next_value_text_id}`;
    game_view.ui.ingame_elements[value_text_id] = value_text;

    const initial_position = new Vector2(gfx_position);
    const top_position = initial_position.translate({ y: -60 });

    yield* tween(initial_position, top_position, duration_ms, (new_position)=>{
            value_text.position = new_position;
        }, easing.in_out_quad);
    yield* animation.wait(1000);

    value_text.enabled = false;
    delete game_view.ui.ingame_elements[value_text_id];
}

function* integrity_value_change(game_view, value, gfx_position){
    yield* value_animation(game_view, value, gfx_position, default_move_duration_ms, {
        color: value === 0 ? "black" : "white",
        // stroke_color: "black",
        // line_width: 1,
        background_color: value < 0 ? "red" : value > 0 ? "green" : undefined,
        font: "24px Space Mono",
    });
}


function* action_points_value_change(game_view, value, gfx_position){
    yield* value_animation(game_view, value, gfx_position, default_move_duration_ms, {
        color: "orange",
        // stroke_color: "black",
        // line_width: 1,
        background_color: "yellow",
        font: "24px Space Mono",
    });
}

function* shift_cast(fx_view, gfx_position) {
    debug.assertion(()=> gfx_position instanceof Vector2);

    const fx_pos = gfx_position.translate({x:36,y:36});
    const fx_scan = fx_view.scan(fx_pos);
    audio.playEvent('scanAnim');
    yield* animation.wait(700);

    const fx_explode = fx_view.destruction(fx_pos);
    audio.playEvent('explode');
    yield* animation.wait(1000 / 2);
    return fx_explode;
}

