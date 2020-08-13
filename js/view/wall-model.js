export { sides, WallModel };

import { ofmt } from "../system/utility.js";

const sides = {
    front:      1,
    back:       1<<1,
    left:       1<<2,
    right:      1<<3,
    fl:         1<<4,
    fr:         1<<5,
    bl:         1<<6,
    br:         1<<7,
    top:        1<<8,
    bottom:     1<<9,
    vertical:   1<<10,
    inner:      1<<11,
    outer:      1<<12,
};

class ModelFace {
    constructor(...vertices) {
        this.vertices = vertices;
    }

    toPath() {
        let path = new Path2D();
        path.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i=1; i<this.vertices.length; i++) {
            path.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        path.closePath();
        return path;
    }

    toString() {
        return "ModelFace[" + this.vertices.map(ofmt) + "]";
    }
}

class ModelEdge {
    constructor(v1, v2) {
        this.vertices = [v1, v2];
    }

    toPath() {
        let path = new Path2D();
        path.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i=1; i<this.vertices.length; i++) {
            path.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        path.closePath();
        return path;
    }

    toString() {
        return "ModelEdge[" + this.vertices.map(ofmt) + "]";
    }
}

class ModelEdges {
    constructor(...edges) {
        this.edges = edges;
    }

    toPath() {
        let path = new Path2D();
        for (let i=0; i<this.edges.length; i++) {
            path.moveTo(this.edges[i].vertices[0].x, this.edges[i].vertices[0].y);
            path.lineTo(this.edges[i].vertices[1].x, this.edges[i].vertices[1].y);
        }
        path.closePath();
        return path;
    }

    push(edge) {
        if (edge) {
            if (edge instanceof ModelEdges) {
                this.edges = this.edges.concat(edge.edges);
            } else {
                this.edges.push(edge);
            }
        }
    }

    toString() {
        return "ModelEdges[" + this.edges.toString() + "]";
    }
}

class WallModel {

    constructor(width, height, offset=0) {
        this.width = width;
        this.offset = offset;
        this.height = height;
        // build the model
        this.build(width, offset);
    }

    _bottomFace(pos, id) {
        let verts = this.vertexMap[id];
        if (!verts) return undefined;
        let fv = [];
        // translate verts to position
        for (let i=0; i<verts.length; i++) {
            fv.push({x:pos.x+verts[i].x, y:pos.y+verts[i].y});
        }
        // return face
        return new ModelFace(...fv);
    }

    _bottomEdges(pos, id, mask) {
        let verts = this.vertexMap[id];
        let edges = new ModelEdges();
        if (verts) {
            let vlen = verts.length;
            // filter and translate verts to position
            for (let i=0; i<verts.length; i++) {
                if (!(verts[i].side & mask)) continue;
                edges.push(new ModelEdge(
                    {x:pos.x+verts[i].x, y:pos.y+verts[i].y}, 
                    {x:pos.x+verts[(i+1)%vlen].x, y:pos.y+verts[(i+1)%vlen].y}, 
                ));
            }
        }
        return edges;
    }

    _topFace(pos, id) {
        let verts = this.vertexMap[id];
        if (!verts) return undefined;
        let fv = [];
        // translate verts to position adjusted for height
        for (let i=0; i<verts.length; i++) {
            fv.push({x:pos.x+verts[i].x, y:pos.y+verts[i].y-this.height});
        }
        // return face
        return new ModelFace(...fv);
    }

    _topEdges(pos, id, mask) {
        let verts = this.vertexMap[id];
        let edges = new ModelEdges();
        if (verts) {
            let vlen = verts.length;
            // filter and translate verts to position
            for (let i=0; i<verts.length; i++) {
                if (!(verts[i].side & mask)) continue;
                edges.push(new ModelEdge(
                    {x:pos.x+verts[i].x, y:pos.y+verts[i].y-this.height}, 
                    {x:pos.x+verts[(i+1)%vlen].x, y:pos.y+verts[(i+1)%vlen].y-this.height}, 
                ));
            }
        }
        return edges;
    }

    _otherFaces(pos, id, mask) {
        let faces = [];
        let verts = this.vertexMap[id];
        if (!verts) return faces;
        let vlen = verts.length;
        // iterate around vertices of bottom face
        for (let i=0; i<verts.length; i++) {
            if (verts[i].side&mask) {
                let fv = [
                    {x:pos.x+verts[i].x, y:pos.y+verts[i].y},
                    {x:pos.x+verts[(i+1)%vlen].x, y:pos.y+verts[(i+1)%vlen].y},
                    {x:pos.x+verts[(i+1)%vlen].x, y:pos.y+verts[(i+1)%vlen].y-this.height},
                    {x:pos.x+verts[i].x, y:pos.y+verts[i].y-this.height},
                ];
                faces.push(new ModelFace(...fv));
            }
        }
        return faces;
    }

    _otherEdges(pos, id, mask) {
        let edges = new ModelEdges();
        let verts = this.vertexMap[id];
        if (verts) {
            // iterate around vertices of bottom face
            for (let i=0; i<verts.length; i++) {
                if (verts[i].corner&mask) {
                    edges.push(new ModelEdge(
                        {x:pos.x+verts[i].x, y:pos.y+verts[i].y}, 
                        {x:pos.x+verts[i].x, y:pos.y+verts[i].y-this.height}, 
                    ));
                }
            }
        }
        return edges;
    }

    getFaces(pos, id, mask) {
        let faces = [];
        // faces are added to list starting with bottom, then middle, then top
        if (mask&sides.bottom) {
            let face = this._bottomFace(pos,id);
            if (face) faces.push(face);
        }
        if (mask) {
            faces = faces.concat(this._otherFaces(pos, id, mask));
        }
        if (mask&sides.top) {
            let face = this._topFace(pos,id);
            if (face) faces.push(face);
        }
        return faces;
    }

    getEdges(pos, id, mask) {
        let edges = new ModelEdges();
        // edges are added to list starting with bottom, then middle, then top
        if (mask&sides.bottom) {
            edges.push(this._bottomEdges(pos, id, mask));
        }
        if (mask&sides.vertical) {
            edges.push(this._otherEdges(pos, id, mask));
        }
        if (mask&sides.top) {
            edges.push(this._topEdges(pos, id, mask));
        }
        return edges;
    }

    build(width, offset=0) {
        this.vertexMap = {};
        let vmap = this.vertexMap;

        // assumptions on vertex data
        // -- base vertex data is for the wall shape as projected on the floor
        // -- all vertices are wound clockwise (as looking down on the floor)
        // -- side markings for left/right, front/back, inner/outer are marked on the leading vertex of the edge
        // -- inner indication follows same logic as side marking
        // -- corners on tile boundaries are owned by the tile that has the corner on the right or bottom edges of the tile
        // -- highlights are built on edges designed w/ side markings (for top/bottom highlights) and corners (for vertical highlights)

        // --- T ---
        vmap["t"] = [ 
            {x:0, y:offset, side:sides.back|sides.outer}, 
            {x:32, y:offset}, 
            {x:32, y:offset+width, side:sides.front|sides.inner}, 
            {x:0, y:offset+width},
        ];
        vmap["ttls"] = vmap.t;
        vmap["rtte"] = vmap.t;

        // --- TTL ---
        vmap["ttl"] = [ 
            {x:offset, y:15+offset, side:sides.br|sides.outer, corner:sides.br|sides.outer}, 
            {x:15+offset, y:offset, side:sides.back|sides.outer, corner:sides.back|sides.outer}, 
            {x:32, y:offset}, 
        ];
        if (offset+width >= 16) {
            vmap["ttl"].push(...[
                {x:32, y:offset+width, side:sides.fr|sides.inner, corner:sides.fr|sides.inner}, 
                {x:offset+width, y:32, corner:sides.right|sides.inner}, 
                {x:offset, y:32, side:sides.left|sides.outer},
            ])
        } else {
            vmap["ttl"].push(...[
                {x:32, y:offset+width, side:sides.front|sides.inner}, 
                {x:16+width+offset, y:offset+width, side:sides.fr|sides.inner, corner:sides.fr|sides.inner},
                {x:offset+width, y:16+width+offset, side:sides.right|sides.inner, corner:sides.right|sides.inner},
                {x:offset+width, y:32},
                {x:offset, y:32, side:sides.left|sides.outer},
            ])
        }

        // --- L ---
        vmap["l"] = [ 
            {x:offset, y:0}, 
            {x:offset+width, y:0, side:sides.right|sides.inner}, 
            {x:offset+width, y:32}, 
            {x:offset, y:32, side:sides.left|sides.outer}, 
        ];
        vmap["ttle"] = vmap.l;
        vmap["ltbs"] = vmap.l;

        // --- LTTS ---
        vmap["ltts"] = [
            {x:offset, y:16+offset, side:sides.left|sides.outer, corner:(offset>0)?(sides.left|sides.outer):0},
            {x:offset,  y:0}, 
            {x:offset+width, y:0, side:sides.right|sides.inner}, 
        ];
        if (offset+width >= 16) {
            vmap["ltts"].push({x:offset+width, y:32, corner:(offset+width===16)?sides.fr|sides.inner:0});
            vmap["ltts"].push({x:0, y:32});
        } else if (offset+width>=8) {
            vmap["ltts"].push({x:offset+width, y:16+width+offset, side:sides.fr|sides.inner, corner:sides.fr|sides.inner})
            vmap["ltts"].push({x:offset*2, y:32});
            vmap["ltts"].push({x:0, y:32});
        } else {
            vmap["ltts"].push({x:offset+width, y:16+width+offset, side:sides.fr|sides.inner, corner:sides.fr|sides.inner})
            vmap["ltts"].push({x:0, y:16+(offset+width)*2});
        }
        if (offset>0) {
            vmap["ltts"].push({x:0, y:16+offset*2, side:sides.br|sides.outer});
        }

        // --- LTT ---
        if (offset + width > 16) {
            vmap["ltt"] = [
                {x:0,  y:0}, 
                {x:offset+width, y:0, side:sides.right|sides.inner}, 
                {x:offset+width, y:(offset+width)-16, side:sides.fr|sides.inner, corner:sides.fr|sides.inner},
                {x:(offset+width)-16, y:offset+width, side:sides.front|sides.inner, corner:sides.front|sides.inner},
                {x:0, y:offset+width}, 
            ];
        } else if (offset+width > 8) {
            vmap["ltt"] = [
                {x:0,  y:0}, 
                {x:(offset+width)*2-16, y:0, side:sides.fr|sides.inner}, 
                {x:0, y:(offset+width)*2-16}, 
            ];
        }

        // --- OLTT ---
        if (offset<8) {
            vmap["oltt"] = [
                {x:16+offset*2,  y:32, side:sides.br|sides.outer, corner:(offset===0)?sides.br|sides.outer:0}, 
                {x:32,  y:16+offset*2, corner:(offset==0)?sides.br|sides.outer:0}, 
            ];
            if (width+offset >= 8) {
                vmap["oltt"].push({x:32, y:32});
            } else {
                vmap["oltt"].push(...[
                    {x:32, y:16+(offset+width)*2, side:sides.fr|sides.inner},
                    {x:16+(offset+width)*2, y:32},
                ])
            }
        }

        // --- LTTE ---
        vmap["ltte"] = [
            {x:0, y:offset+width}, 
            {x:0, y:offset, side:sides.back|sides.outer}, 
            {x:16+offset, y:offset, side:(offset)?sides.br|sides.outer:0, corner:(offset)?(sides.br|sides.outer):0},
        ];
        if (offset>0) {
            vmap["ltte"].push({x:16+offset*2, y:0});
        }
        if (offset+width >= 16) {
            vmap["ltte"].push({x:32, y:0});
            vmap["ltte"].push({x:32, y:offset+width, side:sides.front|sides.inner, corner:(offset+width===16)?sides.front|sides.inner:0});
        } else if (offset+width>=8) {
            vmap["ltte"].push({x:32, y:0});
            vmap["ltte"].push({x:32, y:offset*2, side:sides.fr|sides.inner});
            vmap["ltte"].push({x:16+width+offset, y:offset+width, side:sides.front|sides.inner, corner:sides.front|sides.inner})
        } else {
            vmap["ltte"].push({x:16+(offset+width)*2, y:0, side:sides.fr|sides.inner});
            vmap["ltte"].push({x:16+width+offset, y:offset+width, side:sides.front|sides.inner, corner:sides.front|sides.inner})
        }

        // --- LTB ---
        vmap["ltb"] = [ 
            {x:32, y:32-(offset), side:sides.front|sides.outer}, 
            {x:16+offset, y:32-(offset), side:sides.fl|sides.outer, corner:sides.fl|sides.outer}, 
            {x:offset, y:16-(offset), side:sides.left|sides.outer, corner:(offset)?sides.left|sides.outer:0}, 
            {x:offset, y:0}, 
        ];
        if (offset+width >= 16) {
            vmap["ltb"].push(...[
                {x:offset+width, y:0, side:sides.bl|sides.inner}, 
                {x:32, y:32-(offset+width), corner:sides.bl|sides.inner}, 
            ]);
        } else {
            vmap["ltb"].push(...[
                {x:offset+width, y:0, side:sides.right|sides.inner}, 
                {x:offset+width, y:16-(width+offset), side:sides.bl|sides.inner, corner:sides.bl|sides.inner}, 
                {x:16+(width+offset), y:32-(width+offset), side:sides.back|sides.inner, corner:sides.back|sides.inner}, 
                {x:32, y:32-(width+offset), side:"back"}, 
            ]);
        }

        // --- B ---
        vmap["b"] = [ 
            {x:0, y:32-(offset+width), side:sides.back|sides.inner}, 
            {x:32, y:32-(offset+width)}, 
            {x:32, y:32-offset, side:sides.front|sides.outer}, 
            {x:0, y:32-offset},
        ];
        vmap["ltbe"] = vmap.b;
        vmap["btrs"] = vmap.b;

        // --- BTLS ---
        vmap["btls"] = [
            {x:16+offset, y:32-offset, side:sides.front|sides.outer, corner:sides.front|sides.outer},
            {x:0, y:32-offset},
            {x:0, y:32-(offset+width), side:sides.back|sides.inner}, 
        ];
        if (offset+width >= 16) {
            vmap["btls"].push({x:32, y:32-(offset+width), corner: (offset+width===16)?sides.back|sides.outer:0});
            vmap["btls"].push({x:32, y:32});
        } else if (offset+width >= 8) {
            vmap["btls"].push({x:16+(offset+width), y:32-(offset+width), side:sides.bl|sides.inner, corner:sides.bl|sides.inner});
            vmap["btls"].push({x:32, y:48-(offset+width)*2});
            vmap["btls"].push({x:32, y:32});
        } else {
            vmap["btls"].push({x:16+(offset+width), y:32-(offset+width), side:sides.bl|sides.inner, corner:sides.bl|sides.inner});
            vmap["btls"].push({x:16+(offset+width)*2, y:32});
        }
        if (offset>0) {
            vmap["btls"].push({x:16+offset*2, y:32, side:sides.fl|sides.outer});
        }

        // --- BTL ---
        if (offset + width > 16) {
            vmap["btl"] = [
                {x:0,  y:32-(offset+width), side:sides.back|sides.inner}, 
                {x:(offset+width)-16,  y:32-(offset+width), side:sides.bl|sides.inner, corner:sides.bl|sides.inner}, 
                {x:offset+width,  y:32-((offset+width)-16), side:sides.right|sides.inner, corner:sides.right|sides.inner},
                {x:offset+width,  y:32}, 
                {x:0,  y:32}, 
            ];
        } else if (offset+width > 8) {
            vmap["btl"] = [
                {x:0,  y:48-2*(offset+width), side:sides.bl|sides.inner}, 
                {x:(offset+width)*2-16, y:32, corner:(offset+width===16)?sides.bl|sides.inner:0}, 
                {x:0, y:32}, 
            ];
        }

        // --- OBTL ---
        if (offset<8) {
            vmap["obtl"] = [
                {x:32, y:32-(16+(offset)*2), side:sides.fl|sides.outer, corner:(offset==0)?sides.fl|sides.outer:0},
                {x:16+offset*2, y:0}, 
            ];
            if (width+offset >= 8) {
                vmap["obtl"].push({x:32, y:0});
            } else {
                vmap["obtl"].push({x:16+(offset+width)*2, y:0, side:sides.bl|sides.inner});
                vmap["obtl"].push({x:32, y:32-(16+(offset+width)*2)});
            }
        }

        // --- BTLE ---
        vmap["btle"] = [
            {x:offset+width, y:32},
            {x:offset, y:32, side:sides.left|sides.outer},
            {x:offset, y:16-offset, side:(offset)?sides.fl|sides.outer:0, corner:(offset)?sides.fl|sides.outer:0},
        ];
        if (offset > 0) {
            vmap["btle"].push({x:0, y:16-offset*2});
        }
        if (offset+width>=16) {
            vmap["btle"].push({x:0, y:0}); 
            vmap["btle"].push({x:offset+width, y:0, side:sides.right|sides.inner});
        } else if (offset+width>=8) {
            vmap["btle"].push({x:0, y:0});
            vmap["btle"].push({x:(offset+width)*2-16, y:0, side:sides.bl|sides.inner});
            vmap["btle"].push({x:(offset+width), y:16-(offset+width), side:sides.right|sides.inner, corner:sides.right|sides.inner});
        } else {
            vmap["btle"].push({x:0, y:16-(offset+width)*2, side:sides.bl|sides.inner});
            vmap["btle"].push({x:(offset+width), y:16-(offset+width), side:sides.right|sides.inner, corner:sides.right|sides.inner});
        }

        // --- BTR ---
        vmap["btr"] = [
            {x:32-offset, y:0, side:sides.right|sides.outer},
            {x:32-offset, y:16-offset, side:sides.fr|sides.outer, corner:sides.fr|sides.outer},
            {x:16-offset, y:32-offset, side:sides.front|sides.outer, corner:sides.front|sides.outer},
            {x:0, y:32-offset},
        ];
        if (width+offset >= 16) {
            vmap["btr"].push(...[
                {x:0, y:32-(width+offset), side:sides.br|sides.inner},
                {x:32-(width+offset), y:0},
            ]);
        } else {
            vmap["btr"].push(...[
                {x:0, y:32-(width+offset), side:sides.back|sides.inner},
                {x:16-(width+offset), y:32-(width+offset), side:sides.br|sides.inner, corner:sides.br|sides.inner},
                {x:32-(width+offset), y:16-(width+offset), side:sides.left|sides.inner, corner:sides.left|sides.inner},
                {x:32-(width+offset), y:0},
            ]);
        }

        // --- R ---
        vmap["r"] = [ 
            {x:32-(offset+width), y:0}, 
            {x:32-offset, y:0, side:sides.right|sides.outer}, 
            {x:32-offset, y:32}, 
            {x:32-(offset+width), y:32, side:sides.left|sides.inner}, 
        ];
        vmap["btre"] = vmap.r;
        vmap["rtts"] = vmap.r;

        // --- RTBS ---
        vmap["rtbs"] = [
            {x:32-offset, y:16-(offset), side:sides.right|sides.outer, corner:sides.right|sides.outer},
            {x:32-offset,y:32},
            {x:32-(offset+width),y:32, side:sides.left|sides.inner},
        ];
        if (offset+width>=16) {
            vmap["rtbs"].push({x:32-(offset+width),y:0});
            vmap["rtbs"].push({x:32,y:0});
        } else if (offset+width>=8) {
            vmap["rtbs"].push({x:32-(offset+width), y:16-(offset+width), side:sides.br|sides.inner, corner:sides.br|sides.inner});
            vmap["rtbs"].push({x:48-2*(offset+width), y:0});
            vmap["rtbs"].push({x:32,y:0});
        } else {
            vmap["rtbs"].push({x:32-(offset+width),y:16-(offset+width), side:sides.br|sides.inner, corner:sides.br|sides.inner});
            vmap["rtbs"].push({x:32, y:16-(offset+width)*2});
        }
        if (offset>0) {
            vmap["rtbs"].push({x:32, y:16-offset*2, side:sides.fl|sides.outer});
        }

        // --- RTB ---
        if (offset + width > 16) {
            vmap["rtb"] = [
                {x:32-(offset+width),  y:32, side:sides.left|sides.outer}, 
                {x:32-(offset+width),  y:48-(offset+width), side:sides.br|sides.outer, corner:sides.br|sides.outer}, 
                {x:48-(offset+width),  y:32-(offset+width), side:sides.back|sides.outer, corner:sides.back|sides.outer}, 
                {x:32,  y:32-(offset+width)}, 
                {x:32,  y:32}, 
            ];
        } else if (offset+width > 8) {
            vmap["rtb"] = [
                {x:48-2*(offset+width), y:32, side:sides.br|sides.outer, corner:(offset+width===16)?sides.br|sides.outer:0}, 
                {x:32, y:48-(offset+width)*2, corner:(offset+width===16)?sides.bl|sides.outer:0}, 
                {x:32, y:32}, 
            ];
        }

        // --- ORTB ---
        if (offset<8) {
            vmap["ortb"] = [
                {x:0, y:16-(offset)*2, side:sides.fr|sides.inner},
                {x:16-offset*2,  y:0}, 
            ];
            if (width+offset >= 8) {
                vmap["ortb"].push({x:0, y:0});
            } else {
                vmap["ortb"].push({x:16-(offset+width)*2, y:0, side:sides.bl|sides.outer});
                vmap["ortb"].push({x:0, y:16-(offset+width)*2});
            }
        }

        // --- RTBE ---
        vmap["rtbe"] = [
            {x:32, y:32-(offset+width)}, 
            {x:32, y:32-offset, side:sides.front|sides.outer}, 
            {x:16-offset, y:32-offset, side:(offset)?sides.fr|sides.outer:0, corner:sides.fr|sides.outer}, 
        ];
        if (offset>0) {
            vmap["rtbe"].push({x:16-offset*2, y:32});
        }
        if (offset+width>=16) {
            vmap["rtbe"].push({x:0, y:32});
            vmap["rtbe"].push({x:0, y:32-(offset+width), side:sides.back|sides.inner});
        } else if (offset+width>=8) {
            vmap["rtbe"].push({x:0, y:32});
            vmap["rtbe"].push({x:0, y:48-2*(offset+width), side:sides.br|sides.inner});
            vmap["rtbe"].push({x:16-(offset+width), y:32-(offset+width), side:sides.back|sides.inner, corner:sides.back|sides.inner});
        } else {
            vmap["rtbe"].push({x:16-(offset+width)*2, y:32, side:sides.br|sides.inner});
            vmap["rtbe"].push({x:16-(offset+width), y:32-(offset+width), side:sides.back|sides.inner, corner:sides.back|sides.inner});
        }

        // --- RTT ---
        vmap["rtt"] = [
            {x:0, y:offset, side:sides.back|sides.outer},
            {x:16-offset, y:offset, side:sides.bl|sides.outer, corner:sides.bl|sides.outer},
            {x:32-offset, y:16+offset, side:sides.right|sides.outer, corner:sides.right|sides.outer},
            {x:32-offset, y:32},
        ];
        if (width+offset >= 16) {
            vmap["rtt"].push({x:32-(width+offset), y:32, side:sides.fl|sides.inner, corner:(width+offset===16)?sides.fl|sides.inner:0});
            vmap["rtt"].push({x:0, y:width+offset});
        } else {
            vmap["rtt"].push(...[
                {x:32-(width+offset), y:32, side:sides.left|sides.inner},
                {x:32-(width+offset), y:16+(width+offset), side:sides.fl|sides.inner, corner:sides.fl|sides.inner},
                {x:16-(width+offset), y:width+offset, side:sides.front|sides.inner, corner:sides.fl|sides.inner},
                {x:0, y:width+offset},
            ]);
        }

        // --- TTRS ---
        vmap["ttrs"] = [
            {x:16-offset, y:offset, side:sides.back|sides.inner, corner:sides.back|sides.inner}, 
            {x:32, y:offset, back:true}, 
            {x:32, y:offset+width, side:sides.front|sides.outer}, 
        ];
        if (offset+width>=16) {
            vmap["ttrs"].push({x:0, y:offset+width, corner:(offset+width===16)?sides.back|sides.outer:0});
            vmap["ttrs"].push({x:0, y:0});
        } else if (offset+width>=8) {
            vmap["ttrs"].push({x:16-(offset+width), y:offset+width, side:sides.fl|sides.outer, corner:sides.fl|sides.outer});
            vmap["ttrs"].push({x:0, y:2*(offset+width)-16});
            vmap["ttrs"].push({x:0, y:0});
        } else {
            vmap["ttrs"].push({x:16-(offset+width), y:offset+width, side:sides.fl|sides.outer, corner:sides.fl|sides.outer});
            vmap["ttrs"].push({x:16-(offset+width)*2, y:0});
        }
        if (offset>0) {
            vmap["ttrs"].push({x:16-offset*2, y:0, side:sides.bl|sides.inner});
        }

        // --- TTR ---
        if (offset + width > 16) {
            vmap["ttr"] = [
                {x:32,  y:0}, 
                {x:32,  y:offset+width, side:sides.front|sides.outer}, 
                {x:48-(offset+width),  y:offset+width, side:sides.fl|sides.outer, corner:sides.fl|sides.outer}, 
                {x:32-(offset+width),  y:(offset+width)-16, side:sides.left|sides.outer, corner:sides.left|sides.outer}, 
                {x:32-(offset+width),  y:0}, 
            ];
        } else if (offset+width > 8) {
            vmap["ttr"] = [
                {x:32,  y:0}, 
                {x:32, y:(offset+width)*2-16, side:sides.fl|sides.outer, corner:(offset+width===16)?sides.fl|sides.outer:0}, 
                {x:48-2*(offset+width), y:0}, 
            ];
        }

        // --- OTTR ---
        if (offset<8) {
            vmap["ottr"] = [
                {x:0, y:16+(offset)*2, side:sides.bl|sides.inner},
                {x:16-offset*2, y:32, corner:(offset===0)?sides.bl|sides.inner:0}, 
            ];
            if (width+offset >= 8) {
                vmap["ottr"].push({x:0, y:32});
            } else {
                vmap["ottr"].push({x:16-(offset+width)*2, y:32, side:sides.fl|sides.outer});
                vmap["ottr"].push({x:0, y:16+(offset+width)*2});
            }
        }

        // --- TTRE ---
        vmap["ttre"] = [
            {x:32-(offset+width), y:0}, 
            {x:32-offset, y:0, side:sides.right|sides.outer}, 
            {x:32-offset, y:16+offset, side:(offset)?sides.bl|sides.outer:0, corner:sides.bl|sides.outer}, 
        ];
        if (offset>0) {
            vmap["ttre"].push({x:32, y:16+offset*2});
        }
        if (offset+width>=16) {
            vmap["ttre"].push({x:32, y:32});
            vmap["ttre"].push({x:32-(offset+width), y:32, side:sides.left|sides.inner, corner:(offset+width===16)?sides.left|sides.inner:0});
        } else if (offset+width>=8) {
            vmap["ttre"].push({x:32, y:32});
            vmap["ttre"].push({x:48-2*(offset+width), y:32, side:sides.fl|sides.inner});
            vmap["ttre"].push({x:32-(offset+width), y: 16+(offset+width), side:sides.left|sides.inner});
        } else {
            vmap["ttre"].push({x:32, y:16+(offset+width)*2, side:sides.fl|sides.inner});
            vmap["ttre"].push({x:32-(offset+width), y: 16+(offset+width), side:sides.left|sides.inner});
        }

    }
}

const wallFaceMap = {

    "ltb": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:32, y:16}, {x:32, y:31}, {x:15, y:31}, {x:0,  y:16},
        ],
        "backedges": [
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "front": [4,5],
            "top": [1,2, 3,4, 4,5, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "rttc": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:32, y:16}, {x:32, y:31}, {x:15, y:31}, {x:0,  y:16},
        ],
        "backedges": [
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "front": [4,5],
            "top": [1,2, 3,4, 4,5, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "btls": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:47}, {x:16, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "back": [1],
            "front": [2,3],
            "top": [0,1, 2,3, 3,4],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "frontlight"},
            {v1: 3, v2: 4, style: "front"},
        ],
    },

    "btl": {
        "verts": [
            {x:0,  y:16}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "back": [1],
            "top": [0,1],
        },
    },

    "btle": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32}, {x:0, y:15},
        ],
        "hl": {
            "top": [1,2, 3,4],
        },
    },

    "l": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "ttle": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "ltbs": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "btr": {
        "verts": [
            {x:0,  y:16}, {x:15, y:0}, {x:31, y:0}, {x:31, y:16}, {x:16, y:31}, {x:0,  y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "front": [3,4],
            "top": [0,1, 2,3, 3,4, 4,5],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
            {v1: 4, v2: 5, style: "front"},
        ],
    },

    "ttlc": {
        "verts": [
            {x:0,  y:16}, {x:15, y:0}, {x:31, y:0}, {x:31, y:16}, {x:16, y:31}, {x:0,  y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "front": [3,4],
            "top": [0,1, 2,3, 3,4, 4,5],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
            {v1: 4, v2: 5, style: "front"},
        ],
    },

    "rtbs": {
        "verts": [
            {x:16,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:31, y:16}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [3,4, 5,0],
        },
    },

    "rtb": {
        "verts": [
            {x:16,  y:32}, {x:32, y:16}, {x:32, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "top": [0,1],
        },
    },

    "rtbe": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:16, y:31}, {x:0, y:47},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "front": [3],
            "top": [0,1, 2,3, 3,4],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
            {v1: 3, v2: 4, style: "frontdark"},
        ],
    },

    "rtt": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:31, y:15}, {x:31, y:32}, {x:16, y:32}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "top": [0,1, 1,2, 2,3, 4,5],
        },
        "frontedges": [
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "ltbc": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:31, y:15}, {x:31, y:32}, {x:16, y:32}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
            {v1: 1, v2: 2, style: "backdark"},
        ],
        "hl": {
            "back": [1,2],
            "top": [0,1, 1,2, 2,3, 4,5],
        },
        "frontedges": [
            {v1: 4, v2: 5, style: "frontlight"},
        ],
    },

    "ttrs": {
        "verts": [
            {x:0,  y:-15}, {x:15, y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backdark"},
            {v1: 1, v2: 2, style: "back"},
        ],
        "hl": {
            "back": [1],
            "top": [0,1, 1,2, 3,4],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
        ],
    },

    "ttr": {
        "verts": [
            {x:16,  y:0}, {x:32, y:0}, {x:32, y:15},
        ],
        "hl": {
            "back": [],
            "front": [0,2],
            "top": [2,0],
        },
        "frontedges": [
            {v1: 2, v2: 0, style: "frontlight"},
        ],
    },

    "ttre": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:16}, {x:32, y:17}, {x:32, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 5,0],
        },
    },

    "ttl": {
        "verts": [
            {x:0,  y:15}, {x:15, y:0}, {x:32, y:0}, {x:32, y:15}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
            {v1: 1, v2: 2, style: "back"},
        ],
        "hl": {
            "back": [0,1],
            "front": [3],
            "top": [0,1, 1,2, 3,4, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
        ],
    },

    "btrc": {
        "verts": [
            {x:0,  y:15}, {x:15, y:0}, {x:32, y:0}, {x:32, y:15}, {x:15, y:32}, {x:0, y:32},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "backlight"},
            {v1: 1, v2: 2, style: "back"},
        ],
        "hl": {
            "back": [0,1],
            "front": [3],
            "top": [0,1, 1,2, 3,4, 5,0],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "frontdark"},
        ],
    },

    "ltts": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:15, y:32}, {x:0, y:32}, {x:0, y:16},
        ],
        "hl": {
            "top": [1,2, 4,0],
        },
    },

    "ltt": {
        "verts": [
            {x:0,  y:0}, {x:15, y:0}, {x:0, y:15},
        ],
        "hl": {
            "front": [1,2],
            "top": [1,2],
        },
        "frontedges": [
            {v1: 1, v2: 2, style: "frontdark"},
        ],
    },

    "ltte": {
        "verts": [
            {x:0,  y:0}, {x:16, y:0}, {x:32, y:-15}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
            {v1: 1, v2: 2, style: "backlight"},
        ],
        "hl": {
            "back": [1],
            "front": [3],
            "top": [0,1, 1,2, 3,4],
        },
        "frontedges": [
            {v1: 3, v2: 4, style: "front"},
        ],
    },

    "ttls": {
        "verts": [
            {x:0,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "t": {
        "verts": [
            {x:0,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "rtte": {
        "verts": [
            {x:0,  y:0}, {x:32, y:0}, {x:32, y:15}, {x:0, y:15},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "b": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "ltbe": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "btrs": {
        "verts": [
            {x:0,  y:16}, {x:32, y:16}, {x:32, y:31}, {x:0, y:31},
        ],
        "backedges": [
            {v1: 0, v2: 1, style: "back"},
        ],
        "hl": {
            "back": [1],
            "front": [],
            "top": [0,1, 2,3],
        },
        "frontedges": [
            {v1: 2, v2: 3, style: "front"},
        ],
    },

    "r": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "rtts": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

    "btre": {
        "verts": [
            {x:16,  y:0}, {x:31, y:0}, {x:31, y:32}, {x:16, y:32},
        ],
        "hl": {
            "top": [1,2, 3,0],
        },
    },

}