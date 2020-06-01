// hard-coded bg tiles
const fgtw = new Image();
fgtw.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADRJREFUWIXtzjEBADAIxMCnKiqlK/5FFRksFwO5uq9/FjubcwAAAAAAAAAAAAAAAAAAgCQZQm4B0KN9/LwAAAAASUVORK5CYII=";
const fgte = new Image();
fgte.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADVJREFUWIXtzkEBADAIxLBjSuZf1gRgYcjgkxpoqt/9WexszgEAAAAAAAAAAAAAAAAAAJJkAF3RAy8pxiovAAAAAElFTkSuQmCC";

/**
 * template map defines the position of named tiles within the tileset template where each coordinate is given as a grid index {i,j}
 */
let templateMap = {
    t:      {i:7,   j:1},
    ot:     {i:7,   j:0},
    m:      {i:7,   j:2},
    om:     {i:3,   j:3},
    ttls:   {i:6,   j:1},
    ttl:    {i:5,   j:1},
    ttle:   {i:5,   j:2},
    ottls:  {i:5,   j:0},
    ottl:   {i:4,   j:0},
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
    olttc:  {i:7,   j:3},
    ltbs:   {i:1,   j:9},
    ltb:    {i:1,   j:10},
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
    obtlc:  {i:7,   j:4},
    btrs:   {i:9,   j:14},
    btr:    {i:10,  j:14},
    btre:   {i:10,  j:13},
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
    ortbc:  {i:8,   j:4},
    rtts:   {i:10,  j:2},
    rtt:    {i:10,  j:1},
    rtte:   {i:9,   j:1},
    ortts:  {i:11,  j:1},
    ortt:   {i:11,  j:0},
    ortte:  {i:10,  j:0},
    ttrs:   {i:11,  j:5},
    ttr:    {i:10,  j:5},
    ttre:   {i:10,  j:4},
    ttri:   {i:10,  j:3},
    ottrs:  {i:12,  j:4},
    ottr:   {i:11,  j:4},
    ottre:  {i:11,  j:3},
    ottrc:  {i:8,   j:3},
};

function loadTemplateSheet(sheet, map, tilesize) {
    return new Promise((resolve) => {
        let tileset = {};
        // create tilebuffer to be used to extract images from tilesheet
        let tileBuffer = document.createElement('canvas');
        tileBuffer.width = tilesize;
        tileBuffer.height = tilesize;
        let ctx = tileBuffer.getContext('2d');
        //let count = Object.keys(map).length;
        let promises = [];
        for (const k of Object.keys(map)) {
            //console.log("k: " + k);
            ctx.clearRect(0, 0, tileBuffer.width, tileBuffer.height);
            let p = map[k];
            // draw the image to the tile buffer
            ctx.drawImage(sheet, p.i*tilesize, p.j*tilesize, tilesize, tilesize, 0, 0, tilesize, tilesize);
            // create a new image element, copying data from tile buffer
            let promise = loadImage(tileBuffer.toDataURL());
            promise.then(img => tileset[k] = img);
            promises.push(promise);
        }
        // wait for all images to be loaded... then resolve tileset
        Promise.all(promises).then(() => {
            resolve(tileset);
        });
    });
}

/**
 * random generator for a grid, uses 0 for empty, 1 for wall
 * @param {*} grid - the grid to populate
 * @param {*} wallPct - percentage of walls
 */
function gen(grid, wallPct) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = (Math.random() <= wallPct) ? 1 : 0;
            grid.set(v,i,j);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genOverlay(grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get(i,j);
            // compute neighbors
            let p = {i:i, j:j};
            let neighbors = grid.right(p) + (grid.up(p) << 1) + (grid.left(p) << 2) + (grid.down(p)<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            //console.log("i: " + i + " j: " + j + " n: " + neighbors);
            switch (neighbors) {
                case 0: // none
                    if (v) {
                        tl = "ttl";
                        tr = "rtt";
                        bl = "ltb";
                        br = "btr";
                    } else {
                        tl = (grid.ul(p)) ? "obtr" : "om";
                        tr = (grid.ur(p)) ? "oltb" : "om";
                        bl = (grid.dl(p)) ? "ortt" : "om";
                        br = (grid.dr(p)) ? "ottl" : "om";
                    }
                    break;
                case 1: // right
                    if (v) {
                        tl = "ttl";
                        tr = "t";
                        bl = "ltb";
                        br = "b";
                    } else {
                        tl = (grid.ul(p)) ? "obtr" : "om";
                        tr = (grid.ur(p)) ? "ol" : "ottle";
                        bl = (grid.dl(p)) ? "ortt" : "om";
                        br = (grid.dr(p)) ? "ol" : "oltbs";
                    }
                    break;
                case 2: // top
                    if (v) {
                        tl = "l";
                        tr = "r";
                        bl = "ltb";
                        br = "btr";
                    } else {
                        tl = (grid.ul(p)) ? "ob" : "oltbe";
                        tr = (grid.ur(p)) ? "ob" : "obtrs";
                        bl = (grid.dl(p)) ? "ortt" : "om";
                        br = (grid.dr(p)) ? "ottl" : "om";
                    }
                    break;
                case 3: // top|right
                    if (v) {
                        tl = "l";
                        tr = (grid.ur(p)) ? "m" : "ttr";
                        bl = "ltb";
                        br = "b";
                    } else {
                        tl = (grid.ul(p)) ? "ob" : "oltbe";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (grid.ur(p)) ? "obtl" : "obtlc";
                        br = (grid.dr(p)) ? "ol" : "oltbs";
                        bl = (grid.dl(p)) ? "ortt" : "om";
                    }
                    break;
                case 4: // left
                    if (v) {
                        tl = "t";
                        tr = "rtt";
                        bl = "b";
                        br = "btr";
                    } else {
                        tl = (grid.ul(p)) ? "or" : "ortts";
                        tr = (grid.ur(p)) ? "oltb" : "om";
                        bl = (grid.dl(p)) ? "or" : "obtre";
                        br = (grid.dr(p)) ? "ottl" : "om";
                    }
                    break;
                case 5: // left|right
                    if (v) {
                        tl = "t";
                        tr = "t";
                        bl = "b";
                        br = "b";
                    } else {
                        tl = (grid.ul(p)) ? "or" : "ortts";
                        tr = (grid.ur(p)) ? "ol" : "ottle";
                        bl = (grid.dl(p)) ? "or" : "obtre";
                        br = (grid.dr(p)) ? "ol" : "oltbs";
                    }
                    break;
                case 6: // top|left
                    if (v) {
                        tl = (grid.ul(p)) ? "m" : "ltt";
                        tr = "r";
                        bl = "b";
                        br = "btr";
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (grid.ul(p)) ? "ortb" : "ortbc";
                        tr = (grid.ur(p)) ? "ob" : "obtrs";
                        bl = (grid.dl(p)) ? "or" : "obtre";
                        br = (grid.dr(p)) ? "ottl" : "om";
                    }
                    break;
                case 7: // top|left|right
                    if (v) {
                        tl = (grid.ul(p)) ? "m" : "ltt";
                        tr = (grid.ur(p)) ? "m" : "ttr"
                        bl = "b";
                        br = "b";
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (grid.ul(p)) ? "ortb" : "ortbc";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (grid.ur(p)) ? "obtl" : "obtlc";
                        bl = (grid.dl(p)) ? "or" : "obtre";
                        br = (grid.dr(p)) ? "ol" : "oltbs";
                    }
                    break;
                case 8: // down
                    if (v) {
                        tl = "ttl";
                        tr = "rtt";
                        bl = "l";
                        br = "r";
                    } else {
                        tl = (grid.ul(p)) ? "obtr" : "om";
                        tr = (grid.ur(p)) ? "oltb" : "om";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 9: // down|right
                    if (v) {
                        tl = "ttl";
                        tr = "t";
                        bl = "l";
                        br = (grid.dr(p)) ? "m" : "rtb";
                    } else {
                        tl = (grid.ul(p)) ? "obtr" : "om";
                        tr = (grid.ur(p)) ? "ol" : "ottle";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        // conflict between oltbs and ortte -> olttc
                        br = (grid.dr(p)) ? "oltt" : "olttc";
                    }
                    break;
                case 10: // top|down
                    if (v) {
                        tl = "l";
                        tr = "r";
                        bl = "l";
                        br = "r";
                    } else {
                        tl = (grid.ul(p)) ? "ob" : "oltbe";
                        tr = (grid.ur(p)) ? "ob" : "obtrs";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 11: // top|down|right
                    if (v) {
                        tl = "l";
                        tr = (grid.ur(p)) ? "m" : "ttr"
                        bl = "l";
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else {
                        tl = (grid.ul(p)) ? "ob" : "oltbe";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (grid.ur(p)) ? "obtl" : "obtlc";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        // conflict between oltbs and ortte -> olttc
                        br = (grid.dr(p)) ? "oltt" : "olttc";
                    }
                    break;
                case 12: // down|left
                    if (v) {
                        tl = "t";
                        tr = "rtt";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = "r";
                    } else {
                        tl = (grid.ul(p)) ? "or" : "ortts";
                        tr = (grid.ur(p)) ? "oltb" : "om";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (grid.dl(p)) ? "ottr" : "ottrc";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 13: // down|left|right
                    if (v) {
                        tl = "t";
                        tr = "t";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else {
                        tl = (grid.ul(p)) ? "or" : "ortts";
                        tr = (grid.ur(p)) ? "ol" : "ottle";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (grid.dl(p)) ? "ottr" : "ottrc";
                        // conflict between oltbs and ortte -> olttc
                        br = (grid.dr(p)) ? "oltt" : "olttc";
                    }
                    break;
                case 14: // top|down|left
                    if (v) {
                        tl = (grid.ul(p)) ? "m" : "ltt";
                        tr = "r";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = "r";
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (grid.ul(p)) ? "ortb" : "ortbc";
                        tr = (grid.ur(p)) ? "ob" : "obtrs";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (grid.dl(p)) ? "ottr" : "ottrc";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 15: // top|down|left|right
                    if (v) {
                        tl = (grid.ul(p)) ? "m" : "ltt";
                        tr = (grid.ur(p)) ? "m" : "ttr"
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else {
                        // conflict between oltbe and ortts -> ortbc
                        tl = (grid.ul(p)) ? "ortb" : "ortbc";
                        // conflict between obtrs and ottle -> obtlc
                        tr = (grid.ur(p)) ? "obtl" : "obtlc";
                        //  conflict between ottls and obtre -> ottrc
                        bl = (grid.dl(p)) ? "ottr" : "ottrc";
                        // conflict between oltbs and ortte -> olttc
                        br = (grid.dr(p)) ? "oltt" : "olttc";
                    }
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set(tl, i*2, j*2);
            if (tr) overlay.set(tr, i*2+1, j*2);
            if (bl) overlay.set(bl, i*2, j*2+1);
            if (br) overlay.set(br, i*2+1, j*2+1);
        }
    }
}

/**
 * create an overlay of images for the level data represented in given grid
 * @param {*} grid - the level data in grid form
 * @param {*} overlay - the overlay grid which should be twice as big as the grid
 */
function genPerspectiveOverlay(grid, overlay) {
    for (let j=0; j<grid.height; j++) {
        for (let i=0; i<grid.width; i++) {
            let v = grid.get(i,j);
            // compute neighbors
            let p = {i:i, j:j};
            let neighbors = grid.right(p) + (grid.up(p) << 1) + (grid.left(p) << 2) + (grid.down(p)<<3);
            // compute tl overlay
            let tl = "";
            let tr = "";
            let bl = "";
            let br = "";
            //console.log("i: " + i + " j: " + j + " n: " + neighbors);
            switch (neighbors) {
                case 0: // none
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 1: // right
                    if (v) { // wall
                        tl = "ltbs";
                        tr = (grid.dr(p)) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    }
                    break;
                case 2: // top
                    if (v) { // wall
                        tl = "ltbs";
                        tr = "btre";
                        bl = "ltb";
                        br = "btr";
                    }
                    break;
                case 3: // top|right
                    if (v) { // wall
                        tl = "ltbs";
                        tr = (grid.dr(p)) ? "btlsi" : "ltbi";
                        bl = "ltb";
                        br = (grid.dr(p)) ? "btls": "ltbe";
                    } else { // empty
                        tr = (grid.ur(p)) ? "obtl" : "";
                    }
                    break;
                case 4: // left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = "btrs";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = "btr";
                    }
                    break;
                case 5: // left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "bi";
                        tr = (grid.dr(p)) ? "btlsi" : "bi";
                        bl = (grid.dl(p)) ? "rtbe": "b";
                        br = (grid.dr(p)) ? "btls": "b";
                    }
                    break;
                case 6: // top|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "btri";
                        tr = "btre";
                        bl = (grid.dl(p)) ? "rtbe": "btrs";
                        br = "btr";
                    } else { // empty
                        tl = (grid.ul(p)) ? "ortb" : "";
                    }
                    break;
                case 7: // top|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtbei" : "bi";
                        tr = (grid.dl(p)) ? "btlsi" : "bi";
                        bl = (grid.dl(p)) ? "rtbe": "b";
                        br = (grid.dr(p)) ? "btls": "b";
                    } else { // empty
                        tl = (grid.ul(p)) ? "ortb" : "";
                        tr = (grid.ur(p)) ? "obtl" : "";
                    }
                    break;
                case 8: // down
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "ttl";
                        tr = (grid.dr(p)) ? "ttri" : "rtt";
                        bl = (grid.dl(p)) ? "ltts" : "ttle";
                        br = (grid.dr(p)) ? "ttre": "rtts";
                    } else { // empty
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 9: // down|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "ttl";
                        tr = (grid.dr(p)) ? "ttls" : "rtbi";
                        bl = (grid.dl(p)) ? "ltts" : "ttle";
                        br = (grid.dr(p)) ? "m" : "rtb";
                    } else { // empty
                        tr = (grid.dr(p)) ? "oltts" : "";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                    }
                    break;
                case 10: // top|down
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "l";
                        tr = (grid.dr(p)) ? "ttri" : "r";
                        bl = (grid.dl(p)) ? "ltts": "l";
                        br = (grid.dr(p)) ? "ttre": "r";
                    } else {
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 11: // top|down|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "ltti" : "l";
                        tr = (grid.dr(p)) ? (grid.ur(p)) ? "m" : "ttr" : "rtbi";
                        bl = (grid.dl(p)) ? "ltts": "l";
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between oltts and obtl
                        tr = (grid.dr(p)) ? "oltts" : (grid.ur(p)) ? "obtl" : "";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                        bl = (grid.dl(p)) ? "ot" : "ottls";
                    }
                    break;
                case 12: // down|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "rtte" : "btli";
                        tr = (grid.dr(p)) ? "ttri" : "rtt";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "ttre": "rtts";
                    } else { // empty
                        tl = (grid.dl(p)) ? "ottre" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 13: // down|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? "t" : "btli";
                        tr = (grid.dr(p)) ? "t" : "rtbi";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        tl = (grid.dl(p)) ? "ottre" : "";
                        tr = (grid.dr(p)) ? "oltts" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                    }
                    break;
                case 14: // top|down|left
                    if (v) { // wall
                        tl = (grid.dl(p)) ? (grid.ul(p)) ? "m" : "ltt" : "btli";
                        tr = (grid.dr(p)) ? "ttri" : "r";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "ttre": "r";
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        tl = (grid.dl(p)) ? "ottre" : (grid.ul(p)) ? "ortb" : "";
                        //tl = (grid.ul(p)) ? "ortb" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "ot" : "ortte";
                    }
                    break;
                case 15: // top|down|left|right
                    if (v) { // wall
                        tl = (grid.dl(p)) ? (grid.ul(p)) ? "m" : "ltt" : "btli";
                        tr = (grid.dr(p)) ? (grid.ur(p)) ? "m" : "ttr" : "rtbi";
                        bl = (grid.dl(p)) ? "m" : "btl"
                        br = (grid.dr(p)) ? "m" : "rtb"
                    } else { // empty
                        // FIXME: conflict between ottre and ortb
                        // FIXME: conflict between oltts and obtl
                        tl = (grid.dl(p)) ? "ottre" : (grid.ul(p)) ? "ortb" : "";
                        tr = (grid.dr(p)) ? "oltts" : (grid.ur(p)) ? "obtl" : "";
                        bl = (grid.dl(p)) ? "ottr" : "ottls";
                        br = (grid.dr(p)) ? "oltt" : "ortte";
                    }
                    break;
            }
            // add to overlay grid
            if (tl) overlay.set(tl, i*2, j*2);
            if (tr) overlay.set(tr, i*2+1, j*2);
            if (bl) overlay.set(bl, i*2, j*2+1);
            if (br) overlay.set(br, i*2+1, j*2+1);
        }
    }
}

/**
 * a grid of data
 */
class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Array(width*height);
    }

    idx(p, j) {
        if (typeof p === 'number') {
            return (p) % this.width + this.width*j;
        }
        return (p.i) % this.width + this.width*p.j;
    }

    set(v, p, j) {
        let idx = this.idx(p, j);
        this.data[idx] = v;
    }

    get(p,j) {
        let idx = this.idx(p, j);
        return this.data[idx];
    }

    /**
     *  get node left of given point
     */ 
    left(p, dflt=0) {
        if (p.i>0) {
            let idx = this.idx(p.i-1, p.j);
            return this.data[idx];
        }
        return dflt;
    }

    right(p, dflt=0) {
        if (p.i<this.width-1) {
            let idx = this.idx(p.i+1, p.j);
            return this.data[idx];
        }
        return dflt;
    }

    up(p, dflt=0) {
        if (p.j>0) {
            let idx = this.idx(p.i, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    down(p, dflt=0) {
        if (p.j<this.height-1) {
            let idx = this.idx(p.i, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }

    ul(p, dflt=0) {
        if (p.i>0 && p.j>0) {
            let idx = this.idx(p.i-1, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    ur(p, dflt=0) {
        if (p.i<this.width-1 && p.j>0) {
            let idx = this.idx(p.i+1, p.j-1);
            return this.data[idx];
        }
        return dflt;
    }

    dl(p, dflt=0) {
        if (p.i>0 && p.j<this.height-1) {
            let idx = this.idx(p.i-1, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }

    dr(p, dflt=0) {
        if (p.i<this.width-1 && p.j<this.height-1) {
            let idx = this.idx(p.i+1, p.j+1);
            return this.data[idx];
        }
        return dflt;
    }
}


/**
 * the test game/environment
 */
class Game {
    constructor() {
        this.objs = [];
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
    }


    play() {
        let tsize = 32;
        let width = 16;
        let height = 12;
        // generate the test grid and level data
        let grid = new Grid(width, height);
        gen(grid, .35);

        // generate the bg overlay based on level data
        let bgoverlay = new Grid(width*2, height*2);
        genOverlay(grid, bgoverlay);

        // generate the perspective overlay based on level data
        let poverlay = new Grid(width*2, height*2);
        genPerspectiveOverlay(grid, poverlay);

        // draw grid
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                let v = grid.get(i,j);
                //let img = (v) ? fgtw : fgte;
                let img = fgte;
                this.ctx.drawImage(img, tsize*i*2, tsize*j*2, 64, 64);
            }
        }

        // draw background overlay
        for (let j=0; j<bgoverlay.height; j++) {
            for (let i=0; i<bgoverlay.width; i++) {
                let v = bgoverlay.get(i,j);
                if (!v) continue;
                //console.log("i: " + i + " j: " + j + " v: " + v);
                let img = bgtiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }

        // draw perspective overlay
        for (let j=0; j<poverlay.height; j++) {
            for (let i=0; i<poverlay.width; i++) {
                let v = poverlay.get(i,j);
                if (!v) continue;
                //console.log("i: " + i + " j: " + j + " v: " + v);
                let img = walltiles[v];
                //console.log("img: " + img);
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }

    }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", err => reject(err));
    img.src = src;
  });
}

function start() {
    let game = new Game();
    game.play();
}

const bgTemplatePath = "srcref/bgtemplate.png";
const tileTemplatePath = "srcref/tiletemplate.png";

let bgtiles;
let walltiles;

function setup() {
    return new Promise((resolve) => {
        // load tileset images
        let promises = [];
        for (const path of [bgTemplatePath, tileTemplatePath]) {
            promises.push(loadImage(path));
        }
        Promise.all(promises).then((imgs) => {
            let promises = [];
            for (const img of imgs) {
                promises.push(loadTemplateSheet(img, templateMap, 32));
            }
            Promise.all(promises).then((tilesets) => {
                bgtiles = tilesets[0];
                walltiles = tilesets[1];
                resolve();
            });
        });
    });
}

window.onload = function() {
    let promise = setup();
    promise.then( () => start());
}