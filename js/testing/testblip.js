import { Board } from "./blip.js";
import { initialize } from "../system/graphics.js";
import { Color } from "../system/color.js";
import { random_int, random_float } from "../system/utility.js";
import { Vector2 } from "../system/spatial.js";
import { Particle, ParticleGroup } from "../system/particles.js";

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

class Blip extends Particle {
    constructor(ctx, v1, v2, radius, speed, group, nextEdgeFcn) {
        super(ctx, v1.x, v1.y);
        this.ctx = ctx;
        this.v1 = v1
        this.v2 = v2
        this.radius = radius;
        this.width = radius * 10;
        this.speed = speed * .001;
        this.group = group;
        this.nextEdgeFcn = nextEdgeFcn;
        this.velocity = new Vector2({x:v2.x-v1.x, y: v2.y-v1.y})
        this.velocity.length = this.speed;
        let hue = 127;
        this.armColor = Color.fromHSL(hue, 100, random_int(50,80), 1);
        this.centerColor = Color.fromHSL(hue, 100, random_int(90,100), 1);
        this.angle1 = Math.random() * Math.PI;
        this.angle2 = this.angle1 + (Math.PI * .5);
        this.rotateStep = random_float(-2,2) * .001;
        this.sparkIntensity = 0;
        this.sparkRange = 10;
    }

    toString() {
        return "[Blip:" + this.x + "," + this.y + "]";
    }

    getGradient(sx, sy, ex, ey, color) {
        let gradient = this.ctx.createLinearGradient(sx, sy, ex, ey);
        gradient.addColorStop(0, color.asHSL(color.a*.1));
        gradient.addColorStop(.5, color.asHSL());
        gradient.addColorStop(1, color.asHSL(color.a*.2));
        return gradient;
    }

    /**
     * determine the nearest range of other blips on the circuit
     * @param {*} blip 
     * @returns float - distance to nearest blip on the same circuit
     */
    nearestRange(group) {
        let sqr = 1000;
        for (const other of group) {
            if (other === this) continue;
            let dx = other.x - this.x;
            let dy = other.y - this.y;
            let or = dx*dx + dy*dy;
            if (or < sqr) sqr = or;
        }
        return Math.sqrt(sqr);
    }

    update(delta_time) {
        if (this.done) return;
        let nr = (this.group) ? this.nearestRange(this.group) : 100;
        this.sparkIntensity = 0;
        if (nr < this.sparkRange) {
            this.sparkIntensity = (this.sparkRange-nr)/this.sparkRange;
        }
        // check distance to next vertex vs. distance to travel this tick
        let dtv2 = new Vector2({x:this.v2.x-this.x,y:this.v2.y-this.y}).length;
        let dtt = this.speed * delta_time;
        //console.log("dtv2: " + dtv2 + " dtt: " + dtt);
        if (dtt >= dtv2) {
            // get next edge
            let nv2 = this.nextEdgeFcn(this.v2, this.v1);
            if (!nv2) {
                this._done = true;
                console.log("can't find edge for " + ofmt(this.v2) + "->" + ofmt(this.v1) + " nv2: " + nv2);
                //return;
            }
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
        // rotation
        if (this.sparkIntensity) {
            this.angle1 += this.rotateStep * delta_time;
            this.angle2 += this.rotateStep * delta_time;
            this.armColor.a = this.sparkIntensity;
        }
    }

    draw() {
        // spark
        if (this.sparkIntensity) {
            let sx1 = Math.cos(this.angle1) * this.width * .5;
            let sy1 = Math.sin(this.angle1) * this.width * .5;
            let ex1 = -sx1;
            let ey1 = -sy1;
            let sx2 = Math.cos(this.angle2) * this.width * .5;
            let sy2 = Math.sin(this.angle2) * this.width * .5;
            let ex2 = -sx2;
            let ey2 = -sy2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.x+sx1, this.y+sy1);
            this.ctx.lineTo(this.x+ex1, this.y+ey1);
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeStyle = this.getGradient(this.x+sx1, this.y+sy1, this.x+ex1, this.y+ey1, this.armColor);
            this.ctx.stroke();
            this.ctx.closePath();
            this.ctx.beginPath();
            this.ctx.moveTo(this.x+sx2, this.y+sy2);
            this.ctx.lineTo(this.x+ex2, this.y+ey2);
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeStyle = this.getGradient(this.x+sx2, this.y+sy2, this.x+ex2, this.y+ey2, this.armColor);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        // center dot
        this.ctx.beginPath();
        this.ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, Math.PI*2)
        this.ctx.fillStyle = this.centerColor.asHSL(this.centerColor.a*.5);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.arc(Math.round(this.x), Math.round(this.y), Math.max(1,this.radius-2), 0, Math.PI*2)
        this.ctx.fillStyle = this.centerColor.asHSL();
        this.ctx.fill();
        this.ctx.closePath();
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
        console.log("adding vert: " + key);
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
            //console.log(" ... vert1: " + ofmt(vert1));
        }
        if (-1 == vert2.e.indexOf(k1)) {
            vert2.e.push(k1);
            //console.log(" ... vert2: " + ofmt(vert1));
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
        if (!vert) {
            console.log("vert not found: " + ofmt(v));
            return undefined;
        }
        //let dbg = (vert.v.x==475 && vert.v.y==620);
        let dbg = true;
        if (dbg) console.log("get randEdge v: " + ofmt(v) + " lastv: " + ofmt(lastv) + " vert: " + ofmt(vert));
        // randomly choose new edge (exclude lastv if given)
        if (lastv && vert.e.length != 1) {
            let lastvk = this.vertKey(lastv);
            let lastidx = vert.e.indexOf(lastvk);
            if (dbg) console.log("lastvk: " + lastvk);
            if (dbg) console.log("lastidx: " + lastidx);
            if (-1 != lastidx) {
                let idx = random_int(0, vert.e.length-2);
                if (idx >= lastidx) idx++;
                if (dbg) console.log("idx: " + idx + " vert.e[idx]: " + vert.e[idx]);
                let vert2 = this.verts.get(vert.e[idx]);
                if (dbg) console.log("vert2: " + ofmt(vert2));
                if (!vert2) {
                    console.log("this.verts: " + Array.from(this.verts.keys()));
                }
                let rv = (vert2) ? vert2.v : undefined;
                if (dbg) console.log("returning: " + ofmt(rv));
                return rv;
            }
        }
        // otherwise (no exclusion)
        let key = vert.e[random_int(0, vert.e.length-1)];
        let vert2 = this.verts.get(key)
        let rv = (vert2) ? vert2.v : undefined;
        if (dbg) console.log("returning: " + ofmt(rv));
        return rv;
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
        this.groups = [];
    }

    getGraph(v) {
        for (const g of this.graphs) {
            if (g.getVert(v)) return g;
        }
        return undefined;
    }

    getGroup(graph) {
        let idx = this.graphs.indexOf(graph);
        if (idx != -1) {
            return this.groups[idx];
        }
        return undefined;
    }

    addGraph(g) {
        this.graphs.push(g);
        this.groups.push(new ParticleGroup());
    }

    removeGraph(g) {
        let idx = this.graphs.indexOf(g);
        if (idx != -1) {
            this.graphs.splice(idx, 1);
            this.groups.splice(idx, 1);
        }
    }

    addEdge(v1, v2) {
        // does any graph have either vertex?
        let g1 = this.getGraph(v1);
        let g2 = this.getGraph(v2);
        console.log("adding edge: " + ofmt(v1) + "->" + ofmt(v2));
        if (!g1 && !g2) {
            let g = new Graph(this.width);
            this.addGraph(g);
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
        "btrs": [
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
        "ltbs": [
            {x:0,y:0}, {x:0,y:16}, 
            {x:0,y:16}, {x:0,y:32}, 
            {x:0,y:16}, {x:16,y:32}, 
            {x:15,y:0}, {x:32,y:16}, 
        ],
        "ltbi": [
            {x:0,y:16}, {x:32,y:16}, 
        ],
        "bi": [
            {x:0,y:16}, {x:32,y:16}, 
        ],
        "btri": [
            {x:0,y:16}, {x:32,y:16}, 
        ],
        "btlsi": [
            {x:0,y:16}, {x:32,y:17}, 
        ],
        "btli": [
            {x:0,y:17}, {x:15,y:32}, 
        ],
        "obtl": [
            {x:16,y:-1}, {x:32,y:16}, 
        ],
        "btle": [
            {x:0,y:0}, {x:0,y:16}, 
            {x:0,y:16}, {x:0,y:32}, 
            {x:15,y:0}, {x:15,y:32}, 
        ],
        "l": [
            {x:0,y:0}, {x:0,y:32}, 
            {x:15,y:0}, {x:15,y:32}, 
        ],
        "btre": [
            {x:0,y:16}, {x:16,y:0}, 
            {x:15,y:32}, {x:31,y:16}, 
            {x:31,y:32}, {x:31,y:16}, 
            {x:31,y:16}, {x:31,y:0}, 
        ],
        "btr": [
            {x:0,y:0}, {x:15,y:0}, 
            {x:15,y:0}, {x:15,y:31}, 
            {x:0,y:31}, {x:15,y:31}, 
            {x:15,y:31}, {x:31,y:16}, 
            {x:31,y:16}, {x:31,y:0}, 
        ],
        "r": [
            {x:16,y:0}, {x:16,y:32}, 
            {x:31,y:0}, {x:31,y:32}, 
        ],
        "rtbs": [
            {x:16,y:0}, {x:16,y:32}, 
            {x:31,y:0}, {x:31,y:16}, 
            {x:31,y:16}, {x:31,y:32}, 
        ],
        "ortb": [
            {x:-1,y:16}, {x:15,y:-1}, 
        ],
    }

    constructor(width) {
        super(width);
    }

    addTile(x,y,id) {
        let edgeInfo = this.edgeMap[id];
        if (!edgeInfo) return;
        let verts = [];
        for (let i=0; i<edgeInfo.length; i+=2) {
            let v1 = {x: x+edgeInfo[i].x, y:y+edgeInfo[i].y};
            let v2 = {x: x+edgeInfo[i+1].x, y:y+edgeInfo[i+1].y};
            this.addEdge(v1, v2);
            verts.push(v1, v2);
        }
        return verts;
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
        this.blips = [];
        this.groups = [];
    }

    addBlip(x,y,tile) {
        // add tile verts/edges to graph
        let verts = this.gb.addTile(x, y, tile);
        if (!verts) return;
        // create one random blip per tile
        let idx = random_int(0,(verts.length/2)-1)*2;
        // lookup graph
        //console.log("verts: " + verts)
        let graph = this.gb.getGraph(verts[idx]);
        let group = this.gb.getGroup(graph);
        let blip;
        let speed = random_int(40,75);
        let radius = 2;
        if (Math.random() > .5) {
            blip = new Blip(this.ctx, verts[idx], verts[idx+1], radius, speed, group, graph.getRandEdge.bind(graph));
        } else {
            blip = new Blip(this.ctx, verts[idx+1], verts[idx], radius, speed, group, graph.getRandEdge.bind(graph));
        }
        if (group) group.add(blip);
        //console.log("blip: " + blip);
        this.blips.push(blip);
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
        /*
        this.addBlip(300+32*1, 300+32*9, "ltbs");
        this.addBlip(300+32*2, 300+32*9, "ltbi");
        this.addBlip(300+32*3, 300+32*9, "bi");
        this.addBlip(300+32*4, 300+32*9, "btlsi");
        this.addBlip(300+32*5, 300+32*9, "btli");
        this.addBlip(300+32, 300+32*10, "ltb");
        this.addBlip(300+32*2, 300+32*10, "ltbe");
        this.addBlip(300+32*3, 300+32*10, "b");
        this.addBlip(300+32*4, 300+32*10, "btls");
        this.addBlip(300+32*5, 300+32*10, "btl");
        this.addBlip(300+32*4, 300+32*11, "obtl");
        this.addBlip(300+32*5, 300+32*11, "btle");
        this.addBlip(300+32*5, 300+32*12, "l");
        this.addBlip(300+32*5, 300+32*13, "ltbs");
        this.addBlip(300+32*6, 300+32*13, "ltbi");
        this.addBlip(300+32*7, 300+32*13, "bi");
        this.addBlip(300+32*8, 300+32*13, "bi");
        this.addBlip(300+32*9, 300+32*13, "btri");
        this.addBlip(300+32*10, 300+32*13, "btre");
        this.addBlip(300+32*5, 300+32*14, "ltb");
        this.addBlip(300+32*6, 300+32*14, "ltbe");
        this.addBlip(300+32*7, 300+32*14, "b");
        this.addBlip(300+32*8, 300+32*14, "b");
        this.addBlip(300+32*9, 300+32*14, "btrs");
        this.addBlip(300+32*10, 300+32*14, "btr");
        */

        this.addBlip(300+32*10, 300+32*12, "r");
        this.addBlip(300+32*10, 300+32*11, "rtbs");
        /*
        this.addBlip(300+32*11, 300+32*11, "ortb");
        */

        console.log("gb.graphs.length: " + this.gb.graphs.length);

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

        for (let i=0; i<this.blips.length; i++) {
            this.blips[i].update(delta_time);
            this.blips[i].draw();
        }

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