export { GameFx, GameFxView };

import {
    ParticleSystem,
    ParticleEmitter,
    ParticleGroup,
    SwirlParticle,
    FlashParticle,
    RingParticle,
    GrowthRingParticle,
    BlipParticle,
    FadeParticle,
    FadeLineParticle,
    BlipEdgeParticle,
    LightningParticle,
    OffsetGlitchParticle,
    ColorGlitchParticle,
    ColorOffsetGlitchParticle,
    ThrobParticle,
    DirectionalRingParticle,
    WaitParticle,
    ActionParticle,
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
        }, 1 / 32, 25);
        this.particleSystem.add(effect);
        let fx = new GameFx(position);
        fx.sentinels.push(effect);
        fx.relocatables.push(effect);
        return fx;
    }

    deleteBall(position){
        const effect = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(35,50);
            let targetx = emitter.x + Math.cos(angle) * distance;
            let targety = emitter.y + Math.sin(angle) * distance;
            let originx = emitter.x;
            let originy = emitter.y;
            let segments = random_int(10,15);
            let width = random_int(1,2);
            let color = new Color(0,255,255, random_float(.25,1));
            let variance = 1.5;
            let endWidth = 10;
            let ttl = .5;
            let emergePct = .5;
            return new LightningParticle({x: originx, y:originy}, {x: targetx, y: targety}, segments, width, color, endWidth, variance, ttl, emergePct);
        }, .05, 25, 0, 5);
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
        if (!verts || verts.length === 0) return;
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

    lightningJump(origin, target) {
        let emitInterval = .1;
        let emitJitter = 25;
        let emitTTL = 0;
        let emitCount = 4;
        let emitter = new ParticleEmitter(this.particleSystem, origin.x, origin.y, (e) => {
            let segments = random_int(10,15);
            let width = random_int(1,2);
            let color = new Color(65,226,222, random_float(.5,1));
            let variance = 2;
            let endWidth = 10;
            let ttl = random_float(.25, .5);
            let emergePct = .5;
            let flash = random_int(1,3);
            let floaters = random_int(1,3);
            let floaterPct = random_float(0.25,1);
            return new LightningParticle({x: e.x, y:e.y}, {x: target.x, y: target.y}, segments, width, color, endWidth, variance, ttl, emergePct, flash, floaters, floaterPct);
        }, emitInterval, emitJitter, emitTTL, emitCount);
        this.particleSystem.add(emitter);
        let fx = new GameFx(origin);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    unstable(position, srcCtx) {
        let scanCycle = random_float(.75,1.25);
        let xformCycle = .1;
        let dx = 3;
        let dy = 2;
        let width = 64;
        let height = 64;
        let rshift = .5;
        let gshift = .5;
        let bshift = .5;
        let bandingAffinity = .85;
        let particle = new ColorOffsetGlitchParticle(position.x-32, position.y-32, dx, dy, width, height, rshift, gshift, bshift, bandingAffinity, scanCycle, xformCycle, srcCtx);
        this.particleSystem.add(particle);
        let fx = new GameFx(position);
        fx.sentinels.push(particle);
        fx.relocatables.push(particle);
        return fx;
    }

    corrupt(position, srcCtx) {
        let emitInterval = .2;
        let emitJitter = 50;
        let offsetEmitter = new ParticleEmitter(this.particleSystem, position.x-32, position.y-32, (e) => {
            let xoff = random_int(4,50);
            let yoff = random_int(4,50);
            let ttl = random_float(.1,1);
            let width = random_float(5,14);
            let height = random_float(5,14);
            let dx = random_float(-5,5);
            let dy = random_float(-5,5);
            return new OffsetGlitchParticle(e.x+xoff, e.y+yoff, width, height, dx, dy, ttl, "", srcCtx);
        }, emitInterval, emitJitter);
        let colorEmitter = new ParticleEmitter(this.particleSystem, position.x-32, position.y-32, (e) => {
            let xoff = random_int(1,50);
            let yoff = random_int(1,50);
            let width = random_float(10,Math.min(40,64-xoff));
            let height = random_float(10,Math.min(40,64-yoff));
            let roff = random_float(0,255);
            let goff = random_float(0,255);
            let boff = random_float(0,255);
            let ttl = random_float(.1,1);
            return new ColorGlitchParticle(e.x+xoff, e.y+yoff, width, height, roff, goff, boff, ttl, srcCtx);
        }, emitInterval, emitJitter);
        let damageEmitter = new ParticleEmitter(this.particleSystem, position.x-32, position.y-32, (e) => {
            const xoff = random_int(4,60);
            const yoff = random_int(4,60);
            const width = random_int(15,30);
            const hue = random_int(150, 250);
            const ttl = .2;
            return new FlashParticle(e.x + xoff, e.y + yoff, width, hue, ttl);
        }, .1, 25);
        this.particleSystem.add(offsetEmitter);
        this.particleSystem.add(colorEmitter);
        this.particleSystem.add(damageEmitter);
        let fx = new GameFx(position);
        fx.sentinels.push(offsetEmitter);
        fx.sentinels.push(colorEmitter);
        fx.sentinels.push(damageEmitter);
        fx.relocatables.push(offsetEmitter);
        fx.relocatables.push(colorEmitter);
        fx.relocatables.push(damageEmitter);
        return fx;
    }

    repair(position) {
        let emitInterval = .1;
        let emitJitter = 25;
        let emitTTL = 0;
        let emitCount = 4;
        let emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (e) => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(32,64);
            let originx = e.x + Math.cos(angle) * distance;
            let originy = e.y + Math.sin(angle) * distance;
            let targetx = e.x;
            let targety = e.y;
            let speed = random_int(50,100);
            let radius = 4;
            return new ThrobParticle({x: originx, y:originy}, {x: targetx, y: targety}, radius, speed, radius * .5);
        }, emitInterval, emitJitter, emitTTL, emitCount);
        this.particleSystem.add(emitter);
        let fx = new GameFx(origin);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    drop(position, emitTTL=0) {
        let emitInterval = .1;
        let emitJitter = 25;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let radius = 32;
            let ttl = .5;
            let hue = random_int(200, 500) % 255;
            let fadePct = 10;
            return new RingParticle(emitter.x, emitter.y, radius, hue, ttl, fadePct);
        }, emitInterval, emitJitter, emitTTL);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    take(position, emitTTL=0) {
        let emitInterval = .1;
        let emitJitter = 25;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let radius = 32;
            let ttl = .5;
            let hue = random_int(200, 500) % 255;
            let fadePct = 10;
            return new GrowthRingParticle(emitter.x, emitter.y, radius, hue, ttl, fadePct);
        }, emitInterval, emitJitter, emitTTL);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    jump_up(position) {
        let emitInterval = .1;
        let emitJitter = 0;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let dx = 0;
            let dy = -64;
            let radius = 20;
            let ttl = .5;
            let hue = random_int(170, 180);
            return new DirectionalRingParticle(emitter.x, emitter.y, dx, dy, radius, hue, ttl);
        }, emitInterval, emitJitter);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    jump_down(position) {
        let emitInterval = .1;
        let emitJitter = 0;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let dx = 0;
            let dy = 64;
            let radius = 20;
            let ttl = .5;
            let hue = random_int(170, 180);
            return new DirectionalRingParticle(emitter.x, emitter.y, dx, dy, radius, hue, ttl);
        }, emitInterval, emitJitter);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    pushed(position, target_pos) {
        let emitInterval = .1;
        let emitJitter = 0;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let dx = target_pos.x - position.x;
            let dy = target_pos.y - position.y;
            let radius = 25;
            let ttl = .5;
            let hue = random_int(20, 30);
            return new DirectionalRingParticle(emitter.x, emitter.y, dx, dy, radius, hue, ttl);
        }, emitInterval, emitJitter);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    move(position){
        let emitInterval = .1;
        let emitJitter = 50;
        let emitTTL = 0;
        let emitCount = 2;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let radius = random_int(5,10);
            let ttl = random_float(.25,.5);
            let hue = random_int(120, 180);
            return new RingParticle(emitter.x+xoff, emitter.y+yoff, radius, hue, ttl, 10);
        }, emitInterval, emitJitter, emitTTL, emitCount);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    // TTL is in milliseconds
    wait(position, ttl){
        let emitJitter = 0;
        let emitTTL = ttl * .001;
        let emitInterval = emitTTL + .1;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let radius = 32;
            let ringColor = new Color(253,246,0,.8);
            let bgColor = new Color(253,246,0,.25);
            // wait particle expects TTL in seconds
            return new WaitParticle(emitter.x, emitter.y, radius, ringColor, bgColor, ttl*.001);
        }, emitInterval, emitJitter, emitTTL);
        this.particleSystem.add(emitter);
        let fx = new GameFx(position);
        fx.sentinels.push(emitter);
        fx.relocatables.push(emitter);
        return fx;
    }

    action(position){
        let fx = new GameFx(position);
        let offset = 16;
        let size = 64;
        let ttl = 0;
        let hicolor = new Color(253,246,0,.45);
        let hiWidth = 3;
        let hiSpeed = .25;
        let locolor = new Color(253,246,0,.2);
        let loWidth = 7;
        let loSpeed = .125;
        let particle;
        particle = new ActionParticle(position.x, position.y, offset, size, hicolor, hiSpeed, ttl, hiWidth, false);
        this.particleSystem.add(particle);
        fx.sentinels.push(particle);
        fx.relocatables.push(particle);
        particle = new ActionParticle(position.x, position.y, offset, size, hicolor, hiSpeed, ttl, hiWidth, true);
        this.particleSystem.add(particle);
        fx.sentinels.push(particle);
        fx.relocatables.push(particle);
        particle = new ActionParticle(position.x, position.y, offset, size, locolor, loSpeed, ttl, loWidth, false);
        this.particleSystem.add(particle);
        fx.sentinels.push(particle);
        fx.relocatables.push(particle);
        particle = new ActionParticle(position.x, position.y, offset, size, locolor, loSpeed, ttl, loWidth, true);
        this.particleSystem.add(particle);
        fx.sentinels.push(particle);
        fx.relocatables.push(particle);
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