
// hard-coded bg tiles
const fgtw = new Image();
fgtw.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADRJREFUWIXtzjEBADAIxMCnKiqlK/5FFRksFwO5uq9/FjubcwAAAAAAAAAAAAAAAAAAgCQZQm4B0KN9/LwAAAAASUVORK5CYII=";
const fgte = new Image();
fgte.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADVJREFUWIXtzkEBADAIxLBjSuZf1gRgYcjgkxpoqt/9WexszgEAAAAAAAAAAAAAAAAAAJJkAF3RAy8pxiovAAAAAElFTkSuQmCC";

function tile(data) {
    let img = new Image();
    img.src = "data:image/png;base64," + data;
    return img;
}

// hard-coded wall tiles
let tiles = {
    b: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEBJREFUWIXt0EERACEQA8FwhQAkoOck8EcMqkHGfjoGpivtP+umcF9lHAAAAAAAACBJ+tyjFFD+AAAAAAAAAMAD1fcDA0b3Q3IAAAAASUVORK5CYII="),
    btl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEhJREFUWIVj9OqM+s8wgIBpIC0fdcCoA0YdMOqAUQeMOmDUAQwMDAwsCqkCFBnwYPYHivQPeAiMOmDUAaMOGHXAqANGHTDqAAC2HgVuvol+fwAAAABJRU5ErkJggg=="),
    btr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEZJREFUWIVj9OqM+s9AAVBIFaBEOwMTRbqpAEYdMOqAUQeMOmDUAaMOGHUAC6X1OaVgwENg1AGjDhh1wKgDRh0w6oBRBwAAEtMDmM0BoHIAAAAASUVORK5CYII="),
    l: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADpJREFUWIXtzkENACAMALGB3FnCHArIHICI8ez9L+nIkzca7VWdPWbr/hAAAAAAAAAAAAAAAAAAAMAD12YFbFSqT+cAAAAASUVORK5CYII="),
    ltb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAElJREFUWIVjzHqX9Z+BAvBg9gdKtDMwUaSbCmDUAaMOGHXAqANGHTDqgFEHsFBqgEKqAEX6BzwERh0w6oBRB4w6YNQBow4YdQAAcscGA0I9FWUAAAAASUVORK5CYII="),
    ltt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERJREFUWIXt1cEJACEQBEEVozWlS84IxAw0iBHuU/0fKPazdaxxStD8djIvLVo/CAAAAAAAAKCn/zzt9wsAAAAAAAAAXGJ8B9kIBCjCAAAAAElFTkSuQmCC"),
    m: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADNJREFUWIXtzkEBADAIxLBj8iZhjlA9ZPBJDTR1+/0sdjbnAAAAAAAAAAAAAAAAAAAASTIVZQJsW0v+EgAAAABJRU5ErkJggg=="),
    r: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAADxJREFUWIXtzjERACAMALGCAiSgBwnsFYNqEFHG/P53aevsG4VmjsoevXR/CAAAAAAAAAAAAAAAAAAA4AFSMgMBU5I6OAAAAABJRU5ErkJggg=="),
    rtb: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERJREFUWIXt0LERwCAMA0CFY4CMkHkYgZ5hmJoMQeHm3Uv68zP2PCm8VjkOAAAAAAAAkCT9tuBb71W+/AMAAAAAAAAAP7C3AwOte8/aAAAAAElFTkSuQmCC"),
    rtt: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEhJREFUWIVjzHqX9Z9hAAHTQFo+6oBRB4w6YNQBow4YdcCoAxgYGBhYHsz+QJEBCqkCFOkf8BAYdcCoA0YdMOqAUQeMOmDUAQCNugYDMbeVHgAAAABJRU5ErkJggg=="),
    t: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAD1JREFUWIXt0EENACAQA8FCUIslzKGA4ABk3GdqYCdt88yXwvXKOAAAAAAAAECSjL1uKaD8AQAAAAAAAIAPAogFbje1fZ8AAAAASUVORK5CYII="),
    ttl: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAEJJREFUWIXt0MENwCAMA0AXddqs1OWYAHUDGIJHPpe/7VOeWrXTeKNzHAAAAAAAACBJ3tuC+f1X+fYPAAAAAAAAABxnuQVufhEHigAAAABJRU5ErkJggg=="),
    ttr: tile("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAElJREFUWIVj9OqM+s9AAVBIFaBEOwMTRbqpAEYdMOqAUQeMOmDUAaMOGHUAC6UGPJj9gSL9Ax4Cow4YdcCoA0YdMOqAUQeMOgAAQnkFbtw1YQsAAAAASUVORK5CYII="),
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
            // only consider the walls
            if (!v) continue;
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
                    tl = "ttl";
                    tr = "rtt";
                    bl = "ltb";
                    br = "btr";
                    break;
                case 1: // right
                    tl = "ttl";
                    tr = "t";
                    bl = "ltb";
                    br = "b";
                    break;
                case 2: // top
                    tl = "l";
                    tr = "r";
                    bl = "ltb";
                    br = "btr";
                    break;
                case 3: // top|right
                    tl = "l";
                    tr = (grid.ur(p)) ? "m" : "ttr";
                    bl = "ltb";
                    br = "b";
                    break;
                case 4: // left
                    tl = "t";
                    tr = "rtt";
                    bl = "b";
                    br = "btr";
                    break;
                case 5: // left|right
                    tl = "t";
                    tr = "t";
                    bl = "b";
                    br = "b";
                    break;
                case 6: // top|left
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = "r";
                    bl = "b";
                    br = "btr";
                    break;
                case 7: // top|left|right
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = (grid.ur(p)) ? "m" : "ttr"
                    bl = "b";
                    br = "b";
                    break;
                case 8: // down
                    tl = "ttl";
                    tr = "rtt";
                    bl = "l";
                    br = "r";
                    break;
                case 9: // down|right
                    tl = "ttl";
                    tr = "t";
                    bl = "l";
                    br = (grid.dr(p)) ? "m" : "rtb";
                    break;
                case 10: // top|down
                    tl = "l";
                    tr = "r";
                    bl = "l";
                    br = "r";
                    break;
                case 11: // top|down|right
                    tl = "l";
                    tr = (grid.ur(p)) ? "m" : "ttr"
                    bl = "l";
                    br = (grid.dr(p)) ? "m" : "rtb"
                    break;
                case 12: // down|left
                    tl = "t";
                    tr = "rtt";
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = "r";
                    break;
                case 13: // down|left|right
                    tl = "t";
                    tr = "t";
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = (grid.dr(p)) ? "m" : "rtb"
                    break;
                case 14: // top|down|left
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = "r";
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = "r";
                    break;
                case 15: // top|down|left|right
                    tl = (grid.ul(p)) ? "m" : "ltt";
                    tr = (grid.ur(p)) ? "m" : "ttr"
                    bl = (grid.dl(p)) ? "m" : "btl"
                    br = (grid.dr(p)) ? "m" : "rtb"
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
        // generate the wall overlay based on level data
        let overlay = new Grid(width*2, height*2);
        genOverlay(grid, overlay);
        // draw grid
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                let v = grid.get(i,j);
                let img = (v) ? fgtw : fgte;
                this.ctx.drawImage(img, tsize*i*2, tsize*j*2, 64, 64);
            }
        }
        // draw overlay
        for (let j=0; j<overlay.height; j++) {
            for (let i=0; i<overlay.width; i++) {
                let v = overlay.get(i,j);
                if (!v) continue;
                //console.log("i: " + i + " j: " + j + " v: " + v);
                let img = tiles[v];
                if (!img) continue;
                this.ctx.drawImage(img, tsize*i, tsize*j);
            }
        }
    }
}

window.onload = function() {
    // create game
    let game = new Game();
    // play
    game.play();
}