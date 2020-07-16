// This file contains the code that knows how to select tiles sprites
// depending on a grid of tiles.

export { SeamSelector, genFloorOverlay, genFgOverlay };

import { tile_id } from "../game-assets.js";
import * as tiledefs from "../definitions-tiles.js";

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

function same() {
    let a = Array.from(arguments);
    let same = true;
    for (let i=0; same && i<arguments.length; i++) {
        if (i>0 && arguments[i] != arguments[0]) same = false;
    }
    return same;
}

class SeamSelector {
    constructor(name, baseCmp, otherCmp) {
        this.name = name;
        this.baseCmp = baseCmp;
        this.otherCmp = otherCmp;
    }

    match(base, ...others) {
        if (!this.baseCmp(base)) return 0;
        let score = 1;
        for (const other of others) {
            if (this.baseCmp(other) || this.otherCmp(other)) score++;
        }
        return score;
    }

    toString() {
        return this.name;
    }
}

function pickSelector(selectors, base, ...others) {
    let best;
    let bestScore = 0;
    for (const selector of selectors) {
        let score = selector.match(base, ...others);
        if (score > bestScore) {
            best = selector;
            bestScore = score;
        }
    }
    return best;
}

function getMask(grid, p, fcn) {
    let m = ((fcn(grid.right(p))) ? RIGHT : 0) +
            ((fcn(grid.up(p))) ? UP : 0) +
            ((fcn(grid.left(p))) ? LEFT : 0) +
            ((fcn(grid.down(p))) ? DOWN : 0) +
            ((fcn(grid.ur(p))) ? UR : 0) +
            ((fcn(grid.ul(p))) ? UL : 0) +
            ((fcn(grid.dl(p))) ? DL : 0) +
            ((fcn(grid.dr(p))) ? DR : 0);
    return m;
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} lvl - level associated w/ selection
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 * @param {*} selectors - list of Selector instances used to define comparision functions for tile seams
 */
function genFloorOverlay(lvl, grid, overlay, selectors) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            let p = {x:i, y:j};
            // consider top-left
            // - possible tiles are: ttl, t, rtte, l, ltbs, m, btle, ttrs, btrc, ltt, btri, rtbi, bi, rtbei, btli
            // FIXME: not currently assigning btri, rtbi, bi, rtbei, btli
            // pick best selector based on bordering tiles
            let selector = pickSelector(selectors, v, grid.up(p), grid.ul(p), grid.left(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            let baseMask = getMask(grid, p, selector.baseCmp);
            let tl = "";
            switch (baseMask & (LEFT|UL|UP)) {
                case 0:
                    tl = "ttl";
                    break;
                case LEFT:
                    tl = (baseMask & RIGHT) ? "t" : "rtte";
                    break;
                case UP:
                    tl = (baseMask & DOWN) ? "l" : "ltbs";
                    break;
                case UL:
                    tl = "btrc";
                    break;
                case UP|UL:
                    tl = "btle";
                    break;
                case UP|LEFT:
                    tl = "ltt";
                    break;
                case LEFT|UL:
                    tl = "ttrs";
                    break;
                case LEFT|UL|UP:
                    tl = "m";
                    break;
            }
            let layer = selector.name;
            if (tl) overlay.set_at(tile_id(lvl, layer, tl), i*2, j*2);
            // consider top-right
            // - possible tiles are: rtt, t, ttls, r, btre, m, rtbs, ltte, ltbc, ttr, ltbi, btli, bi, btlsi, rtbi
            // FIXME: not currently assigning ltbi, btli, bi, btlsi, rtbi
            // pick best selector based on bordering tiles
            selector = pickSelector(selectors, v, grid.up(p), grid.ur(p), grid.right(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            baseMask = getMask(grid, p, selector.baseCmp);
            //if (v == 2) console.log("ur: " + i + "," + j + ": " + selector + " mask: " + baseMask);
            let tr = "";
            switch (baseMask & (RIGHT|UR|UP)) {
                case 0:
                    tr = "rtt";
                    break;
                case RIGHT:
                    tr = (baseMask & LEFT) ? "t" : "ttls";
                    break;
                case UP:
                    tr = (baseMask & DOWN) ? "r" : "btre";
                    break;
                case UR:
                    tr = "ltbc";
                    break;
                case UP|UR:
                    tr = "rtbs";
                    break;
                case UP|RIGHT:
                    tr = "ttr";
                    break;
                case RIGHT|UR:
                    tr = "ltte";
                    break;
                case RIGHT|UR|UP:
                    tr = "m";
                    break;
            }
            layer = selector.name;
            if (tr) overlay.set_at(tile_id(lvl, layer, tr), i*2+1, j*2);
            // consider bottom-left
            // - possible tiles are: ltb, b, btrs, l, ttle, m, ltts, rtbe, rttc, btl
            // pick best selector based on bordering tiles
            selector = pickSelector(selectors, v, grid.down(p), grid.dl(p), grid.left(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            baseMask = getMask(grid, p, selector.baseCmp);
            //if (v == 2) console.log("dl: " + i + "," + j + ": " + selector + " mask: " + baseMask);
            let bl = "";
            switch (baseMask & (LEFT|DL|DOWN)) {
                case 0:
                    bl = "ltb";
                    break;
                case LEFT:
                    bl = (baseMask & RIGHT) ? "b" : "btrs";
                    break;
                case DOWN:
                    bl = (baseMask & UP) ? "l" : "ttle";
                    break;
                case DL:
                    bl = "rttc";
                    break;
                case DOWN|DL:
                    bl = "ltts";
                    break;
                case DOWN|LEFT:
                    bl = "btl";
                    break;
                case LEFT|DL:
                    bl = "rtbe";
                    break;
                case LEFT|DL|DOWN:
                    bl = "m";
                    break;
            }
            layer = selector.name;
            if (bl) overlay.set_at(tile_id(lvl, layer, bl), i*2, j*2+1);
            // consider bottom-right
            // - possible tiles are: btr, b, ltbe, r, rtts, m, ttre, btls, ttlc, rtb
            // - possible tiles are: rtt, t, ttls, r, btre, m, rtbs, ltte, ltbc, ttr
            // pick best selector based on bordering tiles
            selector = pickSelector(selectors, v, grid.down(p), grid.dr(p), grid.right(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            baseMask = getMask(grid, p, selector.baseCmp);
            //if (v == 2) console.log("dr: " + i + "," + j + ": " + selector + " mask: " + baseMask);
            let br = "";
            switch (baseMask & (RIGHT|DR|DOWN)) {
                case 0:
                    br = "btr";
                    break;
                case RIGHT:
                    br = (baseMask & LEFT) ? "b" : "ltbe";
                    break;
                case DOWN:
                    br = (baseMask & UP) ? "r" : "rtts";
                    break;
                case DR:
                    br = "ttlc";
                    break;
                case DOWN|DR:
                    br = "ttre";
                    break;
                case DOWN|RIGHT:
                    br = "rtb";
                    break;
                case RIGHT|DR:
                    br = "btls";
                    break;
                case RIGHT|DR|DOWN:
                    br = "m";
                    break;
            }
            layer = selector.name;
            if (br) overlay.set_at(tile_id(lvl, layer, br), i*2+1, j*2+1);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genFgOverlay(lvl, layer, grid, overlay, wallCmp) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            // compute neighbors
            let p = {x:i, y:j};
            let neighbors = wallCmp(grid.right(p)) + (wallCmp(grid.up(p)) << 1) + (wallCmp(grid.left(p)) << 2) + (wallCmp(grid.down(p))<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            switch (neighbors) {
                case 0: // none
                    if (wallCmp(v)) { // wall
                        tl = "ltbsc";
                        tr = "btrec";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 1: // right
                    if (wallCmp(v)) { // wall
                        tl = "ltbs";
                        tr = (wallCmp(grid.dr(p))) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (wallCmp(grid.dr(p))) ? "btls": "ltbe";
                    }
                    break;
                case 2: // top
                    if (wallCmp(v)) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 3: // top|right
                    if (wallCmp(v)) { // wall
                        tl = "ltbs";
                        tr = (wallCmp(grid.dr(p))) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (wallCmp(grid.dr(p))) ? "btls": "ltbe";
                    } else { // empty
                        tr = (wallCmp(grid.ur(p))) ? "obtl" : "";
                    }
                    break;
                case 4: // left
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = "btrs";
                        bl = (wallCmp(grid.dl(p))) ? "rtbe": "btrs";
                        br = "btr";
                    }
                    break;
                case 5: // left|right
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "rtbei" : "bi";
                        tr = (wallCmp(grid.dr(p))) ? "btlsi" : "bi";
                        bl = (wallCmp(grid.dl(p))) ? "rtbe": "b";
                        br = (wallCmp(grid.dr(p))) ? "btls": "b";
                    }
                    break;
                case 6: // top|left
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = (wallCmp(grid.dl(p))) ? "rtbe": "btrs";
                        br = "btr";
                    } else { // empty
                        tl = (wallCmp(grid.ul(p))) ? "ortb" : "";
                    }
                    break;
                case 7: // top|left|right
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "rtbei" : "bi";
                        tr = (wallCmp(grid.dl(p))) ? "btlsi" : "bi";
                        bl = (wallCmp(grid.dl(p))) ? "rtbe": "b";
                        br = (wallCmp(grid.dr(p))) ? "btls": "b";
                    } else { // empty
                        tl = (wallCmp(grid.ul(p))) ? "ortb" : "";
                        tr = (wallCmp(grid.ur(p))) ? "obtl" : "";
                    }
                    break;
                case 8: // down
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "ltti" : "ttl";
                        tr = (wallCmp(grid.dr(p))) ? "ttri" : "rtt";
                        bl = (wallCmp(grid.dl(p))) ? "ltts" : "ttle";
                        br = (wallCmp(grid.dr(p))) ? "ttre": "rtts";
                    } else { // empty
                        bl = (wallCmp(grid.dl(p))) ? "ot" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "ot" : "ortt";
                    }
                    break;
                case 9: // down|right
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "ltti" : "ttl";
                        tr = (wallCmp(grid.dr(p))) ? "ttls" : "rtbi";
                        bl = (wallCmp(grid.dl(p))) ? "ltts" : "ttle";
                        br = (wallCmp(grid.dr(p))) ? "m" : "rtb";
                    } else { // empty
                        tr = (wallCmp(grid.dr(p))) ? "oltts" : "";
                        bl = (wallCmp(grid.dl(p))) ? "ot" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "oltt" : "ortt";
                    }
                    break;
                case 10: // top|down
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "ltti" : "l";
                        tr = (wallCmp(grid.dr(p))) ? "ttri" : "r";
                        bl = (wallCmp(grid.dl(p))) ? "ltts": "l";
                        br = (wallCmp(grid.dr(p))) ? "ttre": "r";
                    } else {
                        bl = (wallCmp(grid.dl(p))) ? "ot" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "ot" : "ortt";
                    }
                    break;
                case 11: // top|down|right
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "ltti" : "l";
                        tr = (wallCmp(grid.dr(p))) ? (wallCmp(grid.ur(p))) ? "m" : "ttr" : "rtbi";
                        bl = (wallCmp(grid.dl(p))) ? "ltts": "l";
                        br = (wallCmp(grid.dr(p))) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between oltts and obtl
                        tr = (wallCmp(grid.dr(p))) ? "oltts" : (wallCmp(grid.ur(p))) ? "obtl" : "";
                        br = (wallCmp(grid.dr(p))) ? "oltt" : "ortt";
                        bl = (wallCmp(grid.dl(p))) ? "ot" : "ottl";
                    }
                    break;
                case 12: // down|left
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "rtte" : "btli";
                        tr = (wallCmp(grid.dr(p))) ? "ttri" : "rtt";
                        bl = (wallCmp(grid.dl(p))) ? "m" : "btl"
                        br = (wallCmp(grid.dr(p))) ? "ttre": "rtts";
                    } else { // empty
                        tl = (wallCmp(grid.dl(p))) ? "ottre" : "";
                        bl = (wallCmp(grid.dl(p))) ? "ottr" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "ot" : "ortt";
                    }
                    break;
                case 13: // down|left|right
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? "t" : "btli";
                        tr = (wallCmp(grid.dr(p))) ? "t" : "rtbi";
                        bl = (wallCmp(grid.dl(p))) ? "m" : "btl"
                        br = (wallCmp(grid.dr(p))) ? "m" : "rtb"
                    } else { // empty
                        tl = (wallCmp(grid.dl(p))) ? "ottre" : "";
                        tr = (wallCmp(grid.dr(p))) ? "oltts" : "";
                        bl = (wallCmp(grid.dl(p))) ? "ottr" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "oltt" : "ortt";
                    }
                    break;
                case 14: // top|down|left
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? (wallCmp(grid.ul(p))) ? "m" : "ltt" : "btli";
                        tr = (wallCmp(grid.dr(p))) ? "ttri" : "r";
                        bl = (wallCmp(grid.dl(p))) ? "m" : "btl"
                        br = (wallCmp(grid.dr(p))) ? "ttre": "r";
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        tl = (wallCmp(grid.dl(p))) ? "ottre" : (wallCmp(grid.ul(p))) ? "ortb" : "";
                        //tl = (wallCmp(grid.ul(p))) ? "ortb" : "";
                        bl = (wallCmp(grid.dl(p))) ? "ottr" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "ot" : "ortt";
                    }
                    break;
                case 15: // top|down|left|right
                    if (wallCmp(v)) { // wall
                        tl = (wallCmp(grid.dl(p))) ? (wallCmp(grid.ul(p))) ? "m" : "ltt" : "btli";
                        tr = (wallCmp(grid.dr(p))) ? (wallCmp(grid.ur(p))) ? "m" : "ttr" : "rtbi";
                        bl = (wallCmp(grid.dl(p))) ? "m" : "btl"
                        br = (wallCmp(grid.dr(p))) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        // FIXME: conflict between oltts and obtl
                        tl = (wallCmp(grid.dl(p))) ? "ottre" : (wallCmp(grid.ul(p))) ? "ortb" : "";
                        tr = (wallCmp(grid.dr(p))) ? "oltts" : (wallCmp(grid.ur(p))) ? "obtl" : "";
                        bl = (wallCmp(grid.dl(p))) ? "ottr" : "ottl";
                        br = (wallCmp(grid.dr(p))) ? "oltt" : "ortt";
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