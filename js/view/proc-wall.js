import { Color } from "../system/color.js";
import { ofmt } from "../system/utility.js";
import { WallModel, sides } from "./wall-model.js";
import { defs as tile_defs } from "../definitions-tiles.js";

export { ProcWallSystem, PathShape, ProcWall, ProcWallGenerator, procWallGenSelector }

const generators = {};

class ProcWallSystem {
    constructor() {
        this.items = [];
        this.alwaysActive = false;
        this.checkArea = {
            position: { x: 0, y: 0 },
            width: 64, height: 64 // TODO: find a better way to specify this size
        }
    }

    update(deltaTime) {
    }

    draw(canvas_context, position_predicate = ()=>true) {
        // make sure they don't impact the rest of the drawing code
        canvas_context.save();
        // iterate through tracked items
        for (let i=0; i<this.items.length; i++) {
            const item = this.items[i];
            if (position_predicate(item.position)){
                item.draw(canvas_context);
            }
        }
        canvas_context.restore();
    }

    add(pwall) {
        if (pwall) this.items.push(pwall);
    }

    remove(pwall) {
        let idx = this.items.indexOf(pwall);
        if (idx != -1) this.items.splice(idx, 1);
    }

    reset() {
        this.items = [];
    }
}

class PathShape {
    constructor(path, fill, style, width=1) {
        this.path = path;
        this.fill = fill;
        this.style = style;
        this.width = width;
    }

    draw(ctx) {
        if (this.fill) {
            ctx.fillStyle = this.style;
            ctx.fill(this.path);
        } else {
            ctx.lineWidth = this.width;
            ctx.strokeStyle = this.style;
            ctx.stroke(this.path);
        }
    }
}

class ProcWall {
    constructor(pos, shapes) {
        this.position = pos;
        this.shapes = (shapes) ? shapes : [];
    }

    update(deltaTime) {
    }

    draw(ctx) {
        for (let i=0; i<this.shapes.length; i++) {
            this.shapes[i].draw(ctx);
        }
    }

    toString() {
        return "ProcWall[" + ofmt(this.position) + "]";
    }

}

class ProcWallGenerator {
    constructor(model, colormap, faceMask=sides.top|sides.bottom|sides.allFront|sides.allBack, edgeMask=sides.top|sides.bottom|sides.vertical|sides.allAround) {
        this.model = model;
        this.colormap = colormap;
        this.faceMask = faceMask;
        this.edgeMask = edgeMask;
        this.highlights = {
            major: true,
            minor: false,
            majorWidth: 2,
            minorWidth: 4,
        }
    }

    create(pos, id) {
        let shapes = [];
        let iomask = (sides.inner|sides.outer)&this.edgeMask;
        // bottom faces
        if (this.faceMask & sides.bottom) {
            let color = this.colormap[sides.bottom];
            for (const face of this.model.getFaces(pos, id, sides.bottom)) {
                shapes.push(new PathShape(face.toPath(), true, color));
            }
        }
        // bottom highlights
        if (this.edgeMask & sides.bottom && (this.highlights.major | this.highlights.minor)) {
            let mask = (iomask) ? sides.allAround: sides.allAround&this.edgeMask;
            let edges = this.model.getEdges(pos, id, sides.bottom|mask, iomask);
            if (edges.length) {
                if (this.highlights.major) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlM], this.highlights.majorWidth));
                if (this.highlights.minor) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlm], this.highlights.minorWidth));
            }
        }
        // back faces
        for (const side of [sides.br, sides.back, sides.bl]) {
            let color = this.colormap[side];
            let mask = (iomask) ? side: side&this.faceMask;
            for (const face of this.model.getFaces(pos, id, mask, iomask)) {
                shapes.push(new PathShape(face.toPath(), true, color));
            }
        }
        // back highlights
        if (this.edgeMask & sides.vertical && (this.highlights.major | this.highlights.minor)) {
            let mask = (iomask) ? sides.allBack: sides.allBack&this.edgeMask;
            let edges = this.model.getEdges(pos, id, sides.vertical|mask, iomask);
            if (edges.length) {
                if (this.highlights.major) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlM], this.highlights.majorWidth));
                if (this.highlights.minor) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlm], this.highlights.minorWidth));
            }
        }
        // front faces
        for (const side of [sides.fl, sides.front, sides.fr]) {
            let color = this.colormap[side];
            let mask = (iomask) ? side: side&this.faceMask;
            for (const face of this.model.getFaces(pos, id, mask, iomask)) {
                shapes.push(new PathShape(face.toPath(), true, color));
            }
        }
        // front highlights
        if (this.edgeMask & sides.vertical && (this.highlights.major | this.highlights.minor)) {
            let mask = (iomask) ? sides.allFront: sides.allFront&this.edgeMask;
            let edges = this.model.getEdges(pos, id, sides.vertical|mask, iomask);
            if (edges.length) {
                if (this.highlights.major) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlM], this.highlights.majorWidth));
                if (this.highlights.minor) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlm], this.highlights.minorWidth));
            }
        }
        // top faces
        if (this.faceMask & sides.top) {
            let color = this.colormap[sides.top];
            for (const face of this.model.getFaces(pos, id, sides.top)) {
                shapes.push(new PathShape(face.toPath(), true, color));
            }
        }
        // top highlights
        if (this.edgeMask & sides.top && (this.highlights.major | this.highlights.minor)) {
            let mask = (iomask) ? sides.allAround: sides.allAround&this.edgeMask;
            let edges = this.model.getEdges(pos, id, sides.top|mask, iomask);
            if (edges.length) {
                if (this.highlights.major) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlM], this.highlights.majorWidth));
                if (this.highlights.minor) shapes.push(new PathShape(edges.toPath(), false, this.colormap[sides.hlm], this.highlights.minorWidth));
            }
        }
        return new ProcWall(pos, shapes);
    }

}

function procWallGenSelector(id) {
    if (id in generators) {
        return generators[id];
    }
    // create new generator -- look up definition
    let def = tile_defs[id];
    if (!def || !def.pwall) return undefined;
    let width = def.pwall.width || 16;
    let height = def.pwall.height || 32;
    let offset = def.pwall.offset || 0;
    let model = new WallModel(width, height, offset);
    let gen = new ProcWallGenerator(model, def.pwall.colormap);
    if (def.pwall.faceMask) gen.faceMask = def.pwall.faceMask;
    if (def.pwall.edgeMask) gen.edgeMask = def.pwall.edgeMask;
    if (def.pwall.highlights) gen.highlights.assign = Object.assign(gen.highlights, def.pwall.highlights);
    return gen;
}

const wallColorMap = {
    [sides.top]:    new Color(98,129,189,.75),
    [sides.bottom]: new Color(98,129,189,.75),
    [sides.fl]:     new Color(70,85,175,.75),
    [sides.front]:  new Color(49,60,123,.75),
    [sides.fr]:     new Color(36,45,91,.75),
    [sides.br]:     new Color(70,85,175,.25),
    [sides.back]:   new Color(49,60,123,.25),
    [sides.bl]:     new Color(36,45,91,.25),
    [sides.hlm]:    new Color(0,222,164,.25),
    [sides.hlM]:    new Color(0,222,164,.85),
}

const holeColorMap = {
    [sides.top]: new Color(90,24,90,.3),
    [sides.bottom]: new Color(90,24,90,.3),
    [sides.fl]: new Color(156,36,222,.2),
    [sides.front]: new Color(156,36,222,.3),
    [sides.fr]: new Color(156,36,222,.4),
    [sides.br]: new Color(156,36,222,.2),
    [sides.back]: new Color(156,36,222,.3),
    [sides.bl]: new Color(156,36,222,.4),
    [sides.hlm]: new Color(200,50,200,.25),
    [sides.hlM]: new Color(200,50,200,.85),
}