import { Color } from "../system/color.js";
import { ofmt, random_int } from "../system/utility.js";
import { ParticleGroup } from "../system/particles.js";

export { Graph, TileGraphBuilder }

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
        }
        if (-1 == vert2.e.indexOf(k1)) {
            vert2.e.push(k1);
        }
    }

    getVert(v) {
        let key = this.vertKey(v);
        return this.verts.get(key);
    }

    merge(other) {
        for (const key of other.verts.keys()) {
            let vert = other.verts.get(key);
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
        if (!vert) {
            console.log("vert not found: " + ofmt(v));
            return undefined;
        }
        // randomly choose new edge (exclude lastv if given)
        if (lastv && vert.e.length != 1) {
            let lastvk = this.vertKey(lastv);
            let lastidx = vert.e.indexOf(lastvk);
            if (-1 != lastidx) {
                let idx = random_int(0, vert.e.length-2);
                if (idx >= lastidx) idx++;
                let vert2 = this.verts.get(vert.e[idx]);
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
                if (-1 == visited.indexOf(ek)) {
                    let vert2 = this.verts.get(ek);
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

    mergeGraphs(g1, g2) {
        // merge graphs
        g1.merge(g2);
        // merge groups and reset group membership
        let group1 = this.getGroup(g1);
        let group2 = this.getGroup(g2);
        for (const obj of group2) {
            obj.group = group1;
            group1.add(obj);
        }
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
                this.mergeGraphs(g1, g2);
                //g1.merge(g2);
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
        "ltbsc": [
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
        "btrec": [
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
        "rtts": [
            {x:16,y:0}, {x:16,y:32}, 
            {x:31,y:0}, {x:31,y:32}, 
        ],
        "rtt": [
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
        "rtb": [
            {x:16,y:0}, {x:16,y:32}, 
            {x:31,y:15}, {x:31,y:32}, 
        ],
        "rtbi": [
            {x:16,y:32}, {x:32,y:16}, 
        ],
        "rtbe": [
            {x:-1,y:15}, {x:15,y:0}, 
            {x:15,y:31}, {x:31,y:31}, 
            {x:15,y:31}, {x:15,y:0}, 
            {x:15,y:0}, {x:31,y:0}, 
        ],
        "rtbei": [
            {x:0,y:16}, {x:31,y:16}, 
        ],
        "ortt": [
            {x:0,y:15}, {x:16,y:32}, 
            {x:0,y:0}, {x:15,y:0}, 
            {x:15,y:0}, {x:31,y:16}, 
            {x:31,y:16}, {x:31,y:32}, 
        ],
        "ot": [
            {x:0,y:15}, {x:32,y:15}, 
            {x:0,y:0}, {x:32,y:0}, 
        ],
        "ottr": [
            {x:0,y:15}, {x:32,y:15}, 
            {x:15,y:0}, {x:32,y:0}, 
        ],
        "ottre": [
            {x:-1,y:16}, {x:15,y:32}, 
        ],
        "ttre": [
            {x:16,y:0}, {x:32,y:15}, 
        ],
        "ttri": [
            {x:16,y:0}, {x:16,y:32}, 
            {x:31,y:0}, {x:31,y:16}, 
        ],
        "ottl": [
            {x:0,y:32}, {x:0,y:15}, 
            {x:0,y:15}, {x:15,y:0}, 
            {x:15,y:0}, {x:32,y:0}, 
            {x:15,y:32}, {x:32,y:15}, 
        ],
        "ttl": [
            {x:0,y:0}, {x:0,y:32}, 
            {x:15,y:0}, {x:15,y:32}, 
        ],
        "ttle": [
            {x:0,y:0}, {x:0,y:32}, 
            {x:15,y:0}, {x:15,y:32}, 
        ],
        "ltti": [
            {x:0,y:0}, {x:0,y:16}, 
            {x:15,y:0}, {x:15,y:32}, 
        ],
        "ltts": [
            {x:15,y:0}, {x:0,y:15}, 
        ],
        "oltts": [
            {x:32,y:16}, {x:16,y:32}, 
        ],
        "oltt": [
            {x:0,y:0}, {x:16,y:0}, 
            {x:0,y:15}, {x:32,y:15}, 
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
