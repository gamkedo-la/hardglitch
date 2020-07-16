import { Board } from "./blip.js";
import { initialize } from "../system/graphics.js";
import { Color } from "../system/color.js";
import { random_int } from "../system/utility.js";
import { Vector2 } from "../system/spatial.js";

let last_update_time = Date.now();
const tileImg = new Image();
tileImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABWFJREFUeJztmk1sFGUYx387O7MfbadbWrYtCNYiEpAUDUpBD2LEEEpiaIyBoJGInsQY49XEgx64ePAANl7QGDEaPxK4ehOQhGDgABgOFQLdQmndbku3+9Gd3fGwnbbb+d7dlu6s/9PuPO+8+8xvZ97n4x3fxp631JfeeJd6lQBw7tdvHrUfj0yC9qFeIQgLv9QjBGHxgXqDoAMA9QXBEADUDwRTAFAfECwBgPch2AIAb0NwBAC8C8ExAPAmBFcAwHsQXAMAb0EoCwB4B4KQ2dpa9slegODj1ml13SeXCN0YL2sCOfJElV1aXgmR/gFix3dSyZ1QyxKiajf1DEEAqGcIc1GgXiGUhMF6hKDLA6oJYfhwO3ffW8Pw4faK5llKiUYHo2o39A8QO3OMckPkyOurSbwYIRcRERNplFSQcGyGgL9JN7YgCQi5gnvvLaTNGYgrSOM5pIRiOM4QAFQOIdsukYsUp1diI6T8ScY/2uZqjmpIvjhC8MQF1kvPGdpNAUBlEMTJfPHDtdsIV28RnJJpOPKDc88rVD4sEOzfy2hfJ9LXPtNxlgCgfAiP/TjKxvhtYolGfIkOWgf9wHbHF1Cx0jDxT9p2mKNiqHRhXOXch98babvM7MWvTDmuBuch7CK7qWUpfVpWuSqHNQhDX7zgGQi2AOJHNxM/unnu+0II6R7rPKFm8wBN428+xdTLa1ELCko6ScdPMWB+YRw+c4zAyZjuPNXvI7smoMsDus5mXTk3E5WYWS2hyOZrSCCuID5UCIzlXM2tyRKA0hpEaQnCtXtkg6XOaxDGju0nuVffEwjdTenyAJBcOac0izx4VebhDvM7remPGKGB86wPPu9qbk2WAPzTxezJd3WQXFenzh5Vu5k4dZ7A6T9LjqsCSIf2kXm8oSQPcAtgpk3k4Y5Wmj7+mUC89B/OhwXyDX6SXx4kcKrszp41gLZvb7IlGefycJLckR6mzk0j/5UoGWNIvgAY5gHlyZ/K07U4h0jDRI9MsuxZi7JFN/rLGGtvNtJ0cIAHn+4i9YzzAqlaeYA/Xd06YaEc3TvSRJ7ObDfN/QPc+3wnqWfblsyh5Zarh6d9NgTe+6y3JiCoYrEGUC2u0vXqEV0AYbq3svherTxBu9DF8ikqAI179pieK2a2troudaNqNxz4ivtnPyBkkAfYqVp5gibtQs00s1piolc2tImx4zvLqvejbKDQf5KxD18juafL1blQnTzBToG4gnxxhNE+fQjXJEYqaHp0qE9y/7dztH7n7klymicUpPLjO4A0niN44oJ1P6DSzs+mZBkZmMM8odI2mZRQTDtBc78Bj64bvBL6Bf/vCyz8UmsQnMR5Oy3pvkC1ZBbnU10hwrEM0qF9hnYneYYhu5UGwSjOa/sO6XUhxnc1cOdA0NAe391iaNdkevOsNAiLldjeaJBHOLdrEpJDV0x/ZCVDaL4x2/LW8ojhjCu7JhEgOXSFpvXGPftqbJMthYz3HZzbNc09ArV4J9jlEXfiTUxuk5kRzWuMkjWgFiHYaXL3Oku7bhH0EgRtJzrU3GE6xjAKVAuCXRy2s2ureKWymsfU4nRh5PsRwkP6Zyz5dINlvW/0/kBkcHZHuTEMFOv4asiyH2B1ohMIk+/3EXu7W2e3q/eN4nRmh0zqldK5wmev488UIGTlqbGc9AN8nS1brNspYAoBYCL0r+Fx4Z39jPa1zcVheUpmw6X5f2H4cLvOLlz4u+iUNA9KyBbwpwusbem1c1On3CqRkdFLFCTzfoAjAGAOwepN0fDe6dk4nDcMVXb25ZBjAGAMoeZflXUz2Co61KpcV9Jeg1BWK8FLEMrupXgFwn/359I24GoygQAAAABJRU5ErkJggg==";
const tile2Img = new Image();
tile2Img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAy9JREFUeJztWktrE1EU/pKZyWPyQlvbhhYL2oWIiHbRhQgFBVE3SruQbkRc9xfoyt/gptSlSFcu3HQRsaDWgqsuRBAqBm1r8zDJhLzbpLpoU9rm3mRezRkz8y1z7rnny8dkvnPPjevxs3d/YWO4qQlQwxGAmgA1HAGoCVDDEYCaADUcAagJUMMRgJoANRwBqAlQwxGAmgA1xNW3S9QcSGH7J8ARgJoANRwBqAlQQzSSvDkzgIYsQCg3MLyQMotTV6FbgMRUP3LXItiJiBBzFdTLXkS2PGZyMwW+zSokpQGhtMuM6xYgNx7ATmQvvb6RQFkoIjt7We92J4bIchrR13/gL7HjugUIf62gelYGvsThXv0BbyEE+eErvdudCCITk4jPjkCYj2EU48w1ugUYXkhhLBPHRi4AV24Qp78LAKcIFRQVawy9BCuxAPoAAIKRbUhhexu0vQBtfwLUPt+N+lwBzPJ5UanDm9yGlG9oyjOjfmnM35kfL3Dc57PT55DVVH4P4ZU0zsRqkPLa8moDkil9hrz4rW2cK8Bxnw99SEP4vKapuHT/BpJTUYhzMYQ1WqTYfGJM6DOGfJeAKqcOL8kMn1d+a3vsza5/AM6XBzq8BKl9vhv1bW+DthfgRPuA0nk/+t4rEGZuA4x86j4DAMTiBZkZKF6UW3x49E1N9cYsHz+cb5V5grj2ZJQZ8P0qt/gwIKnemDUvOJxvls8bhdj/4CUz4H50t+W8r0UA1rzgcL6ZPm8ErqvXn3L/Keq/Vdr34ca+D2tDp3yj+5uBtgLYAba3QdsL0NP3Amr4/ff3Ap71EqTiLqRCZ36sPka3AFbx8dDHLYQW4xgsnDryeac+pAndAljBx8Xpm0jdi0J6sQTgqACd+pCDPfQWt8K9gLJe58bY/FrR0/cCPzNBFK8EIX9KAmCfeXreBvOTI23jPS2ARwgCAHzhQe4aQ/MAq/cBTTTdgAXd8wAr9AFq5v4AsN0vQZkIMWO65wFW6QPazf09mTpCKwmk7gxx1+ieB1ihD2iCN/eXsjvwPl+GNOfi5hqaB1jhPG8Uhu4FrN4HqEFP26AaOAJQE6CG7QX4B0fd1+tZBWifAAAAAElFTkSuQmCC";

const blipImg = new Image();
blipImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAGpJREFUCJljYGBgYGC4t4R377fnfgz3lvAyMDAwMDLcW8IbxiU3e9W3R0qhXHL3Vn97lMq0V8LZ8f2/X3pzhM1NP/z7pbdXwtmRyfnF3v28jCwXU96ePCnAxHbJ+cXe/QwwMw98e+ELMxMAdOgpmvYoUogAAAAASUVORK5CYII=";
const sparkMinImg = new Image();
sparkMinImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAAXNSR0IArs4c6QAAAKJJREFUGJVjYCAShL44xANj8BJQWIQukIVDIVZxhtAXh1Yw3FvCu/fbcz/rpzvdQ18cWoEsz4LMWf3tUWool9xs5xd7lUK55O79+f9vObI8EzJnr4Sz44d/v/TOSnqYfvj3Sy+HX/0/TsWTP95k4GVkuWj8fMdJASa2S84v9u7HqZiVkSnq5b+f8w9IuLTCnITLc8SFBkY4YmrghTF48ClEBgC2gUsgQpNFAwAAAABJRU5ErkJggg==";

const sparkMaxImg = new Image();
sparkMaxImg.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAAXNSR0IArs4c6QAAAiFJREFUOI21lE9oE0EUxt9MN2mMNjYVapvdS7EYKIV46EXdpro1JJqDYhC8Sy7mIHgRL3rx4kla8VKvIr0UD2JxSAiNDQ3qRUGiAREPkz/GpsYNSbPbZKanQtnuJm2N3/F78/3mvYF5IFPigP8hmZJQjzj9RkPpKXBX4VAdy5S4uh2I+SkZPQBw2ugho+GnRGIAV+0Iv7QBFog4+9sMpuTjJ3TOJtJScNVYw0bjnRSkdoQX2wC3BYRa14or48Yz4UJyECEUsiP8xezCPVAAgD5A+Bjqe+bEQny9rQ1HyxkfAECklPLKlEw7sZB3AF5OioE/Zvk94+/q5tRftuW5NzixOK/mHh3Htpra3jofHRi/NafmLqSl4JpVtqMipZQ3XEjGfuq1X/DjxYdvzerm5WJyYafzQ+t6MXUjUEhk83qdBwqJ7MPKpwfdMqZvuqNoOePbYJo0PzQ1JtJX758OTY2tNdfrkVLK2yln+aYAADIl5+64vCsLte/3z/S7bR+1ihYbOP14Ts3NurCtsuxRsgeChgtJtxMLtNjaDJ0UHOWlkZlctJzxfdXVo6PCkXiDtUSNM5wQL20Ys6bjK/m4uwnsSoO1xLQUXF0amckBADwfPvvZje3VBmtJdWjfZcBNmzKF6pxNcs7fvvEoVWPttediVuMMYQ5PdM5u7utLm/1lK/kpkWRKYt2AnbeNdc58u1nuw/2DFaPxT0BLcK8kU+LYBsfT5A44S06zAAAAAElFTkSuQmCC";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", err => reject(err));
    img.src = src;
  });
}

function ofmt(obj, name) {
    if (!obj) return "";
    let keys = Object.keys(obj);
    let kvs = [];
    for (const key of keys) {
        kvs.push(key + ":" + obj[key])
    }
    if (name) {
        return "[" + name + ":" + kvs.join(",") + "]";
    } else {
        return "[" + kvs.join(",") + "]";
    }
}

class Blip {
    constructor(ctx, v1, v2, speed, nextEdgeFcn) {
        this.ctx = ctx;
        this.v1 = v1
        this.v2 = v2
        this.speed = speed * .001;
        this.x = v1.x
        this.y = v1.y;
        console.log("blip: v1: " + ofmt(v1) + " v2: " + ofmt(v2));
        console.log("blip: [" + this.x + "," + this.y + "]");
        this.velocity = new Vector2({x:v2.x-v1.x, y: v2.y-v1.y})
        this.velocity.length = this.speed;
        console.log("velocity: " + this.velocity);
        this.nextEdgeFcn = nextEdgeFcn;
    }

    update(delta_time) {
        // check distance to next vertex vs. distance to travel this tick
        let dtv2 = new Vector2({x:this.v2.x-this.x,y:this.v2.y-this.y}).length;
        let dtt = this.speed * delta_time;
        //console.log("dtv2: " + dtv2 + " dtt: " + dtt);
        if (dtt >= dtv2) {
            // get next edge
            let nv2 = this.nextEdgeFcn(this.v2, this.v1);
            console.log("nv2: " + nv2);
            this.v1 = this.v2;
            this.v2 = nv2;
            // recompute velocity
            this.velocity = new Vector2({x:this.v2.x-this.v1.x, y: this.v2.y-this.v1.y})
            this.velocity.length = this.speed;
            let offset = new Vector2({x: this.velocity.x, y:this.velocity.y});
            offset.length = dtt-dtv2;
            // compute new x/y
            this.x = this.v1.x + offset.x;
            this.y = this.v1.y + offset.y;
        // otherwise, not close enough to endpoint - update position
        } else {
            this.x = this.x + this.velocity.x * delta_time;
            this.y = this.y + this.velocity.y * delta_time;
        }
        //console.log("blip: [" + this.x + "," + this.y + "]");
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y+2.5);
        this.ctx.lineTo(this.x+5, this.y+2.5);
        this.ctx.moveTo(this.x+2.5, this.y);
        this.ctx.lineTo(this.x+2.5, this.y+5);
        this.ctx.strokeStyle = 'rgba(189,246,231,.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        // inner ring
        this.ctx.fillStyle = 'rgba(86,232,194,.66)';
        this.ctx.fillRect(this.x+1, this.y+1, 3, 3);
        // inner dot
        this.ctx.fillStyle = 'rgba(156,241,219,1)';
        this.ctx.fillRect(this.x+2, this.y+2, 1, 1);
    }
}

class Graph {
    constructor(width) {
        this.verts = new Map();
        this.width = width;
        this.vertColor = Color.random();
        this.edgeColor = Color.random();
    }

    vertKey(v) {
        // create integer key
        return Math.round(v.x) + Math.round(v.y)*this.width;
    }

    addVert(v) {
        let key = this.vertKey(v);
        if (this.verts.has(key)) {
            return this.verts.get(key);
        }
        let vert = {v:v,e:[]};
        this.verts.set(key, vert);
        return vert;
    }

    addEdge(v1, v2) {
        let vert1 = this.addVert(v1);
        let vert2 = this.addVert(v2);
        let k1 = this.vertKey(v1);
        let k2 = this.vertKey(v2);
        // add edges
        if (-1 == vert1.e.indexOf(k2)) {
            vert1.e.push(k2);
            console.log(" ... vert1: " + ofmt(vert1));
        }
        if (-1 == vert2.e.indexOf(k1)) {
            vert2.e.push(k1);
            console.log(" ... vert2: " + ofmt(vert1));
        }
    }

    getVert(v) {
        let key = this.vertKey(v);
        return this.verts.get(key);
    }

    merge(other) {
        for (const key of other.verts.keys()) {
            this.verts.set(key, other.verts.get(key));
        }
    }

    getRandVert() {
        let keys = Array.from(this.verts.keys());
        let key = keys[random_int(0,keys.length-1)];
        return this.verts.get(key).v;
    }

    getRandEdge(v, lastv) {
        let vert = this.getVert(v);
        //console.log("get randEdge v: " + ofmt(v) + " lastv: " + ofmt(lastv) + " vert: " + ofmt(vert));
        if (!vert) return undefined;
        // randomly choose new edge (exclude lastv if given)
        if (lastv && vert.e.length != 1) {
            let lastvk = this.vertKey(lastv);
            let lastidx = vert.e.indexOf(lastvk);
            //console.log("lastvk: " + lastvk);
            //console.log("lastidx: " + lastidx);
            if (-1 != lastidx) {
                let idx = random_int(0, vert.e.length-2);
                if (idx >= lastidx) idx++;
                //console.log("idx: " + idx);
                let vert2 = this.verts.get(vert.e[idx]);
                //console.log("vert2: " + ofmt(vert2));
                return (vert2) ? vert2.v : undefined;
            }
        }
        // otherwise (no exclusion)
        let key = vert.e[random_int(0, vert.e.length-1)];
        let vert2 = this.verts.get(key)
        return (vert2) ? vert2.v : undefined;
    }

    draw(ctx) {
        let visited = [];
        for (const key of this.verts.keys()) {
            visited.push(key);
            let vert = this.verts.get(key);
            if (!vert) continue;
            ctx.beginPath();
            ctx.fillStyle = this.vertColor;
            ctx.arc(vert.v.x, vert.v.y, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.closePath();
            for (const ek of vert.e) {
                //console.log("ek: " + ek);
                if (-1 == visited.indexOf(ek)) {
                    let vert2 = this.verts.get(ek);
                    //console.log("vert2: " + vert2);
                    if (vert2) {
                        ctx.beginPath();
                        ctx.strokeStyle = this.edgeColor;
                        ctx.lineWidth = 2;
                        ctx.moveTo(vert.v.x, vert.v.y);
                        ctx.lineTo(vert2.v.x, vert2.v.y);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            }
        }
    }

}

class GraphBuilder {
    constructor(width) {
        this.width = width;
        this.graphs = [];
    }

    getGraph(v) {
        for (const g of this.graphs) {
            if (g.getVert(v)) return g;
        }
        return undefined;
    }

    removeGraph(g) {
        let idx = this.graphs.indexOf(g);
        if (idx != -1) this.graphs.splice(idx, 1);
    }

    addEdge(v1, v2) {
        // does any graph have either vertex?
        let g1 = this.getGraph(v1);
        let g2 = this.getGraph(v2);
        console.log("adding edge: " + ofmt(v1) + "->" + ofmt(v2));
        if (!g1 && !g2) {
            let g = new Graph(this.width);
            this.graphs.push(g);
            g.addEdge(v1, v2);
        } else if (g1 && !g2) {
            g1.addEdge(v1, v2);
        } else if (!g1 && g2) {
            g2.addEdge(v1, v2);
        } else if (g1 && g2) {
            if (g1 != g2) {
                console.log("merging graphs");
                g1.merge(g2);
                this.removeGraph(g2);
            }
            g1.addEdge(v1, v2);
        }
    }

    draw(ctx) {
        for (const g of this.graphs) {
            g.draw(ctx);
        }
    }
}

class TileGraphBuilder extends GraphBuilder {
    edgeMap = {
        "ltb": [
            {x:0,y:0}, {x:0,y:16}, 
            {x:0,y:16}, {x:16,y:31}, 
            {x:16,y:31}, {x:32,y:31},
            {x:16,y:0}, {x:16,y:31},
            {x:16,y:0}, {x:32,y:0},
        ],
        "ltbe": [
            {x:0,y:0}, {x:32,y:0}, 
            {x:0,y:31}, {x:32,y:31}, 
        ],
        "b": [
            {x:0,y:0}, {x:32,y:0}, 
            {x:0,y:31}, {x:32,y:31}, 
        ],
        "btls": [
            {x:0,y:0}, {x:16,y:0}, 
            {x:16,y:0}, {x:16,y:31}, 
            {x:16,y:0}, {x:32,y:15}, 
            {x:0,y:31}, {x:16,y:31}, 
        ],
        "btl": [
            {x:0,y:15}, {x:0,y:32}, 
            {x:15,y:0}, {x:15,y:32}, 
        ],
    }

    constructor(width) {
        super(width);
    }

    addTile(x,y,id) {
        //console.log("edgeMap: " + this.edgeMap);
        let edgeInfo = this.edgeMap[id];
        //console.log("edgeInfo: " + edgeInfo);
        if (!edgeInfo) return;
        for (let i=0; i<edgeInfo.length; i+=2) {
            let v1 = edgeInfo[i];
            let v2 = edgeInfo[i+1];
            this.addEdge({x:v1.x+x, y:v1.y+y}, {x:v2.x+x, y:v2.y+y});
        }
    }

}

class Env {
    constructor() {
        this.objs = [];
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
        this.gb = new TileGraphBuilder(1024);
    }

    setup() {
        // left angled board
        let board = new Board({x:128, y:128}, [
            [{x:3, y:3}, {x:7, y:3}, {x:7, y:5}, {x:9,y:5}],
            [{x:1, y:4}, {x:2, y:5}, {x:4, y:5}],
            [{x:4, y:7}, {x:5, y:7}, {x:5, y:4}, {x:6, y:4}, {x:6,y:6}],
            [{x:3, y:4}, {x:2, y:4}, {x:-1, y:1}, {x:-1, y:4}, {x:2,y:7}, {x:3,y:7}],
            [{x:7, y:6}, {x:7, y:7}, {x:9, y:7}],
        ]);
        board.maskRight=false;
        this.objs.push(board);
        // repeated middle board
        for (let i=0; i<8; i++) {
            let pos = {x:192+64*i, y:128};
            let board = new Board(pos, [
                [{x:1, y:4}, {x:3, y:4}, {x:3, y:5}],
                [{x:2, y:3}, {x:7, y:3}, {x:7, y:4}, {x:5, y:4}],
                [{x:4, y:5}, {x:9, y:5}],
                [{x:2, y:6}, {x:6, y:6}, {x:6, y:7}, {x:2, y:7}],
                [{x:7, y:6}, {x:7, y:7}, {x:9, y:7}],
                //[{x:4, y:7}, {x:5, y:7}, {x:5, y:4}, {x:6, y:4}, {x:6,y:6}],
                //[{x:3, y:4}, {x:2, y:4}, {x:-1, y:1}, {x:-1, y:4}, {x:2,y:7}, {x:3,y:7}],
                //[{x:7, y:6}, {x:7, y:7}, {x:9, y:7}],
            ]);
            board.maskLeft=false;
            board.maskRight=(i==7);
            this.objs.push(board);
        }

        // build graph
        this.gb.addTile(300+32, 300+32*10, "ltb");
        this.gb.addTile(300+32*2, 300+32*10, "ltbe");
        this.gb.addTile(300+32*3, 300+32*10, "b");
        this.gb.addTile(300+32*4, 300+32*10, "btls");
        this.gb.addTile(300+32*5, 300+32*10, "btl");
        console.log("gb.graphs.length: " + this.gb.graphs.length);

        // pick graph
        let graph = this.gb.graphs[0];
        // pick vertex
        let v1 = graph.getRandVert();
        // pick edge
        let v2 = graph.getRandEdge(v1);
        this.blip = new Blip(this.ctx, v1, v2, 50, graph.getRandEdge.bind(graph));

        return new Promise((resolve) => {
            let promises = [];
            let promise = loadImage("srcref/tiletemplate.png");
            promise.then(img => this.bgimg = img);
            promises.push(promise);
            Promise.all(promises).then(() => {
                console.log("setup complete");
                resolve();
            })
        });
    }

    loop() {
        const now = Date.now();
        const delta_time = Math.min(100,now - last_update_time);
        last_update_time = now;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(blipImg, 100, 250);
        this.ctx.drawImage(sparkMinImg, 150, 250);
        this.ctx.drawImage(sparkMaxImg, 200, 250);
        this.ctx.drawImage(this.bgimg, 300, 300);

        this.gb.draw(this.ctx);

        this.blip.update(delta_time);
        this.blip.draw();

        this.ctx.drawImage(tileImg, 128, 128);
        for (let i=0; i<8; i++) {
            this.ctx.drawImage(tile2Img, 192+64*i, 128);
        }
        for (const obj of this.objs) {
            obj.draw(this.ctx, { x: 128, y: 128 });
        }
    }


    start() {
        console.log("env: starting loop...");
        initialize({images:[]});
        setInterval(() => { this.loop(); }, this.INTERVAL);
    }


}

window.onload = function() {
    let env = new Env();
    let promise = env.setup();
    promise.then( () => env.start());
}