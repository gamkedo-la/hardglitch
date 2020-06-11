// This file contains the code that knows how to represent the things in the game.
// We basically translate what's happening in the game's state to visual and audio
// stuffs here.
// We interpret events to animate the view of the world.
// The code here is just the skeleton to build over the actual representation.

export { genBgOverlay, genFloorOverlay, genFgOverlay };

import { tile_id } from "./game-assets.js";

import { Vector2 } from "./system/spatial.js";
import * as tiledefs from "./definitions-tiles.js";

function isWall(v) {
    return (v == tiledefs.ID.WALL) ? 1 : 0;
}

const RIGHT = 1;
const UP = 2;
const LEFT = 4;
const DOWN = 8;
const UR = 16;
const UL = 32;
const DL = 64;
const DR = 128;

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genBgOverlay(lvl, layer, grid, overlay, baseCmp, otherCmp) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            // skip tile if not matching base...
            if (!baseCmp(v)) continue;
            // compute neighbors
            let p = {x:i, y:j};
            let otherMask = ((otherCmp(grid.right(p))) ? RIGHT : 0) + 
                            ((otherCmp(grid.up(p))) ? UP : 0) + 
                            ((otherCmp(grid.left(p))) ? LEFT : 0) + 
                            ((otherCmp(grid.down(p))) ? DOWN : 0) +
                            ((otherCmp(grid.ur(p))) ? UR : 0) +
                            ((otherCmp(grid.ul(p))) ? UL : 0) +
                            ((otherCmp(grid.dl(p))) ? DL : 0) +
                            ((otherCmp(grid.dr(p))) ? DR : 0);
            let baseMask =  ((baseCmp(grid.right(p))) ? RIGHT : 0) + 
                            ((baseCmp(grid.up(p))) ? UP : 0) + 
                            ((baseCmp(grid.left(p))) ? LEFT : 0) + 
                            ((baseCmp(grid.down(p))) ? DOWN : 0) +
                            ((baseCmp(grid.ur(p))) ? UR : 0) +
                            ((baseCmp(grid.ul(p))) ? UL : 0) +
                            ((baseCmp(grid.dl(p))) ? DL : 0) +
                            ((baseCmp(grid.dr(p))) ? DR : 0);
            //console.log("i: " + i + " j: " + j + " otherMask: " + otherMask + " baseMask: " + baseMask);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            switch (baseMask & 15) {
                case 0: // none
                    //console.log("matching none for " + p.x + "," + p.y);
                    if (otherMask & (UP|LEFT)) tl = (baseMask & UL) ? "ortbc" : "ttl";
                    if (otherMask & (UP|RIGHT)) tr = (baseMask & UR) ? "obtlc" : "rtt";
                    if (otherMask & (DOWN|LEFT)) bl = (baseMask & DL) ? "ottrc" : "ltb";
                    if (otherMask & (DOWN|RIGHT)) br = (baseMask & DR) ? "olttc" : "btr";
                    break;
                case 1: // right
                    //console.log("matching right for " + p.x + "," + p.y);
                    if (otherMask & (UP|LEFT)) tl = (baseMask & UL) ? "ortbc" : "ttl";
                    if (otherMask & (UP)) tr = (baseMask & UR) ? "ltte" : "t";
                    if (otherMask & (DOWN|LEFT)) bl = (baseMask & DL) ? "ottrc" : "ltb";
                    if (otherMask & (DOWN)) br = (baseMask & DR) ? "btls" : "b";
                    //br = (isWall(grid.dr(p))) ? "btls": "ltbe";
                    break;
                case 2: // top
                    //console.log("matching top for " + p.x + "," + p.y);
                    if (otherMask & (LEFT)) tl = (baseMask & UL) ? "btle": "l";
                    if (otherMask & (RIGHT)) tr = (baseMask & UR) ? "rtbs": "r";
                    if (otherMask & (DOWN|LEFT)) bl = (baseMask & DL) ? "ottrc" : "ltb";
                    if (otherMask & (DOWN|RIGHT)) br = (baseMask & DR) ? "olttc" : "btr";
                    break;
                case 3: // top|right
                    //console.log("matching top|right for " + p.x + "," + p.y);
                    if (otherMask & (LEFT)) tl = (baseMask & UL) ? "btle": "l";
                    tr = (baseMask & UR) ? "m" : "ttr";
                    if (otherMask & (DOWN|LEFT)) bl = (baseMask & DL) ? "ottrc" : "ltb";
                    if (otherMask & (DOWN)) br = (baseMask & DR) ? "btls" : "b";
                    break;
                case 4: // left
                    //console.log("matching left for " + p.x + "," + p.y);
                    if (otherMask & (UP)) tl = (baseMask & UL) ? "ttrs" : "t";
                    if (otherMask & (UP|RIGHT)) tr = (baseMask & UR) ? "obtlc" : "rtt";
                    if (otherMask & (DOWN)) bl = (baseMask & DL) ? "rtbe": "b";
                    if (otherMask & (DOWN|RIGHT)) br = (baseMask & DR) ? "olttc" : "btr";
                    break;
                case 5: // left|right
                    if (otherMask & (UP)) tl = (baseMask & UL) ? "ttrs" : "t";
                    if (otherMask & (UP)) tr = (baseMask & UR) ? "ltte" : "t";
                    if (otherMask & (DOWN)) bl = (baseMask & DL) ? "rtbe": "b";
                    if (otherMask & (DOWN)) br = (baseMask & DR) ? "btls" : "b";
                    break;
                case 6: // top|left
                    tl = (baseMask & UL) ? "m" : "ltt";
                    if (otherMask & (RIGHT)) tr = (baseMask & UR) ? "rtbs": "r";
                    if (otherMask & (DOWN)) bl = (baseMask & DL) ? "rtbe": "b";
                    if (otherMask & (DOWN|RIGHT)) br = (baseMask & DR) ? "olttc" : "btr";
                    break;
                case 7: // top|left|right
                    tl = (baseMask & UL) ? "m" : "ltt";
                    tr = (baseMask & UR) ? "m" : "ttr"
                    if (otherMask & (DOWN)) bl = (baseMask & DL) ? "rtbe": "b";
                    if (otherMask & (DOWN)) br = (baseMask & DR) ? "btls" : "b";
                    break;
                case 8: // down
                    if (otherMask & (UP|LEFT)) tl = (baseMask & UL) ? "ortbc" : "ttl";
                    if (otherMask & (UP|RIGHT)) tr = (baseMask & UR) ? "obtlc" : "rtt";
                    if (otherMask & (LEFT)) bl = (baseMask & DL) ? "ltts" : "l";
                    if (otherMask & (RIGHT)) br = (baseMask & DR) ? "ttre" : "r";
                    break;
                case 9: // down|right
                    if (otherMask & (UP|LEFT)) tl = (baseMask & UL) ? "ortbc" : "ttl";
                    if (otherMask & (UP)) tr = (baseMask & UR) ? "ltte" : "t";
                    if (otherMask & (LEFT)) bl = (baseMask & DL) ? "ltts" : "l";
                    br = (baseMask & DR) ? "m" : "rtb";
                    break;
                case 10: // top|down
                    if (otherMask & (LEFT)) tl = (baseMask & UL) ? "btle": "l";
                    if (otherMask & (RIGHT)) tr = (baseMask & UR) ? "rtbs": "r";
                    if (otherMask & (LEFT)) bl = (baseMask & DL) ? "ltts" : "l";
                    if (otherMask & (RIGHT)) br = (baseMask & DR) ? "ttre" : "r";
                    break;
                case 11: // top|down|right
                    if (otherMask & (LEFT)) tl = (baseMask & UL) ? "btle": "l";
                    tr = (baseMask & UR) ? "m" : "ttr"
                    if (otherMask & (LEFT)) bl = (baseMask & DL) ? "ltts" : "l";
                    br = (baseMask & DR) ? "m" : "rtb"
                    break;
                case 12: // down|left
                    if (otherMask & (UP)) tl = (baseMask & UL) ? "ttrs" : "t";
                    if (otherMask & (UP|RIGHT)) tr = (baseMask & UR) ? "obtlc" : "rtt";
                    bl = (baseMask & DL) ? "m" : "btl"
                    if (otherMask & (RIGHT)) br = (baseMask & DR) ? "ttre" : "r";
                    break;
                case 13: // down|left|right
                    if (otherMask & (UP)) tl = (baseMask & UL) ? "ttrs" : "t";
                    if (otherMask & (UP)) tr = (baseMask & UR) ? "ltte" : "t";
                    bl = (baseMask & DL) ? "m" : "btl"
                    br = (baseMask & DR) ? "m" : "rtb"
                    break;
                case 14: // top|down|left
                    tl = (baseMask & UL) ? "m" : "ltt";
                    if (otherMask & (RIGHT)) tr = (baseMask & UR) ? "rtbs": "r";
                    bl = (baseMask & DL) ? "m" : "btl"
                    if (otherMask & (RIGHT)) br = (baseMask & DR) ? "ttre" : "r";
                    break;
                case 15: // top|down|left|right
                    tl = (baseMask & UL) ? "m" : "ltt";
                    tr = (baseMask & UR) ? "m" : "ttr"
                    bl = (baseMask & DL) ? "m" : "btl"
                    br = (baseMask & DR) ? "m" : "rtb"
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