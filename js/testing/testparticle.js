import * as debug from "../system/debug.js";
import {
    ParticleSystem,
    ParticleEmitter,
    ParticleSequence,
    FadeLineParticle,
    ColorGlitchParticle,
    OffsetGlitchParticle,
    FadeParticle,
    BlipParticle,
    ParticleGroup,
    RingParticle,
    ShootUpParticle,
    FlashParticle,
    ThrobParticle,
    LightningParticle,
    ColorOffsetGlitchParticle,
    TraceParticle,
    TraceArcParticle,
    ComboLockParticle,
    ScanLineParticle,
} from "../system/particles.js";
import { GameFxView } from "../game-effects.js";
import { random_int, random_float } from "../system/utility.js";
import { Color } from "../system/color.js";
import { initialize } from "../system/graphics.js";

let last_update_time = Date.now();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", err => reject(err));
    img.src = src;
  });
}

class Tests {
    constructor(particles) {
        this.particles = particles;
    }

    blipfade(x,y) {
        let g = new ParticleGroup();
        this.particles.add(g);
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,60);
            let ttl = random_float(.3, 1.5);
            return new BlipParticle(x+xoff, y+yoff, g, 0, -velocity, ttl, 10);
        }, .2, 25));
    }

    fade(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,90);
            let size = random_float(1,4);
            let ttl = random_float(.3,1.6);
            return new FadeParticle(x+xoff, y+yoff, 0, -velocity, size, new Color(0,255,255), ttl);
        }, .2, 25));
    }

    linefade(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,90);
            let ttl = random_float(.3,1);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(x+xoff, y+yoff, 0, -velocity, new Color(0,255,0), ttl, len, width, 0, 1);
        }, .3, 25));
    }

    offsetglitch(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_int(-30,30);
            let yoff = random_int(-4,-60);
            let ttl = random_float(.1,5);
            let width = random_float(1,10);
            let height = random_float(1,10);
            let dx = random_float(-4,4);
            let dy = random_float(-4,4);
            return new OffsetGlitchParticle(x+xoff, y+yoff, width, height, dx, dy, ttl);
        }, .1, 25));
    }

    colorglitch(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_int(-30,30);
            let yoff = random_int(-4,-60);
            let width = random_float(20,Math.min(40,64-xoff));
            let height = random_float(20,Math.min(40,64-yoff));
            let roff = random_float(0,255);
            let goff = random_float(0,255);
            let boff = random_float(0,255);
            let ttl = random_float(.1,1);
            return new ColorGlitchParticle(x+xoff, y+yoff, width, height, roff, goff, boff, ttl);
        }, .3, 25));
    }

    /*
    swirl(x,y) {
        this.particles.add(
            new ParticleSequence(this.particles, [() => { return new SwirlPrefab(this.particles, 2.5, x, y-32)}], 3, 0, 0)
        );
    }
    */

    rings(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let radius = random_int(5,10);
            let ttl = random_float(.75,1.5);
            let hue = random_int(150, 250);
            return new RingParticle(x+xoff, y-25+yoff, radius, hue, ttl, 25);
        }, .25, 25));
    }

    shootup(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_int(-15,15);
            let yoff = random_int(-15,15);
            let speed = random_int(25,50);
            let width = random_int(3,6);
            let hue = random_int(150, 250);
            let ttl = random_float(4,6);
            let pathLen = 60;
            return new ShootUpParticle(x+xoff, y-25+yoff, speed, width, hue, pathLen, ttl, 50);
        }, .25, 25));
    }

    flash(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_int(-15,15);
            let yoff = random_int(-15,15);
            let width = random_int(5,30);
            let hue = random_int(150, 250);
            let ttl = .1;
            return new FlashParticle(x+xoff, y-25+yoff, width, hue, ttl);
        }, .1, 0, 0, 5));
    }

    combo(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let xoff = random_int(-15,15);
            let yoff = random_int(-15,15);
            let speed = random_int(75,150);
            let radius = random_int(5,10);
            let width = radius * .7;
            let hue = random_int(150, 250);
            let ringTTL = random_float(.5,.75);
            let flashTTL = .1;
            let shootTTL = random_float(.75,1.25);
            let pathLen = 15;
            return new ParticleSequence(this.particles, [
                () => { return new RingParticle(x+xoff, y-25+yoff, radius, hue, ringTTL, 25); },
                () => { return new FlashParticle(x+xoff, y-25+yoff, width*4, hue, flashTTL); },
                () => { return new ShootUpParticle(x+xoff, y-25+yoff, speed, width, hue, pathLen, shootTTL, 50); },
            ], .01);
        }, .1, 25));
    }

    missile(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(64,256);
            let originx = x + Math.cos(angle) * distance;
            let originy = y + Math.sin(angle) * distance;
            let targetx = x;
            let targety = y;
            let speed = random_int(50,100);
            let radius = 5;
            let color = new Color(255,0,0);
            return new ThrobParticle({x: originx, y:originy}, {x: targetx, y: targety}, radius, speed, radius * .5, color);
        }, 1, 25));
    }

    lightningorb(x,y) {
        this.particles.add(new ParticleEmitter(this.particles, 0, 0, () => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(35,50);
            let targetx = x + Math.cos(angle) * distance;
            let targety = y + Math.sin(angle) * distance;
            let originx = x;
            let originy = y;
            let segments = random_int(10,15);
            let width = random_int(1,2);
            let color = new Color(0,255,255, random_float(.25,1));
            let variance = 1.5;
            let endWidth = 10;
            let ttl = .5;
            let emergePct = .5;
            return new LightningParticle({x: originx, y:originy}, {x: targetx, y: targety}, segments, width, color, endWidth, variance, ttl, emergePct);
        }, .05, 25, 0, 5));
    }

    lightningstrike(x,y) {
        this.particles.add(new ParticleSequence(this.particles, [() => {
            let angle = random_float(0,Math.PI*2);
            let distance = random_int(175,200);
            let originx = x + Math.cos(angle) * distance;
            let originy = y + Math.sin(angle) * distance;
            let targetx = x;
            let targety = y;
            return new ParticleEmitter(this.particles, 0, 0, () => {
                let segments = random_int(10,15);
                let width = random_int(1,2);
                let color = new Color(200,0,0, random_float(.5,1));
                let variance = 2;
                let endWidth = 10;
                let ttl = random_float(1.4, 1.75);
                let emergePct = .5;
                let flash = random_int(1,3);
                let floaters = random_int(1,3);
                let floaterPct = random_float(0.25,1);
                return new LightningParticle({x: originx, y:originy}, {x: targetx, y: targety}, segments, width, color, endWidth, variance, ttl, emergePct, flash, floaters, floaterPct);
            }, 1, 25, .1, 5);
        }], 2, 0, 0));
    }

    colorshift(x,y) {
        let scanCycle = 1;
        let xformCycle = .1;
        let dx = 3;
        let dy = 2;
        let width = 64;
        let height = 64;
        let rshift = .5;
        let gshift = .5;
        let bshift = .5;
        let bandingAffinity = .85;
        this.particles.add(new ColorOffsetGlitchParticle(x-32, y-64, dx, dy, width, height, rshift, gshift, bshift, bandingAffinity, scanCycle, xformCycle));
    }

    trace(x,y) {
        let emitterInterval = 2;
        let emitterJitter = 0;
        this.particles.add(new ParticleEmitter(this.particles, x, y, (e) => {
            let spec = {
                x: e.x,
                y: e.y,
                path: [{x:0, y:0}, {x:50, y:0}, {x:50,y:50}, {x:0,y:50}, {x:0, y:0}],
                ttl: 2,
                origin: {x:e.x+25, y:e.y+25},
                outlineColor: new Color(200, 0, 0, .5),
                tracedOutlineColor: new Color(0, 200, 0),
                outlineWidth: 3,
            }
            return new TraceParticle(spec);
        }, emitterInterval, emitterJitter));
    }

    traceArc(x,y) {
        let emitterInterval = 2;
        let emitterJitter = 0;
        this.particles.add(new ParticleEmitter(this.particles, x, y, (e) => {
            let spec = {
                x: e.x,
                y: e.y,
                ttl: 2,
                radius: 25,
                origin: {x:e.x, y:e.y},
                outlineColor: new Color(200, 0, 0, .5),
                tracedOutlineColor: new Color(0, 200, 0),
                outlineWidth: 3,
            }
            return new TraceArcParticle(spec);
        }, emitterInterval, emitterJitter, 1.9));
    }

    combolock(x,y) {
        let emitterInterval = 2;
        let emitterJitter = 0;
        this.particles.add(new ParticleEmitter(this.particles, x, y, (e) => {
            let spec = {
                x: e.x,
                y: e.y,
                radius: 30,
                lockWidth: 5,
                unlockWidth: 5,
                rotation: (Math.random() > .5) ? 3*Math.PI : -3*Math.PI,
            }
            return new ComboLockParticle(spec);
        }, emitterInterval, emitterJitter));
    }

    scan(x,y,dir) {
        let emitterInterval = 1;
        let emitterJitter = 0;
        this.particles.add(new ParticleEmitter(this.particles, x, y, (e) => {
            let spec = {
                x: e.x,
                y: e.y,
                lineWidth: 5,
                scanTrail: 3,
                ttl: .75,
                scanDir: dir,
            }
            return new ScanLineParticle(spec);
        }, emitterInterval, emitterJitter));
    }

}

class Env {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
        this.bgimg;
        // setup environment
        this.particles = new ParticleSystem();
        this.particles.alwaysActive = true;
        this.tests = new Tests(this.particles);
        this.gfx = new GameFxView();
        this.gfx.particleSystem.alwaysActive = true;

        //this.tests.blipfade(100,300);
        this.tests.fade(200,300);
        this.tests.linefade(300,300);
        this.tests.offsetglitch(400,300);
        this.tests.colorglitch(400,300);
        //this.tests.swirl(500,300);
        this.tests.rings(600,300);
        this.tests.shootup(700,300);
        this.tests.flash(800,300);
        this.tests.combo(900,300);
        this.tests.missile(1000,300);
        this.tests.lightningorb(200,400);
        this.tests.lightningstrike(200,500);
        this.tests.colorshift(400, 400);
        this.tests.trace(500, 400);
        this.tests.traceArc(500, 500);
        this.tests.combolock(600, 400);
        this.tests.scan(900, 500, 1);
        this.tests.scan(900, 500, 2);
        this.tests.scan(900, 500, 3);
        this.tests.scan(900, 500, 4);

        for (const fx of [
            this.gfx.destruction({x:500,y:400}),
            this.gfx.damage({x:600,y:400}),
            this.gfx.lightningJump({x:500,y:500}, {x:600,y:600}),
            //this.gfx.unstable({x:400+32,y:400-64}),
            this.gfx.repair({x:700,y:400}),
            this.gfx.drop({x:800,y:400}),
            this.gfx.jump_up({x:900,y:400}),
            this.gfx.wait({x:200,y:500}, 700),
            this.gfx.action({x:300,y:500}),
            //this.gfx.corrupt({x:400+32,y:400-64}),
            //this.gfx.corrupt({x:368+32+64*1,y:336+32}),
            //this.gfx.unstable({x:368+32,y:336+32}),
            this.gfx.unlockTriangle({x:700,y:400}, 3),
            this.gfx.unlockPlus({x:800,y:400}, 3),
            this.gfx.unlockEqual({x:900,y:400}, 3),
            this.gfx.unlockCircle({x:700,y:500}, 3),
            this.gfx.scan({x:800,y:500}, 3),
            this.gfx.spawn({x:800,y:600}, 3),
        ]) {
            setTimeout(() => {fx.done = true;}, 5000);
        }

    }

    loop() {
        const now = Date.now();
        const delta_time = Math.min(100,now - last_update_time);
        last_update_time = now;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.bgimg, 368, 236);
        this.ctx.drawImage(this.groundimg, 368, 336);
        this.ctx.drawImage(this.groundimg, 368-64, 336);
        this.ctx.drawImage(this.groundimg, 368+64, 336);
        // run particle system update
        this.particles.update(delta_time);
        this.particles.draw(this.ctx);
        this.gfx.update(delta_time);
        this.gfx.draw(this.ctx);

        /*
        this.ctx.strokeStyle = "green";
        this.ctx.rect(368,336,64,64);
        this.ctx.stroke();
        */

    }

    setup() {
        return new Promise((resolve) => {
            let promises = [];
            let promise = loadImage("srcref/circuit.png");
            promise.then(img => this.bgimg = img);
            promises.push(promise);
            promise = loadImage("srcref/exampleground.png");
            promise.then(img => this.groundimg = img);
            promises.push(promise);
            Promise.all(promises).then(() => {
                debug.log("setup complete");
                resolve();
            })
        });
    }

    start() {
        debug.log("env: starting loop...");
        initialize({images:[]});
        setInterval(() => { this.loop(); }, this.INTERVAL);
    }

}

window.onload = function() {
    let env = new Env();
    let promise = env.setup();
    promise.then( () => env.start());
}