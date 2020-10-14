import * as debug from "../system/debug.js";
import { Color } from "../system/color.js";
import { ofmt, random_int } from "../system/utility.js";
import { ParticleGroup } from "../system/particles.js";
import { sides } from "./wall-model.js";
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
            debug.log("vert not found: " + ofmt(v));
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
    constructor(width, model) {
        super(width);
        this.model = model;
    }

    addTile(x,y,id) {
        let verts = [];
        // pull edges
        let pos = {x:x, y:y};
        // all top
        for (const edge of this.model.getEdges(pos, id, sides.top|sides.allAround)) {
            this.addEdge(edge.vertices[0], edge.vertices[1]);
            verts.push(edge.vertices[0], edge.vertices[1]);
        }
        // front vertical
        for (const edge of this.model.getEdges(pos, id, sides.vertical|sides.allFront|sides.left, sides.outer)) {
            this.addEdge(edge.vertices[0], edge.vertices[1]);
            verts.push(edge.vertices[0], edge.vertices[1]);
        }
        // front bottom
        for (const edge of this.model.getEdges(pos, id, sides.bottom|sides.allFront, sides.outer)) {
            this.addEdge(edge.vertices[0], edge.vertices[1]);
            verts.push(edge.vertices[0], edge.vertices[1]);
        }
        return verts;
    }

}
