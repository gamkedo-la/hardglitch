export { sides, WallModel };

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
        return "ModelFace[" + this.vertices.toString() + "]";
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
        return "ModelEdge[" + this.vertices.toString() + "]";
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
                if (verts[i].side&mask) {
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
            {x:offset, y:15+offset, side:sides.bl|sides.outer, corner:sides.bl|sides.outer}, 
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
            {x:offset,  y:0}, 
            {x:offset+width, y:0, side:sides.right|sides.inner}, 
        ];
        if (offset+width > 16) {
            vmap["ltts"].push({x:offset+width, y:32});
        } else {
            vmap["ltts"].push({x:offset+width, y:16+width+offset, side:sides.fr|sides.inner, corner:sides.fr|sides.inner})
        }
        if ((offset+width)>=8 && offset+width < 16) {
            vmap["ltts"].push({x:offset*2, y:32, side:sides.fr});
        } else if (offset+width<8) {
            vmap["ltts"].push({x:0, y:16+(offset+width)*2, side:sides.fr});
        }
        if (offset<8 && offset+width>8) {
            vmap["ltts"].push({x:0, y:32});
        }
        if (offset>0) {
            vmap["ltts"].push({x:0, y:16+offset*2, side:sides.bl|sides.outer});
        }
        vmap["ltts"].push({x:offset, y:16+offset, side:sides.l|sides.outer, corner:sides.l|sides.outer});

        // --- LTT ---
        if (offset + width > 16) {
            vmap["ltt"] = [
                {x:0,  y:0}, 
                {x:offset+width, y:0}, 
                {x:offset+width, y:(offset+width)-16, side:"front", corner:true},
                {x:(offset+width)-16, y:offset+width, side:"front", corner:true},
                {x:0, y:offset+width}, 
            ];
        } else if (offset+width > 8) {
            vmap["ltt"] = [
                {x:0,  y:0}, 
                {x:(offset+width)*2-16, y:0, side:"front", corner:(offset+width===16)}, 
                {x:0, y:(offset+width)*2-16, side:"front", corner:(offset+width===16)}, 
            ];
        }

        // --- OLTT ---
        if (offset<8) {
            vmap["oltt"] = [
                {x:16+offset*2,  y:32, side:"back", corner:(offset==0)}, 
                {x:32,  y:16+offset*2, side:"front", corner:(offset==0)}, 
            ];
            if (width+offset >= 8) {
                vmap["oltt"].push({x:32, y:32});
            } else {
                vmap["oltt"].push(...[
                    {x:32, y:16+(offset+width)*2, side:"front"},
                    {x:16+(offset+width)*2, side:"front", y:32},
                ])
            }
        }

        // --- LTTE ---
        vmap["ltte"] = [
            {y:offset,  x:0}, 
            {y:offset+width, x:0}, 
        ];
        // lower right corner or intersection of right edge w/ bottom
        if (offset+width > 16) {
            vmap["ltte"].push({y:offset+width, x:32});
        } else {
            vmap["ltte"].push({y:offset+width, x:16+width+offset, side:"front", corner:true})
        }
        // intersection of front angled edge w/ bottom
        if ((offset+width)>=8 && offset+width < 16) {
            vmap["ltte"].push({y:offset*2, x:32, side:"front"});
        // intersection of front angled edge w/ left
        } else if (offset+width<8) {
            vmap["ltte"].push({y:0, x:16+(offset+width)*2, side:"front"});
        }
        // interior lower-left grid corner
        if (offset<8 && offset+width>8) {
            vmap["ltte"].push({y:0, x:32});
        }
        // intersection of back angled edge w/ left
        if (offset>0) {
            vmap["ltte"].push({y:0, x:16+offset*2, side:"back"});
        }
        // corner of back angled edge to left
        vmap["ltte"].push({y:offset, x:16+offset, side:"back", corner:true});

        // --- LTB ---
        vmap["ltb"] = [ 
            {x:offset, y:0}, 
        ];
        if (offset+width >= 16) {
            vmap["ltb"].push(...[
                {x:offset+width, y:0, side:"back", corner:true}, 
                {x:32, y:32-(offset+width), side:"back", corner:true}, 
            ]);
        } else {
            vmap["ltb"].push(...[
                {x:offset+width, y:0}, 
                {x:offset+width, y:16-(width+offset), side:"back", corner:true}, 
                {x:16+(width+offset), y:32-(width+offset), side:"back", corner:true}, 
                {x:32, y:32-(width+offset), side:"back"}, 
            ]);
        }
        vmap["ltb"].push(...[
            {x:32, y:32-(offset), side:"front"}, 
            {x:16+offset, y:32-(offset), side:"front", corner:true}, 
            {x:offset, y:16-(offset), side:"front", corner:true}, 
        ]);

        // --- B ---
        vmap["b"] = [ 
            {x:0, y:32-(offset+width), side:"back"}, 
            {x:32, y:32-(offset+width), side:"back"}, 
            {x:32, y:32-offset, side:"front"}, 
            {x:0, y:32-offset, side:"front"},
        ];
        vmap["ltbe"] = vmap.b;
        vmap["btrs"] = vmap.b;

        // --- BTLS ---
        vmap["btls"] = [
            {x:0, y:32-(offset+width), side:"back"}, 
        ];
        if (offset+width >= 16) {
            vmap["btls"].push({x:32, y:32-(offset+width), side:"back", corner: (offset+width === 16)});
            vmap["btls"].push({x:32, y:32});
        } else if (offset+width >= 8) {
            vmap["btls"].push({x:16+(offset+width), y:32-(offset+width), side:"back", corner:true});
            vmap["btls"].push({x:32, y:48-(offset+width)*2, side:"back"});
            if (offset+width > 8) {
                vmap["btls"].push({x:32, y:32});
            }
        } else {
            vmap["btls"].push({x:16+(offset+width), y:32-(offset+width), side:"back", corner:true});
            vmap["btls"].push({x:16+(offset+width)*2, y:32, side:"back"});
        }
        if (offset>0) {
            vmap["btls"].push({x:16+offset*2, y:32, side:"front"});
        }
        vmap["btls"].push({x:16+offset, y:32-offset, side:"front", corner:true});
        vmap["btls"].push({x:0, y:32-offset, side:"front"});

        // --- BTL ---
        if (offset + width > 16) {
            vmap["btl"] = [
                {x:0,  y:32-(offset+width), side:"back"}, 
                {x:(offset+width)-16,  y:32-(offset+width), side:"back", corner:true}, 
                {x:offset+width,  y:32-((offset+width)-16), side:"back", corner:true}, 
                {x:offset+width,  y:32}, 
                {x:0,  y:32}, 
            ];
        } else if (offset+width > 8) {
            vmap["btl"] = [
                {x:0,  y:48-2*(offset+width), side:"back", corner:(offset+width===16)}, 
                {x:(offset+width)*2-16, y:32, side:"back", corner:(offset+width===16)}, 
                {x:0, y:32}, 
            ];
        }

        // --- OBTL ---
        if (offset<8) {
            vmap["obtl"] = [
                {x:16+offset*2,  y:0, side:"front", corner:(offset==0)}, 
            ];
            if (width+offset >= 8) {
                vmap["obtl"].push({x:32, y:0});
            } else {
                vmap["obtl"].push({x:16+(offset+width)*2, y:0, side:"back"});
                vmap["obtl"].push({x:32, y:32-(16+(offset+width)*2), side:"back"});
            }
            vmap["obtl"].push({x:32, y:32-(16+(offset)*2), side:"front"});
        }

        // --- BTLE ---
        if (offset+width>=16) {
            vmap["btle"] = [
                {x:0, y:0}, 
                {x:offset+width, y:0, side:(offset+width === 16) ? "back" : "", corner:(offset+width === 16)}, 
            ];
        } else if (offset+width>=8) {
            vmap["btle"] = [
                {x:0, y:0}, 
                {x:(offset+width)*2-16, y:0, side:"back"}, 
                {x:(offset+width), y:16-(offset+width), side:"back", corner:true}, 
            ];
        } else {
            vmap["btle"] = [
                {x:0, y:16-(offset+width)*2, side:"back"}, 
                {x:(offset+width), y:16-(offset+width), side:"back", corner:true}, 
            ];
        }
        vmap["btle"].push({x:offset+width, y:32});
        vmap["btle"].push({x:offset, y:32});
        vmap["btle"].push({x:offset, y:16-offset, side:"front", corner:true});
        if (offset > 0) {
            vmap["btle"].push({x:0, y:16-offset*2});
        }

        // --- BTR ---
        if (width+offset >= 16) {
            vmap["btr"] = [
                {x:0, y:32-(width+offset), side:"back", corner:(width+offset===16)},
                {x:32-(width+offset), y:0, side:"back", corner:(width+offset===16)},
            ];
        } else {
            vmap["btr"] = [
                {x:0, y:32-(width+offset), side:"back"},
                {x:16-(width+offset), y:32-(width+offset), side:"back", corner:true},
                {x:32-(width+offset), y:16-(width+offset), side:"back", corner:true},
                {x:32-(width+offset), y:0},
            ];
        }
        vmap["btr"].push(...[
            {x:32-offset, y:0},
            {x:32-offset, y:16-offset, side:"front", corner:true},
            {x:16-offset, y:32-offset, side:"front", corner:true},
            {x:0, y:32-offset, side:"front"},
        ]);

        // --- R ---
        vmap["r"] = [ 
            {x:32-(offset+width), y:0}, 
            {x:32-offset, y:0}, 
            {x:32-offset, y:32}, 
            {x:32-(offset+width), y:32}, 
        ];
        vmap["btre"] = vmap.r;
        vmap["rtts"] = vmap.r;

        // --- RTBS ---
        vmap["rtbs"] = [
            {x:32-offset,y:32},
            {x:32-(offset+width),y:32},
        ];
        if (offset+width>=16) {
            vmap["rtbs"].push({x:32-(offset+width),y:0, side:(offset+width)===16?"back":"", corner:(offset+width)===16});
            vmap["rtbs"].push({x:32,y:0});
        } else if (offset+width>=8) {
            vmap["rtbs"].push({x:32-(offset+width), y:16-(offset+width), side:"back", corner:true});
            vmap["rtbs"].push({x:48-2*(offset+width), y:0, side:"back"});
            vmap["rtbs"].push({x:32,y:0});
        } else {
            vmap["rtbs"].push({x:32-(offset+width),y:16-(offset+width), side:"back", corner:true});
            vmap["rtbs"].push({x:32, y:16-(offset+width)*2, side:"back"});
        }
        vmap["rtbs"].push({x:32, y:16-offset*2, side:"front", corner:(offset == 0)});
        if (offset>0) {
            vmap["rtbs"].push({x:32-offset, y:16-(offset), side:"front", corner:true});
        }

        // --- RTB ---
        if (offset + width > 16) {
            vmap["rtb"] = [
                {x:32-(offset+width),  y:32, side:"back"}, 
                {x:32-(offset+width),  y:48-(offset+width), side:"back", corner:true}, 
                {x:48-(offset+width),  y:32-(offset+width), side:"back", corner:true}, 
                {x:32,  y:32-(offset+width)}, 
                {x:32,  y:32}, 
            ];
        } else if (offset+width > 8) {
            vmap["rtb"] = [
                {x:48-2*(offset+width), y:32, side:"back", corner:(offset+width===16)}, 
                {x:32, y:48-(offset+width)*2, side:"back", corner:(offset+width===16)}, 
                {x:32, y:32}, 
            ];
        }

        // --- ORTB ---
        if (offset<8) {
            vmap["ortb"] = [
                {x:16-offset*2,  y:0, side:"front", corner:(offset==0)}, 
            ];
            if (width+offset >= 8) {
                vmap["ortb"].push({x:0, y:0});
            } else {
                vmap["ortb"].push({x:16-(offset+width)*2, y:0, side:"back"});
                vmap["ortb"].push({x:0, y:16-(offset+width)*2, side:"back"});
            }
            vmap["ortb"].push({x:0, y:16-(offset)*2, side:"front"});
        }

        // --- RTBE ---
        vmap["rtbe"] = [
            {x:32, y:32-(offset+width), side:"back"}, 
            {x:32, y:32-offset, side:"front"}, 
            {x:16-offset, y:32-offset, side:"front", corner:true}, 
        ];
        if (offset+0) {
            vmap["rtbe"].push({x:16-offset*2, y:32, side:"front"});
        }
        if (offset+width>=16) {
            vmap["rtbe"].push({x:0, y:32});
            vmap["rtbe"].push({x:0, y:32-(offset+width), side:"back", corner:(offset+width)===16});
        } else if (offset+width>=8) {
            vmap["rtbe"].push({x:0, y:32});
            vmap["rtbe"].push({x:0, y:48-2*(offset+width), side:"back"});
            vmap["rtbe"].push({x:16-(offset+width), y:32-(offset+width), side:"back", corner:true});
        } else {
            vmap["rtbe"].push({x:16-(offset+width)*2, y:32, side:"back"});
            vmap["rtbe"].push({x:16-(offset+width), y:32-(offset+width), side:"back", corner:true});
        }

        // --- RTT ---
        vmap["rtt"] = [
            {x:0, y:offset, side:"back"},
            {x:16-offset, y:offset, side:"back", corner:true},
            {x:32-offset, y:16+offset, side:"back", corner:true},
            {x:32-offset, y:32},
        ];

        if (width+offset >= 16) {
            vmap["rtt"].push({x:32-(width+offset), y:32, side:"front", corner:(width+offset===16)});
            vmap["rtt"].push({x:0, y:width+offset, side:"front", corner:(width+offset===16)});
        } else {
            vmap["rtt"].push(...[
                {x:32-(width+offset), y:32},
                {x:32-(width+offset), y:16+(width+offset), side:"front", corner:true},
                {x:16-(width+offset), y:width+offset, side:"front", corner:true},
                {x:0, y:width+offset, side:"front"},
            ]);
        }

        // --- TTRS ---
        vmap["ttrs"] = [
            {x:16-offset, y:offset, back:true, right:true, corner:true}, 
            {x:32, y:offset, back:true}, 
            {x:32, y:offset+width, front:true, inner:true}, 
        ];
        if (offset+width>=16) {
            vmap["ttrs"].push({x:0, y:offset+width, front:true, left:(offset+width)===16, inner:true, corner:(offset+width)===16});
            vmap["ttrs"].push({x:0, y:0});
        } else if (offset+width>=8) {
            vmap["ttrs"].push({x:16-(offset+width), y:offset+width, front:true, left:true, inner:true, corner:true});
            vmap["ttrs"].push({x:0, y:2*(offset+width)-16, front:true, left:true, inner:true});
            vmap["ttrs"].push({x:0, y:0});
        } else {
            vmap["ttrs"].push({x:16-(offset+width), y:offset+width, front:true, left:true, inner:true, corner:true});
            vmap["ttrs"].push({x:16-(offset+width)*2, y:0, front:true, left:true, inner:true});
        }
        if (offset+0) {
            vmap["ttrs"].push({x:16-offset*2, y:0, back:true, right:true});
        }

        // --- TTR ---
        if (offset + width > 16) {
            vmap["ttr"] = [
                {x:32,  y:0}, 
                {x:32,  y:offset+width, front:true, inner:true}, 
                {x:48-(offset+width),  y:offset+width, front:true, left:true, inner:true, corner:true}, 
                {x:32-(offset+width),  y:(offset+width)-16, front:true, left:true, inner:true, corner:true}, 
                {x:32-(offset+width),  y:0, left:true, inner:true, corner:true}, 
            ];
        } else if (offset+width > 8) {
            vmap["ttr"] = [
                {x:32,  y:0}, 
                {x:32, y:(offset+width)*2-16, front:true, left:true, inner:true, corner:(offset+width===16)}, 
                {x:48-2*(offset+width), y:0, front:true, left:true, inner:true, corner:(offset+width===16)}, 
            ];
        }

        // --- OTTR ---
        if (offset<8) {
            vmap["ottr"] = [
                {x:0, y:16+(offset)*2, right:true, back:true, corner:(offset===0)},
                {x:16-offset*2, y:32, right:true, back:true, corner:(offset==0)}, 
            ];
            if (width+offset >= 8) {
                vmap["ottr"].push({x:0, y:32});
            } else {
                vmap["ottr"].push({x:16-(offset+width)*2, y:32, left:true, front:true});
                vmap["ottr"].push({x:0, y:16+(offset+width)*2, left:true, front:true});
            }
        }

        // --- TTRE ---
        vmap["ttre"] = [
            {x:32-(offset+width), y:0, left:true, inner:true}, 
            {x:32-offset, y:0, right:true}, 
            {x:32-offset, y:16+offset, right:true, back:true, corner:true}, 
        ];
        if (offset+0) {
            vmap["ttre"].push({x:32, y:16+offset*2, back:true, right:true});
        }
        if (offset+width>=16) {
            vmap["ttre"].push({x:32, y:32});
            vmap["ttre"].push({x:32-(offset+width), y:32, front:(offset+width===16), left:true, inner:true, corner:(offset+width===16)});
        } else if (offset+width>=8) {
            vmap["ttre"].push({x:32, y:32});
            vmap["ttre"].push({x:48-2*(offset+width), y:32, front:true, left:true, inner:true});
            vmap["ttre"].push({x:32-(offset+width), y: 16+(offset+width), front:true, left:true, inner:true, corner:true});
        } else {
            vmap["ttre"].push({x:32, y:16+(offset+width)*2, front:true, left:true, inner:true});
            vmap["ttre"].push({x:32-(offset+width), y: 16+(offset+width), front:true, left:true, inner:true, corner:true});
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