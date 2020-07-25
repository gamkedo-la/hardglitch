export { GameFx, GameFxView };

import { 
    ParticleSystem,
    ParticleEmitter, 
    ParticleGroup, 
    SwirlParticle,
    FlashParticle,
    RingParticle,
    BlipParticle,
    FadeParticle,
    FadeLineParticle,
    BlipEdgeParticle,
} from "./system/particles.js";
import { Color } from "./system/color.js";
import { Vector2 } from "./system/spatial.js";
import { random_int, random_float } from "./system/utility.js";

class GameFxView {

    constructor() {
        this.particleSystem = new ParticleSystem();
    }

    update(deltaTime) {
        this.particleSystem.update(deltaTime);
    }

    draw(ctx, position_predicate = () => true) {
        this.particleSystem.draw(ctx, position_predicate);
    }

    destruction(position) {
        let particles = this.particleSystem;
        let ttl = 1.5;
        let minHue = 130;
        let maxHue = 200;
        let minSpeed = 25;
        let maxSpeed = 200;
        let minRadius = 50;
        let maxRadius = 55;
        let minPttl = 1;
        let maxPttl = 2;
        let minWidth = 1;
        let maxWidth = 3;
        let pburst = 250;
        let pstreamInterval = .1;
        let pstreamVar = 25;
        let pstream = 5;
        // creates a sentinel object used to control all particles for swirl fx
        this.sentinel = new ParticleGroup(ttl);
        particles.add(this.sentinel);
        // creates an object used to control collapse of all particles at the same time
        let collapse = new ParticleGroup(ttl*.65);
        particles.add(collapse);
        // creates a burst of particles at beginning of animation
        let burstEmitter = new ParticleEmitter(particles, position.x, position.y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(position.x, position.y, hue, speed, radius, width, collapse, ttl*.25);
            }, 0, 0, 0.1, pburst);
        particles.add(burstEmitter);

        // creates a slow stream of particles through rest of animation
        let trickleEmitter = new ParticleEmitter(particles, position.x, position.y, () => {
                let hue = random_int(minHue, maxHue);
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let pttl = random_float(minPttl,maxPttl);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(position.x, position.y, hue, speed, radius, width, collapse, pttl);
            }, pstreamInterval, pstreamVar, pstream, ttl*.25);
        particles.add(trickleEmitter);
        
        // create fx wrapper
        let fx = new GameFx(position);
        fx.sentinels.push(collapse);
        fx.sentinels.push(burstEmitter);
        fx.sentinels.push(trickleEmitter);
        return fx;
    }

    damage(position){
        const effect = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            const xoff = random_int(-15,15);
            const yoff = random_int(-15,15);
            const width = random_int(20,40);
            const hue = random_int(150, 250);
            const ttl = .1;
            return new FlashParticle(emitter.x + xoff, emitter.y + yoff, width, hue, ttl);
        }, .1, 0, 0, 10);
        this.particleSystem.add(effect);
        let fx = new GameFx(position);
        fx.sentinels.push(effect);
        fx.relocatables.push(effect);
        return fx;
    }

    missile(position){
        const effect = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let radius = random_int(8,16);
            let ttl = random_float(.75,1.5);
            let hue = random_int(200, 500);
            return new RingParticle(emitter.x+xoff, emitter.y+yoff, radius, hue, ttl, 10);
        }, 1 / 16, 25);
        this.particleSystem.add(effect);
        let fx = new GameFx(position);
        fx.sentinels.push(effect);
        fx.relocatables.push(effect);
        return fx;
    }

    exitPortal(position) {
        let particles = this.particleSystem;
        // FIXME: need to replace blip particle here... it sets global alpha, which is interfering w/ drawing of other particles
        /*
        const blipGroup = new ParticleGroup();
        particles.add(blipGroup);
        let blipEmitter =
            new ParticleEmitter(particles, position.x, position.y, (emitter) => {
            let xoff = random_float(-25,25);
            let yoff = random_float(-25,25);
            let velocity = random_float(30,60);
            let ttl = random_float(.3, 1.5);
            return new BlipParticle(emitter.x+xoff, emitter.y+yoff, blipGroup, 0, -velocity, ttl, 10);
        }, .2, 25);
        particles.add(blipEmitter);
        */
        let lineEmitter = new ParticleEmitter(particles, position.x, position.y, (emitter) => {
            let xoff = random_float(-25,25);
            let yoff = random_float(-25,25);
            let velocity = random_float(30,90);
            let ttl = random_float(.3,1);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(emitter.x+xoff, emitter.y+yoff, 0, -velocity, new Color(0,255,0), ttl, len, width, 0, 1);
        }, .3, 25);
        particles.add(lineEmitter);
        let fx = new GameFx(position);
        //fx.sentinels.push(blipGroup);
        //fx.sentinels.push(blipEmitter);
        fx.sentinels.push(lineEmitter);
        //fx.relocatables.push(blipEmitter);
        fx.relocatables.push(lineEmitter);
        return fx;
    }

    voidEdge(position, tileid) {
        let seams = voidSeams[tileid];
        if (!seams || !seams.length) return undefined;
        // iterate through each void seam
        let seamsFactor = seams.length/2;
        for (let seamIdx=0; seamIdx<seams.length-1; seamIdx+=2) {
            // seam endpoints
            let pt1 = seams[seamIdx];
            let pt2 = seams[seamIdx+1];
            // directional vector from pt1 to pt2
            let dir12 = pt2.substract(pt1);
            let l12 = dir12.length;
            // direction vector towards center
            let dirc = new Vector2({x: dir12.y, y: -dir12.x});
            let emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (e) => {
                // compute startpoint
                let off = new Vector2(dir12);
                off.length = random_float(0,l12);
                let sx = e.x + pt1.x + off.x;
                let sy = e.y + pt1.y + off.y;
                // compute directional vector from startpoint to center
                let velocity = new Vector2(dirc);
                velocity.length = random_float(30,45);
                let size = random_float(.5,1.5);
                let ttl = random_float(.3,1);
                return new FadeParticle(sx, sy, -velocity.x, -velocity.y, size, new Color(0,222,0), ttl);
            }, .3*seamsFactor, 25);
            this.particleSystem.add(emitter);
            let fx = new GameFx(position);
            fx.sentinels.push(emitter);
            fx.relocatables.push(emitter);
            return fx;
        }
    }

    edgeBlip(position, graphBuilder, tile) {
        // add tile verts/edges to graph
        let verts = graphBuilder.addTile(position.x, position.y, tile);
        if (!verts) return;
        // create one random blip per tile
        let idx = random_int(0,(verts.length/2)-1)*2;
        // lookup graph
        let graph = graphBuilder.getGraph(verts[idx]);
        let group = graphBuilder.getGroup(graph);
        let blip;
        //let speed = random_int(40,90);
        let speed = 60;
        let radius = 2;
        let nextEdgeFcn = (v1, v2) => {
            let g = graphBuilder.getGraph(v1);
            if (g) return g.getRandEdge(v1, v2);
            return undefined;
        };
        if (Math.random() > .5) {
            blip = new BlipEdgeParticle(verts[idx], verts[idx+1], radius, speed, group, nextEdgeFcn);
        } else {
            blip = new BlipEdgeParticle(verts[idx+1], verts[idx], radius, speed, group, nextEdgeFcn);
        }
        if (group) group.add(blip);
        this.particleSystem.add(blip);
        let fx = new GameFx(position);
        fx.sentinels.push(blip);
        fx.relocatables.push(blip);
        return fx;
    }

}

class GameFx {

    constructor(position) {
        this._position = position;
        this.relocatables = [];
        this.sentinels = [];
        this._done = false;
    }

    get position() {
        return this._position;
    }

    set position(value) {
        for (let i=0; i<this.relocatables.length; i++) {
            this.relocatables[i].x = value.x;
            this.relocatables[i].y = value.y;
        }
        this._position = value;
    }

    get done() {
        if (this._done) return true;
        let done = true;
        for (let i=0; i<this.sentinels.length; i++) {
            done &= this.sentinels[i].done;
        }
        return done;
    }

    set done(value) {
        value = (value) ? true : false;
        this._done = true;
        for (let i=0; i<this.sentinels.length; i++) {
            this.sentinels[i].done = value;
        }
    }

    toString() {
        return "[GameFx:" + this._position.x + "," + this._position.y + "]";
    }

}


const voidSeams = {
    t:      [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
    ttls:   [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
    rtte:   [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
    ttl:    [new Vector2({x:22,y:9}), new Vector2({x:31,y:9}), new Vector2({x:9,y:22}), new Vector2({x:22,y:9}), new Vector2({x:9,y:31}), new Vector2({x:9,y:22}), ],
    ttlc:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:0,y:22}), ],
    ttle:   [new Vector2({x:9,y:31}), new Vector2({x:9,y:0})],
    l:      [new Vector2({x:9,y:31}), new Vector2({x:9,y:0})],
    ltts:   [new Vector2({x:0,y:31}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:9,y:0}), ],
    ltte:   [new Vector2({x:0,y:9}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:31,y:0}), ],
    ltbs:   [new Vector2({x:9,y:31}), new Vector2({x:9,y:0})],
    ltb:    [new Vector2({x:31,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:0}), ],
    ltbc:   [new Vector2({x:0,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:31}), ],
    ltbe:   [new Vector2({x:31,y:22}), new Vector2({x:0,y:22})],
    b:      [new Vector2({x:31,y:22}), new Vector2({x:0,y:22})],
    btls:   [new Vector2({x:31,y:31}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:0,y:22}), ],
    btle:   [new Vector2({x:9,y:31}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:0,y:0}), ],
    btrs:   [new Vector2({x:31,y:22}), new Vector2({x:0,y:22})],
    btr:    [new Vector2({x:22,y:0}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:0,y:22}), ],
    btrc:   [new Vector2({x:22,y:9}), new Vector2({x:31,y:9}), new Vector2({x:9,y:22}), new Vector2({x:22,y:9}), new Vector2({x:9,y:31}), new Vector2({x:9,y:22}), ],
    btre:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:31})],
    r:      [new Vector2({x:22,y:0}), new Vector2({x:22,y:31})],
    rtbs:   [new Vector2({x:31,y:0}), new Vector2({x:22,y:9}), new Vector2({x:22,y:9}), new Vector2({x:22,y:31}), ],
    rtbe:   [new Vector2({x:31,y:22}), new Vector2({x:9,y:22}), new Vector2({x:9,y:22}), new Vector2({x:0,y:31}), ],
    rtts:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:31})],
    rtt:    [new Vector2({x:0,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:31}), ],
    rttc:   [new Vector2({x:31,y:22}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:9,y:0}), ],
    rtte:   [new Vector2({x:0,y:9}), new Vector2({x:31,y:9})],
    ttrs:   [new Vector2({x:0,y:0}), new Vector2({x:9,y:9}), new Vector2({x:9,y:9}), new Vector2({x:31,y:9}), ],
    ttre:   [new Vector2({x:22,y:0}), new Vector2({x:22,y:22}), new Vector2({x:22,y:22}), new Vector2({x:31,y:31}), ],
};