// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { GameView, BodyView, graphic_position };

import * as graphics from "./system/graphics.js";
import { tile_id } from "./game-assets.js";
import { random_int, is_number } from "./system/utility.js";
import * as concepts from "./core/concepts.js";

import { Game } from "./game.js";
import { Vector2 } from "./system/spatial.js";
import * as tiledefs from "./definitions-tiles.js";

import * as debug from "./debug.js";
import { tween } from "./system/tweening.js";

const PIXELS_PER_TILES_SIDE = 64;
const PIXELS_PER_HALF_SIDE = 32;
const square_unit_vector = new Vector2({ x: PIXELS_PER_TILES_SIDE, y: PIXELS_PER_TILES_SIDE });
const square_half_unit_vector = new Vector2({ x: PIXELS_PER_TILES_SIDE / 2 , y: PIXELS_PER_TILES_SIDE / 2 });

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

    *move_animation(target_game_position){
        console.assert(target_game_position instanceof concepts.Position);

        const move_duration = 200;
        const target_gfx_pos = graphic_position(target_game_position);

        yield* tween(this.position, {x:target_gfx_pos.x, y:target_gfx_pos.y}, move_duration,
            (updated_position)=>{ this.position = updated_position; });
        this.game_position = target_game_position;
    }

};

function isWall(v) {
    return (v == tiledefs.ID.WALL) ? 1 : 0;
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genFloorOverlay(lvl, layer, grid, overlay, baseID, otherID) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            // compute neighbors
            let p = {x:i, y:j};
            let neighbors = ((grid.right(p) == otherID) ? 1 : 0) + 
                            (((grid.up(p) == otherID) ? 1 : 0) << 1) + 
                            (((grid.left(p) == otherID) ? 1 : 0) << 2) + 
                            (((grid.down(p) == otherID) ? 1 : 0) << 3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            switch (neighbors) {
                case 0: // none
                    if (v == otherID) {
                        tl = "ttl";
                        tr = "rtt";
                        bl = "ltb";
                        br = "btr";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "obtr" : "om";
                        tr = (isWall(grid.ur(p))) ? "oltb" : "om";
                        bl = (isWall(grid.dl(p))) ? "ortt" : "om";
                        br = (isWall(grid.dr(p))) ? "ottl" : "om";
                    }
                    break;
                case 1: // right
                    if (v == otherID) {
                        tl = "ttl";
                        tr = "t";
                        bl = "ltb";
                        br = "b";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "obtr" : "om";
                        tr = (isWall(grid.ur(p))) ? "ol" : "ottle";
                        bl = (isWall(grid.dl(p))) ? "ortt" : "om";
                        br = (isWall(grid.dr(p))) ? "ol" : "oltbs";
                    }
                    break;
                case 2: // top
                    if (v == otherID) {
                        tl = "l";
                        tr = "r";
                        bl = "ltb";
                        br = "btr";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "ob" : "oltbe";
                        tr = (isWall(grid.ur(p))) ? "ob" : "obtrs";
                        bl = (isWall(grid.dl(p))) ? "ortt" : "om";
                        br = (isWall(grid.dr(p))) ? "ottl" : "om";
                    }
                    break;
                case 3: // top|right
                    if (v == otherID) {
                        tl = "l";
                        tr = (isWall(grid.ur(p))) ? "m" : "ttr";
                        bl = "ltb";
                        br = "b";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "ob" : "oltbe";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (isWall(grid.ur(p))) ? "obtl" : "obtlc";
                        br = (isWall(grid.dr(p))) ? "ol" : "oltbs";
                        bl = (isWall(grid.dl(p))) ? "ortt" : "om";
                    }
                    break;
                case 4: // left
                    if (v == otherID) {
                        tl = "t";
                        tr = "rtt";
                        bl = "b";
                        br = "btr";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "or" : "ortts";
                        tr = (isWall(grid.ur(p))) ? "oltb" : "om";
                        bl = (isWall(grid.dl(p))) ? "or" : "obtre";
                        br = (isWall(grid.dr(p))) ? "ottl" : "om";
                    }
                    break;
                case 5: // left|right
                    if (v == otherID) {
                        tl = "t";
                        tr = "t";
                        bl = "b";
                        br = "b";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "or" : "ortts";
                        tr = (isWall(grid.ur(p))) ? "ol" : "ottle";
                        bl = (isWall(grid.dl(p))) ? "or" : "obtre";
                        br = (isWall(grid.dr(p))) ? "ol" : "oltbs";
                    }
                    break;
                case 6: // top|left
                    if (v == otherID) {
                        tl = (isWall(grid.ul(p))) ? "m" : "ltt";
                        tr = "r";
                        bl = "b";
                        br = "btr";
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (isWall(grid.ul(p))) ? "ortb" : "ortbc";
                        tr = (isWall(grid.ur(p))) ? "ob" : "obtrs";
                        bl = (isWall(grid.dl(p))) ? "or" : "obtre";
                        br = (isWall(grid.dr(p))) ? "ottl" : "om";
                    }
                    break;
                case 7: // top|left|right
                    if (v == otherID) {
                        tl = (isWall(grid.ul(p))) ? "m" : "ltt";
                        tr = (isWall(grid.ur(p))) ? "m" : "ttr"
                        bl = "b";
                        br = "b";
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (isWall(grid.ul(p))) ? "ortb" : "ortbc";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (isWall(grid.ur(p))) ? "obtl" : "obtlc";
                        bl = (isWall(grid.dl(p))) ? "or" : "obtre";
                        br = (isWall(grid.dr(p))) ? "ol" : "oltbs";
                    }
                    break;
                case 8: // down
                    if (v == otherID) {
                        tl = "ttl";
                        tr = "rtt";
                        bl = "l";
                        br = "r";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "obtr" : "om";
                        tr = (isWall(grid.ur(p))) ? "oltb" : "om";
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 9: // down|right
                    if (v == otherID) {
                        tl = "ttl";
                        tr = "t";
                        bl = "l";
                        br = (isWall(grid.dr(p))) ? "m" : "rtb";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "obtr" : "om";
                        tr = (isWall(grid.ur(p))) ? "ol" : "ottle";
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        // conflict between oltbs and ortte -> olttc
                        br = (isWall(grid.dr(p))) ? "oltt" : "olttc";
                    }
                    break;
                case 10: // top|down
                    if (v == otherID) {
                        tl = "l";
                        tr = "r";
                        bl = "l";
                        br = "r";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "ob" : "oltbe";
                        tr = (isWall(grid.ur(p))) ? "ob" : "obtrs";
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 11: // top|down|right
                    if (v == otherID) {
                        tl = "l";
                        tr = (isWall(grid.ur(p))) ? "m" : "ttr"
                        bl = "l";
                        br = (isWall(grid.dr(p))) ? "m" : "rtb"
                    } else {
                        tl = (isWall(grid.ul(p))) ? "ob" : "oltbe";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (isWall(grid.ur(p))) ? "obtl" : "obtlc";
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        // conflict between oltbs and ortte -> olttc
                        br = (isWall(grid.dr(p))) ? "oltt" : "olttc";
                    }
                    break;
                case 12: // down|left
                    if (v == otherID) {
                        tl = "t";
                        tr = "rtt";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = "r";
                    } else {
                        tl = (isWall(grid.ul(p))) ? "or" : "ortts";
                        tr = (isWall(grid.ur(p))) ? "oltb" : "om";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottrc";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 13: // down|left|right
                    if (v == otherID) {
                        tl = "t";
                        tr = "t";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = (isWall(grid.dr(p))) ? "m" : "rtb"
                    } else {
                        tl = (isWall(grid.ul(p))) ? "or" : "ortts";
                        tr = (isWall(grid.ur(p))) ? "ol" : "ottle";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottrc";
                        // conflict between oltbs and ortte -> olttc
                        br = (isWall(grid.dr(p))) ? "oltt" : "olttc";
                    }
                    break;
                case 14: // top|down|left
                    if (v == otherID) {
                        tl = (isWall(grid.ul(p))) ? "m" : "ltt";
                        tr = "r";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = "r";
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (isWall(grid.ul(p))) ? "ortb" : "ortbc";
                        tr = (isWall(grid.ur(p))) ? "ob" : "obtrs";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottrc";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 15: // top|down|left|right
                    if (v == otherID) {
                        tl = (isWall(grid.ul(p))) ? "m" : "ltt";
                        tr = (isWall(grid.ur(p))) ? "m" : "ttr"
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = (isWall(grid.dr(p))) ? "m" : "rtb"
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (isWall(grid.ul(p))) ? "ortb" : "ortbc";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (isWall(grid.ur(p))) ? "obtl" : "obtlc";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottrc";
                        // conflict between oltbs and ortte -> olttc
                        br = (isWall(grid.dr(p))) ? "oltt" : "olttc";
                    }
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set_at(tile_id(lvl, layer, tl), i*2, j*2);
            if (tr) overlay.set_at(tile_id(lvl, layer, tr), i*2+1, j*2);
            if (bl) overlay.set_at(tile_id(lvl, layer, bl), i*2, j*2+1);
            if (br) overlay.set_at(tile_id(lvl, layer, br), i*2+1, j*2+1);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genFgOverlay(lvl, layer, grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            // compute neighbors
            let p = {x:i, y:j};
            let neighbors = isWall(grid.right(p)) + (isWall(grid.up(p)) << 1) + (isWall(grid.left(p)) << 2) + (isWall(grid.down(p))<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            switch (neighbors) {
                case 0: // none
                    if (isWall(v)) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 1: // right
                    if (isWall(v)) { // wall
                        tl = "ltbs";
                        tr = (isWall(grid.dr(p))) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (isWall(grid.dr(p))) ? "btls": "ltbe";
                    }
                    break;
                case 2: // top
                    if (isWall(v)) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 3: // top|right
                    if (isWall(v)) { // wall
                        tl = "ltbs";
                        tr = (isWall(grid.dr(p))) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (isWall(grid.dr(p))) ? "btls": "ltbe";
                    } else { // empty
                        tr = (isWall(grid.ur(p))) ? "obtl" : "";
                    }
                    break;
                case 4: // left
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = "btrs";
                        bl = (isWall(grid.dl(p))) ? "rtbe": "btrs";
                        br = "btr";
                    }
                    break;
                case 5: // left|right
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "rtbei" : "bi";
                        tr = (isWall(grid.dr(p))) ? "btlsi" : "bi";
                        bl = (isWall(grid.dl(p))) ? "rtbe": "b";
                        br = (isWall(grid.dr(p))) ? "btls": "b";
                    }
                    break;
                case 6: // top|left
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = (isWall(grid.dl(p))) ? "rtbe": "btrs";
                        br = "btr";
                    } else { // empty
                        tl = (isWall(grid.ul(p))) ? "ortb" : "";
                    }
                    break;
                case 7: // top|left|right
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "rtbei" : "bi";
                        tr = (isWall(grid.dl(p))) ? "btlsi" : "bi";
                        bl = (isWall(grid.dl(p))) ? "rtbe": "b";
                        br = (isWall(grid.dr(p))) ? "btls": "b";
                    } else { // empty
                        tl = (isWall(grid.ul(p))) ? "ortb" : "";
                        tr = (isWall(grid.ur(p))) ? "obtl" : "";
                    }
                    break;
                case 8: // down
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "ltti" : "ttl";
                        tr = (isWall(grid.dr(p))) ? "ttri" : "rtt";
                        bl = (isWall(grid.dl(p))) ? "ltts" : "ttle";
                        br = (isWall(grid.dr(p))) ? "ttre": "rtts";
                    } else { // empty
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 9: // down|right
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "ltti" : "ttl";
                        tr = (isWall(grid.dr(p))) ? "ttls" : "rtbi";
                        bl = (isWall(grid.dl(p))) ? "ltts" : "ttle";
                        br = (isWall(grid.dr(p))) ? "m" : "rtb";
                    } else { // empty
                        tr = (isWall(grid.dr(p))) ? "oltts" : "";
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        br = (isWall(grid.dr(p))) ? "oltt" : "ortte";
                    }
                    break;
                case 10: // top|down
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "ltti" : "l";
                        tr = (isWall(grid.dr(p))) ? "ttri" : "r";
                        bl = (isWall(grid.dl(p))) ? "ltts": "l";
                        br = (isWall(grid.dr(p))) ? "ttre": "r";
                    } else {
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 11: // top|down|right
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "ltti" : "l";
                        tr = (isWall(grid.dr(p))) ? (isWall(grid.ur(p))) ? "m" : "ttr" : "rtbi";
                        bl = (isWall(grid.dl(p))) ? "ltts": "l";
                        br = (isWall(grid.dr(p))) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between oltts and obtl
                        tr = (isWall(grid.dr(p))) ? "oltts" : (isWall(grid.ur(p))) ? "obtl" : "";
                        br = (isWall(grid.dr(p))) ? "oltt" : "ortte";
                        bl = (isWall(grid.dl(p))) ? "ot" : "ottls";
                    }
                    break;
                case 12: // down|left
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "rtte" : "btli";
                        tr = (isWall(grid.dr(p))) ? "ttri" : "rtt";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = (isWall(grid.dr(p))) ? "ttre": "rtts";
                    } else { // empty
                        tl = (isWall(grid.dl(p))) ? "ottre" : "";
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottls";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 13: // down|left|right
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? "t" : "btli";
                        tr = (isWall(grid.dr(p))) ? "t" : "rtbi";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = (isWall(grid.dr(p))) ? "m" : "rtb"
                    } else { // empty
                        tl = (isWall(grid.dl(p))) ? "ottre" : "";
                        tr = (isWall(grid.dr(p))) ? "oltts" : "";
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottls";
                        br = (isWall(grid.dr(p))) ? "oltt" : "ortte";
                    }
                    break;
                case 14: // top|down|left
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? (isWall(grid.ul(p))) ? "m" : "ltt" : "btli";
                        tr = (isWall(grid.dr(p))) ? "ttri" : "r";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = (isWall(grid.dr(p))) ? "ttre": "r";
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        tl = (isWall(grid.dl(p))) ? "ottre" : (isWall(grid.ul(p))) ? "ortb" : "";
                        //tl = (isWall(grid.ul(p))) ? "ortb" : "";
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottls";
                        br = (isWall(grid.dr(p))) ? "ot" : "ortte";
                    }
                    break;
                case 15: // top|down|left|right
                    if (isWall(v)) { // wall
                        tl = (isWall(grid.dl(p))) ? (isWall(grid.ul(p))) ? "m" : "ltt" : "btli";
                        tr = (isWall(grid.dr(p))) ? (isWall(grid.ur(p))) ? "m" : "ttr" : "rtbi";
                        bl = (isWall(grid.dl(p))) ? "m" : "btl"
                        br = (isWall(grid.dr(p))) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        // FIXME: conflict between oltts and obtl
                        tl = (isWall(grid.dl(p))) ? "ottre" : (isWall(grid.ul(p))) ? "ortb" : "";
                        tr = (isWall(grid.dr(p))) ? "oltts" : (isWall(grid.ur(p))) ? "obtl" : "";
                        bl = (isWall(grid.dl(p))) ? "ottr" : "ottls";
                        br = (isWall(grid.dr(p))) ? "oltt" : "ortte";
                    }
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set_at(tile_id(lvl, layer, tl), i*2, j*2);
            if (tr) overlay.set_at(tile_id(lvl, layer, tr), i*2+1, j*2);
            if (bl) overlay.set_at(tile_id(lvl, layer, bl), i*2, j*2+1);
            if (br) overlay.set_at(tile_id(lvl, layer, br), i*2+1, j*2+1);
        }
    }
}

// Display tiles.
class TileGridView {
    enable_grid_lines = true;
    enable_overlay = true;

    constructor(position, size, ground_tile_grid, surface_tile_grid){
        console.assert(position instanceof Vector2);
        console.assert(size instanceof Vector2 && size.x > 2 && size.y > 2);
        this.position = position;
        this.size = size;

        // translate given grids to display grids
        let bg_grid = new concepts.Grid(size.x*2, size.y*2);
        let fg_grid = new concepts.Grid(size.x*2, size.y*2);
        // handle transitions from ground<->floor
        genFloorOverlay("lvl1", "bg", ground_tile_grid, bg_grid, tiledefs.ID.GROUND, tiledefs.ID.WALL);
        // handle transitions from ground<->void
        //genFloorOverlay("lvl1", "bg", surface_tile_grid, bg_grid);
        // handle surface transitions
        genFgOverlay("lvl1", "fg", surface_tile_grid, fg_grid);
        // filter out all wall/ground tiles from fg
        let midData = new Array(size.x * size.y);
        for (let i=0; i<midData.length; i++) {
            if (surface_tile_grid.elements[i] == tiledefs.ID.WALL) continue;
            if (surface_tile_grid.elements[i] == tiledefs.ID.GROUND) continue;
            midData[i] = surface_tile_grid.elements[i];
        }

        let dsize = new Vector2({x: size.x*2, y: size.y*2});
        // TODO: replace this by just tiles we use, not all tiles in the world
        // FIXME: for now, enable_overlay is the switch between the old tile display and the new tile display
        if (this.enable_overlay) {
            this.ground_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, bg_grid.elements);
            this.mid_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, midData);
            this.surface_tile_grid = new graphics.TileGrid(position, dsize, PIXELS_PER_HALF_SIDE, tiledefs.sprite_defs, fg_grid.elements);
        } else {
            this.ground_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, ground_tile_grid.elements);
            this.surface_tile_grid = new graphics.TileGrid(position, size, PIXELS_PER_TILES_SIDE, tiledefs.sprite_defs, surface_tile_grid.elements);
        }
        this.ground_tile_grid.enable_draw_background = true; // display the background
    }

    get width() { return this.size.x; }
    get height() { return this.size.y; }

    update(delta_time){
        this.ground_tile_grid.update(delta_time);
        if (this.enable_overlay) {
            this.mid_tile_grid.update(delta_time);
        }
        this.surface_tile_grid.update(delta_time);
    }

    draw(){
        this.ground_tile_grid.draw();
        if(this.enable_grid_lines)
            graphics.draw_grid_lines(this.size.x, this.size.y, PIXELS_PER_TILES_SIDE, this.position);
        if (this.enable_overlay) {
            this.mid_tile_grid.draw();
        }
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



