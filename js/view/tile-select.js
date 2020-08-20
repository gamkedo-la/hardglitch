// This file contains the code that knows how to select tiles sprites
// depending on a grid of tiles.

export { initialize, shape_defs, SeamSelector, genFloorOverlay, genFgOverlay, genSeamOverlay, tile_id, parse_tile_id, shape_map };
import { PIXELS_PER_HALF_SIDE } from "./entity-view.js";
import * as tiledefs from "../definitions-tiles.js";

const RIGHT = 1;
const UP = 2;
const LEFT = 4;
const DOWN = 8;
const UR = 16;
const UL = 32;
const DL = 64;
const DR = 128;


const shape_defs = {}

function initialize(tiledefs) {
    // iterate through tile definitions, looking for tiles with shape template specified
    for (const [id, def] of Object.entries(tiledefs)) {
    //for (const def of Object.values(tiledefs)) {
        if (def.shape_template) {
            // FIXME: level definitions
            update_sprite_defs(def.shape_template, id, PIXELS_PER_HALF_SIDE);
            // FIXME: re-eval subtile animations
            // update_anim_defs("void_template", "void", 32, 512, 8, 100);
        }
    }
}


function same(...values) {
    let same = true;
    for (let i=1; same && i<arguments.length; i++) {
        if (values[i] != values[0]) same = false;
    }
    return same;
}

function sameTiles(...values) {
    let match = true;
    let samePred = (values[0]) ? tiledefs.defs[values[0]].tile_same_predicate : undefined;
    if (!samePred) return same(...values);
    for (let i=1; match && i<arguments.length; i++) {
        if (!samePred(values[i])) match = false;
    }
    return match;
}

class SeamSelector {
    constructor(name, matchPred, samePred) {
        this.name = name;
        this.matchPred = matchPred;
        this.samePred = samePred;
    }

    match(base, ...others) {
        if (!this.matchPred(base)) return 0;
        let score = 1;
        for (const other of others) {
            if (this.matchPred(other) || this.samePred(other)) score++;
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

function pickMode(...values) {
    if (values.length == 0) return undefined;
    let counts = {};
    let mode = undefined;
    for (let i=0; i<values.length; i++) {
        let value = values[i];
        if (value === undefined) continue;
        if (counts[value] === undefined) {
            counts[value] = 1;
        } else {
            counts[value]++;
        }
        if (mode === undefined || counts[value] > counts[mode]) {
            mode = value;
        }
    }
    return mode;
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

function genSeamOverlay(grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let id = parse_tile_id(grid.get_at(i,j));
            if (!id) continue;
            let p = {x:i, y:j};
            let cornerLayer;
            let neighbors;
            let cid;
            switch (id.name) {
                case "ttl":
                    neighbors = [ parse_tile_id(grid.ul(p)).layer, parse_tile_id(grid.up(p)).layer, parse_tile_id(grid.left(p)).layer ];
                    cid = "ortb";
                    break;
                case "ltb":
                    neighbors = [ parse_tile_id(grid.dl(p)).layer, parse_tile_id(grid.left(p)).layer, parse_tile_id(grid.down(p)).layer ];
                    cid = "ottr";
                    break;
                case "btr":
                    neighbors = [ parse_tile_id(grid.dr(p)).layer, parse_tile_id(grid.down(p)).layer, parse_tile_id(grid.right(p)).layer ];
                    cid = "oltt";
                    break;
                case "rtt":
                    neighbors = [ parse_tile_id(grid.ur(p)).layer, parse_tile_id(grid.right(p)).layer, parse_tile_id(grid.up(p)).layer ];
                    cid = "obtl";
                    break;
            }
            if (!neighbors) continue;
            if (sameTiles(...neighbors)) {
                cornerLayer = neighbors[0];
            } else {
                cornerLayer = tiledefs.ID.GROUND;
            }
            if (!cornerLayer) continue;
            overlay.set_at(tile_id(cornerLayer, cid), i, j);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 * @param {*} selectors - list of Selector instances used to define comparision functions for tile seams
 */
function genFloorOverlay(grid, overlay, selectors) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get_at(i,j);
            let p = {x:i, y:j};
            // consider top-left
            // - possible tiles are: ttl, t, rtte, l, ltbs, m, btle, ttrs, ltt, btri, rtbi, bi, rtbei, btli
            // FIXME: not currently assigning btri, rtbi, bi, rtbei, btli
            // pick best selector based on bordering tiles
            let selector = pickSelector(selectors, v);
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            let baseMask = getMask(grid, p, selector.samePred);
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
                    tl = "ttl";
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
            if (tl) overlay.set_at(tile_id(layer, tl), i*2, j*2);
            // consider top-right
            // - possible tiles are: rtt, t, ttls, r, btre, m, rtbs, ltte, ttr, ltbi, btli, bi, btlsi, rtbi
            // FIXME: not currently assigning ltbi, btli, bi, btlsi, rtbi
            // pick best selector based on bordering tiles
            selector = pickSelector(selectors, v, grid.up(p), grid.ur(p), grid.right(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            baseMask = getMask(grid, p, selector.samePred);
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
                    tr = "rtt";
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
            if (tr) overlay.set_at(tile_id(layer, tr), i*2+1, j*2);
            // consider bottom-left
            // - possible tiles are: ltb, b, btrs, l, ttle, m, ltts, rtbe, btl
            // pick best selector based on bordering tiles
            selector = pickSelector(selectors, v, grid.down(p), grid.dl(p), grid.left(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            baseMask = getMask(grid, p, selector.samePred);
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
                    bl = "ltb";
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
            if (bl) overlay.set_at(tile_id(layer, bl), i*2, j*2+1);
            // consider bottom-right
            // - possible tiles are: btr, b, ltbe, r, rtts, m, ttre, btls, rtb
            // pick best selector based on bordering tiles
            selector = pickSelector(selectors, v, grid.down(p), grid.dr(p), grid.right(p));
            if (!selector) continue;
            // compute base mask of surrounding tiles based on selector
            baseMask = getMask(grid, p, selector.samePred);
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
                    br = "btr";
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
            if (br) overlay.set_at(tile_id(layer, br), i*2+1, j*2+1);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genFgOverlay(layer, grid, overlay, wallCmp) {
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
            if (tl) overlay.set_at(tile_id(layer, tl), i*2, j*2);
            if (tr) overlay.set_at(tile_id(layer, tr), i*2+1, j*2);
            if (bl) overlay.set_at(tile_id(layer, bl), i*2, j*2+1);
            if (br) overlay.set_at(tile_id(layer, br), i*2+1, j*2+1);
        }
    }
}


//////////////////////////////////////////////////////////////////////////////////////
// Tile template images are used to render the background/foreground tiles for the game.  Each image represents all the possible combinations
// of tiles for a specific view based on foreground/background and level.  This allows different tiles for different levels, but they all use the
// same template.
// The shape_map below defines all of the different tile combinations and the positions of each tile within the template image.  Indices are
// given in a grid index format {i,j}, representing the row/column of each tile within the image.  Multiply by the tilesize to get pixel coordinates.
const shape_map = {
    t:      {i:7,   j:1},
    ot:     {i:7,   j:0},
    m:      {i:7,   j:2},
    om:     {i:3,   j:3},
    ttls:   {i:6,   j:1},
    ttl:    {i:5,   j:1},
    ttlc:   {i:7,   j:3},
    ttle:   {i:5,   j:2},
    ottls:  {i:5,   j:0},
    ottl:   {i:5,   j:0},
    ottle:  {i:4,   j:1},
    l:      {i:1,   j:7},
    ol:     {i:0,   j:7},
    ltts:   {i:5,   j:4},
    ltt:    {i:5,   j:5},
    ltte:   {i:4,   j:5},
    ltti:   {i:5,   j:3},
    oltts:  {i:4,   j:3},
    oltt:   {i:4,   j:4},
    oltte:  {i:3,   j:4},
    olttc:  {i:1,   j:1},
    ltbs:   {i:1,   j:9},
    ltbsc:  {i:1,   j:13},
    ltb:    {i:1,   j:10},
    ltbc:   {i:7,   j:4},
    ltbe:   {i:2,   j:10},
    ltbi:   {i:2,   j:9},
    oltbs:  {i:0,   j:10},
    oltb:   {i:0,   j:11},
    oltbe:  {i:1,   j:11},
    b:      {i:3,   j:10},
    ob:     {i:2,   j:11},
    bi:     {i:3,   j:9},
    btls:   {i:4,   j:10},
    btlsi:  {i:4,   j:9},
    btl:    {i:5,   j:10},
    btle:   {i:5,   j:11},
    btli:   {i:5,   j:9},
    obtls:  {i:3,   j:11},
    obtl:   {i:4,   j:11},
    obtle:  {i:4,   j:12},
    obtlc:  {i:1,   j:2},
    btrs:   {i:9,   j:14},
    btr:    {i:10,  j:14},
    btrc:   {i:8,   j:4},
    btre:   {i:10,  j:13},
    btrec:  {i:2,   j:13},
    btri:   {i:9,   j:13},
    obtrs:  {i:10,  j:15},
    obtr:   {i:11,  j:15},
    obtre:  {i:11,  j:14},
    r:      {i:10,  j:12},
    or:     {i:15,  j:6},
    rtbs:   {i:10,  j:11},
    rtb:    {i:10,  j:10},
    rtbei:  {i:11,  j:9},
    rtbe:   {i:11,  j:10},
    rtbi:   {i:10,  j:9},
    ortbs:  {i:11,  j:12},
    ortb:   {i:11,  j:11},
    ortbe:  {i:12,  j:11},
    ortbc:  {i:2,   j:2},
    rtts:   {i:10,  j:2},
    rtt:    {i:10,  j:1},
    rttc:   {i:8,   j:3},
    rtte:   {i:9,   j:1},
    ortts:  {i:11,  j:1},
    ortt:   {i:10,  j:0},
    ortte:  {i:10,  j:0},
    ttrs:   {i:11,  j:5},
    ttr:    {i:10,  j:5},
    ttre:   {i:10,  j:4},
    ttri:   {i:10,  j:3},
    ottrs:  {i:12,  j:4},
    ottr:   {i:11,  j:4},
    ottre:  {i:11,  j:3},
    ottrc:  {i:2,   j:1},
};

/**
 * return the full tile id given level, layer and tile name
 * @param {*} layer
 * @param {*} name
 */
function tile_id(layer, name) {
    return layer + "_" + name;
}

function parse_tile_id(id) {
    if (!id) return {};
    let fields = id.split("_", 2);
    if (!fields || fields.length != 2) return {};
    return {layer: fields[0], name: fields[1]};
}

function update_sprite_defs(imgname, layer, tilesize) {
    for (const k of Object.keys(shape_map)) {
        let p = shape_map[k];
        let def = {
            image: imgname,
            frames: [
                {
                    x: p.i*tilesize,
                    y: p.j*tilesize,
                    width: tilesize,
                    height: tilesize
                },
            ],
        };
        let id = tile_id(layer, k);
        shape_defs[id] = def;
    }
}

/**
 * split up a sprite sheet representing animated tiles
 * @param {*} imgname - template tilesheet reference
 * @param {*} layer - layer associated w/ tilesheet
 * @param {*} tilesize - base size of a single tile
 * @param {*} templatesize - base size of the template
 * @param {*} frames - number of frames
 * @param {*} duration - duration to apply for each frame
 */
function update_anim_defs(imgname, layer, tilesize, templatesize, frames, duration) {
    // build animation
    const anim = {
        idle: {
            loop: true,
            timeline: []
        },
    }
    for (let i=0; i<frames; i++) {
        anim.idle.timeline.push( { frame: i, duration: duration } );
    }

    // for each possible tile definition from template, build out asset
    for (const [k, p] of Object.entries(shape_map)) {
        let def = {
            image: imgname,
            frames: [],
            animations: anim,
        }
        for (let i=0; i<frames; i++) {
            def.frames.push({
                x: p.i*tilesize + i*templatesize,
                y: p.j*tilesize,
                width: tilesize,
                height: tilesize
            });
        }
        let id = tile_id(layer, k);
        shape_defs[id] = def;
    }
}