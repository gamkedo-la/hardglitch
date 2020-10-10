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
    ShootUpParticle,
    BlipEdgeParticle,
    LightningParticle,
    OffsetGlitchParticle,
    ColorGlitchParticle,
    ColorOffsetGlitchParticle,
    ThrobParticle,
    DirectionalRingParticle,
    WaitParticle,
    ActionParticle,
    ComboLockParticle,
    TraceParticle,
    TraceArcParticle,
    ScanLineParticle, 
    CollapseOrbParticle,
} from "./system/particles.js";
import { Color } from "./system/color.js";
import { Vector2 } from "./system/spatial.js";
import { random_int, random_float, random_sample } from "./system/utility.js";

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
        let hues = [165, 266];
        let huev = 25;
        let lum = 60;
        let lumv = 10;
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
                let hue = random_sample(hues);
                hue = random_int(hue-huev, hue+huev)%360;
                let l = random_int(lum-lumv, lum+lumv);
                let color = Color.fromHSL(hue, 100, l, random_float(.4,1));
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(position.x, position.y, color, speed, radius, width, collapse, ttl*.25);
            }, 0, 0, 0.1, pburst);
        particles.add(burstEmitter);

        // creates a slow stream of particles through rest of animation
        let trickleEmitter = new ParticleEmitter(particles, position.x, position.y, () => {
                let hue = random_sample(hues);
                hue = random_int(hue-huev, hue+huev)%360;
                let l = random_int(lum-lumv, lum+lumv);
                let color = Color.fromHSL(hue, 100, l, random_float(.4,1));
                let speed = random_int(minSpeed, maxSpeed);
                let radius = random_float(minRadius,maxRadius);
                let pttl = random_float(minPttl,maxPttl);
                let width = random_int(minWidth, maxWidth);
                return new SwirlParticle(position.x, position.y, color, speed, radius, width, collapse, pttl);
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
            const hue = random_int(100, 250);
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
        let colorOptions = [
            new Color(0,0,255),
            new Color(0,255,255),
        ]
        const effect = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(35,50);
            let targetx = emitter.x + Math.cos(angle) * distance;
            let targety = emitter.y + Math.sin(angle) * distance;
            let originx = emitter.x;
            let originy = emitter.y;
            let segments = random_int(10,15);
            let width = random_int(1,2);
            let color = random_sample(colorOptions).copy();
            color.a = random_float(.25,1);
            let variance = 1.5;
            let endWidth = 10;
            let ttl = .5;
            let emergePct = .5;
            return new LightningParticle({x: originx, y:originy}, {x: targetx, y: targety}, segments, width, color, endWidth, variance, ttl, emergePct);
        }, .05, 25, 0, 10);
        this.particleSystem.add(effect);
        let fx = new GameFx(position);
        fx.sentinels.push(effect);
        fx.relocatables.push(effect);
        return fx;
    }

    exitPortal(position) {
        let particles = this.particleSystem;
        let fx = new GameFx(position);
        for (const radius of [5, 10, 30]) {
            let emitInterval = .5;
            let emitJitter = 25;
            let shootEmitter = new ParticleEmitter(particles, position.x, position.y, (emitter) => {
                let angle = random_float(0, Math.PI*2);
                let r = random_float(0, radius);
                let xoff = Math.cos(angle) * r;
                let yoff = Math.sin(angle) * r + 10;
                let speed = 35;
                let width = random_int(2,4);
                let hue = random_int(0, 360);
                let ttl = 2.5;
                let pathLen = 60;
                let shootPct = 25;
                return new ShootUpParticle(emitter.x+xoff, emitter.y-25+yoff, speed, width, hue, pathLen, ttl, shootPct);
            }, emitInterval, emitJitter)
            particles.add(shootEmitter);
            fx.sentinels.push(shootEmitter);
            fx.sentinels.push(shootEmitter);
        }
        let lineEmitter = new ParticleEmitter(particles, position.x, position.y, (emitter) => {
            let xoff = random_float(-25,25);
            let yoff = random_float(-25,25) + 10;
            let velocity = random_float(30,90);
            let ttl = random_float(.3,1);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(emitter.x+xoff, emitter.y+yoff, 0, -velocity, new Color(0,255,0), ttl, len, width, 0, 1);
        }, .3, 25);
        particles.add(lineEmitter);
        fx.sentinels.push(lineEmitter);
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
        let colorOptions = [
            new Color(0,0,255),
            new Color(0,255,255),
        ]
        let emitter = new ParticleEmitter(this.particleSystem, origin.x, origin.y, (e) => {
            let segments = random_int(10,15);
            let width = random_int(1,2);
            let color = random_sample(colorOptions);
            color.a = random_float(.5,1);
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
        let colorOptions = [
            new Color(0,255,0),
            new Color(5,110,0),
            new Color(160,255,0),
        ];
        let emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (e) => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(32,64);
            let originx = e.x + Math.cos(angle) * distance;
            let originy = e.y + Math.sin(angle) * distance;
            let targetx = e.x;
            let targety = e.y;
            let speed = random_int(50,100);
            let radius = 4;
            let color = random_sample(colorOptions).copy();
            return new ThrobParticle({x: originx, y:originy}, {x: targetx, y: targety}, radius, speed, radius * .5, color);
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
        let eitherOr = false;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let dx = 0;
            let dy = -64;
            let radius = 20;
            let ttl = .5;
            let color = (eitherOr) ? new Color(0,0,255,.8) : new Color(0,255,255,.8);
            eitherOr = !eitherOr;
            return new DirectionalRingParticle(emitter.x, emitter.y, dx, dy, radius, color, ttl);
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
        let eitherOr = false;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let dx = 0;
            let dy = 64;
            let radius = 20;
            let ttl = .5;
            let color = (eitherOr) ? new Color(0,0,255,.8) : new Color(0,255,255,.8);
            eitherOr = !eitherOr;
            return new DirectionalRingParticle(emitter.x, emitter.y, dx, dy, radius, color, ttl);
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
        let eitherOr = false;
        const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
            let dx = target_pos.x - position.x;
            let dy = target_pos.y - position.y;
            let radius = 25;
            let ttl = .5;
            let color = (eitherOr) ? new Color(255,255,0,.8) : new Color(255,100,0,.8);
            eitherOr = !eitherOr;
            return new DirectionalRingParticle(emitter.x, emitter.y, dx, dy, radius, color, ttl);
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

    unlock(position, ttl) {
        let fx = new GameFx(position);
        // combo lock rings
        for (let i=0; i<5; i++) {
            let spec = {
                x: position.x,
                y: position.y,
                radius: 5+5*i,
                lockWidth: 5,
                unlockWidth: 5,
                lockColor: new Color(200,0,0, .5),
                unlockColor: new Color(0,200,0, .5),
                spinTTL: ttl*.75,
                unlockTTL: ttl*.25,
                rotation: random_float(Math.PI*2, Math.PI*6) * ((Math.random() > .5) ? 1 : -1),
            }
            let p = new ComboLockParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    unlockTriangle(position, ttl){
        let fx = new GameFx(position);
        // triangle shape tracers
        let paths = [
            [{x:11,y:39}, {x:29,y:7}, {x:33,y:8}, {x:16,y:42}, {x:11,y:39}],
            [{x:46,y:48}, {x:10,y:48}, {x:10,y:43}, {x:46,y:43}, {x:46,y:48}],
            [{x:37,y:10}, {x:54,y:46}, {x:50,y:48}, {x:33,y:12}, {x:37,y:10}],
        ]
        for (const path of paths) {
            let scale = 3;
            let spec = {
                x: position.x-32*scale,
                y: position.y-32*scale,
                path: path,
                ttl: ttl,
                origin: {x:position.x, y:position.y},
                outlineColor: new Color(50, 50, 50, .5),
                tracedOutlineColor: new Color(210, 15, 210, .75),
                outlineWidth: 3,
                scale: scale,
            }
            let p = new TraceParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        // combo lock rings
        for (let i=0; i<5; i++) {
            let spec = {
                x: position.x,
                y: position.y,
                radius: 5+5*i,
                lockWidth: 5,
                unlockWidth: 5,
                lockColor: new Color(200,0,0, .4),
                unlockColor: new Color(0,200,0, .4),
                spinTTL: ttl*.75,
                unlockTTL: ttl*.25,
                rotation: random_float(Math.PI*2, Math.PI*6) * ((Math.random() > .5) ? 1 : -1),
            }
            let p = new ComboLockParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    unlockPlus(position, ttl){
        let fx = new GameFx(position);
        // triangle shape tracers
        let paths = [
            [{x:12,y:24}, {x:25,y:24}, {x:25,y:10}, {x:39,y:10}, {x:39,y:24}, {x:53,y:24}, {x:53,y:37}, {x:39,y:37}, {x:39,y:52}, {x:25,y:52}, {x:25,y:37}, {x:12,y:37}, {x:12,y:24}],
            [{x:15,y:27}, {x:15,y:34}, {x:28,y:34}, {x:28,y:49}, {x:36,y:49}, {x:36,y:34}, {x:50,y:34}, {x:50,y:27}, {x:36,y:27}, {x:36,y:13}, {x:28,y:13}, {x:28,y:27}, {x:15,y:27}],
        ]
        for (const path of paths) {
            let scale = 3;
            let spec = {
                x: position.x-32*scale,
                y: position.y-32*scale,
                path: path,
                ttl: ttl,
                origin: {x:position.x, y:position.y},
                outlineColor: new Color(50, 50, 50, .5),
                tracedOutlineColor: new Color(0, 240, 255, .75),
                outlineWidth: 3,
                scale: scale,
            }
            let p = new TraceParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        // combo lock rings
        for (let i=0; i<5; i++) {
            let spec = {
                x: position.x,
                y: position.y,
                radius: 5+5*i,
                lockWidth: 5,
                unlockWidth: 5,
                lockColor: new Color(200,0,0, .4),
                unlockColor: new Color(0,200,0, .4),
                spinTTL: ttl*.75,
                unlockTTL: ttl*.25,
                rotation: random_float(Math.PI*2, Math.PI*6) * ((Math.random() > .5) ? 1 : -1),
            }
            let p = new ComboLockParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    unlockEqual(position, ttl){
        let fx = new GameFx(position);
        // triangle shape tracers
        let paths = [
            [{x:17,y:23}, {x:47,y:23}, {x:47,y:28}, {x:17,y:28}, {x:17,y:23}],
            [{x:47,y:41}, {x:17,y:41}, {x:17,y:36}, {x:47,y:36}, {x:47,y:41}],
        ]
        for (const path of paths) {
            let scale = 3;
            let spec = {
                x: position.x-32*scale,
                y: position.y-32*scale,
                path: path,
                ttl: ttl,
                origin: {x:position.x, y:position.y},
                outlineColor: new Color(50, 50, 50, .5),
                tracedOutlineColor: new Color(255, 163, 0, .75),
                outlineWidth: 3,
                scale: scale,
            }
            let p = new TraceParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        // combo lock rings
        for (let i=0; i<5; i++) {
            let spec = {
                x: position.x,
                y: position.y,
                radius: 5+5*i,
                lockWidth: 5,
                unlockWidth: 5,
                lockColor: new Color(200,0,0, .4),
                unlockColor: new Color(0,200,0, .4),
                spinTTL: ttl*.75,
                unlockTTL: ttl*.25,
                rotation: random_float(Math.PI*2, Math.PI*6) * ((Math.random() > .5) ? 1 : -1),
            }
            let p = new ComboLockParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    unlockCircle(position, ttl){
        let fx = new GameFx(position);
        // triangle shape tracers
        let atts = [
            {radius: 50, ccw: false},
            {radius: 60, ccw: true},
        ]
        for (const att of atts) {
            let spec = {
                radius: att.radius,
                ccw: att.ccw,
                x: position.x,
                y: position.y,
                ttl: ttl,
                origin: {x:position.x, y:position.y},
                outlineColor: new Color(50, 50, 50, .5),
                tracedOutlineColor: new Color(5, 215, 5, .75),
                outlineWidth: 3,
                startAngle: -Math.PI*.5,
            }
            let p = new TraceArcParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        // combo lock rings
        for (let i=0; i<5; i++) {
            let spec = {
                x: position.x,
                y: position.y,
                radius: 5+5*i,
                lockWidth: 5,
                unlockWidth: 5,
                lockColor: new Color(200,0,0, .4),
                unlockColor: new Color(0,200,0, .4),
                spinTTL: ttl*.75,
                unlockTTL: ttl*.25,
                rotation: random_float(Math.PI*2, Math.PI*6) * ((Math.random() > .5) ? 1 : -1),
            }
            let p = new ComboLockParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    scan(position){
        let fx = new GameFx(position);
        // scan line directions
        for (const dir of [ScanLineParticle.right, ScanLineParticle.left]) {
            let spec = {
                x: position.x,
                y: position.y,
                lineWidth: 5,
                scanTrail: 3,
                ttl: .75,
                scanDir: dir,
                lineColor: new Color(100,100,200),
            }
            let p = new ScanLineParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    spawn(position){
        let fx = new GameFx(position);
        // scan line directions
        for (const dir of [ScanLineParticle.right, ScanLineParticle.left, ScanLineParticle.up, ScanLineParticle.down]) {
            let spec = {
                x: position.x,
                y: position.y,
                lineColor: new Color(0,255,0),
                lineWidth: 4,
                scanTrail: 4,
                ttl: 1.25,
                scanDir: dir,
            }
            let p = new ScanLineParticle(spec);
            this.particleSystem.add(p);
            fx.sentinels.push(p);
            fx.relocatables.push(p);
        }
        return fx;
    }

    portalOut(position) {
        let fx = new GameFx(position);
        let colorOptions = [
            new Color(0,0,255),
            new Color(0,255,255),
        ]
        let emitInterval = 2.1;
        let emitJitter = 0;
        for (const spec of [
            {
                maxRadius: 16,
                color: new Color(215,215,255, .45),
                lightning: {
                    color: new Color(255,0,255),
                    count: 0,
                }
            },
            {
                maxRadius: 24,
                color: new Color(0,225,225, .45),
                lightning: {
                    color: new Color(255,0,255),
                    count: 5,
                }
            },
            {
                maxRadius: 32,
                color: new Color(0,0,200, .45),
                lightning: {
                    color: new Color(255,255,0),
                    count: 5,
                }
            }
        ]) {
            const emitter = new ParticleEmitter(this.particleSystem, position.x, position.y, (emitter) => {
                spec.x = emitter.x;
                spec.y = emitter.y;
                spec.ttl = 1;
                spec.lightning.x = emitter.x;
                spec.lightning.y = emitter.y;
                return new CollapseOrbParticle(spec);
            }, emitInterval, emitJitter);
            this.particleSystem.add(emitter);
            fx.sentinels.push(emitter);
            fx.relocatables.push(emitter);
        }
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