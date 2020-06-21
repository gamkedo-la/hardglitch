import { Color, ParticleSystem, ParticleEmitter, FadeLineParticle, FadeParticle, BlipParticle, ParticleGroup } from "../system/particles.js";

function pickRange(min, max) {
    return Math.random() * (max-min) + min;
}

let last_update_time = Date.now();

class Env {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.FPS = 30;
        this.INTERVAL = 1000 / this.FPS; // milliseconds
        this.STEP = this.INTERVAL / 1000 // second
        // setup environment
        this.ps = new ParticleSystem();
        let ctx = this.ctx;

        let g = new ParticleGroup();
        this.ps.add(g);

        this.ps.add(new ParticleEmitter(this.ps, () => {
            let xoff = pickRange(-15,15);
            let yoff = pickRange(-15,15);
            let velocity = pickRange(30,60);
            let ttl = pickRange(.3, 1.5);
            return new BlipParticle(ctx, 300+xoff, 300+yoff, g, 0, -velocity, ttl, 10);
        }, .2, 25));

        /*
        this.ps.add(new ParticleEmitter(this.ps, () => {
            let xoff = pickRange(-15,15);
            let yoff = pickRange(-15,15);
            let velocity = pickRange(1,3);
            let size = pickRange(1,4);
            let ticks = pickRange(10,50);
            return new FadeParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, size, new Color(0,255,255), ticks);
        }, .2, 25));
        */

        /*
        this.ps.add(new ParticleEmitter(this.ps, () => {
            let xoff = pickRange(-15,15);
            let yoff = pickRange(-15,15);
            let velocity = pickRange(1,3);
            let size = pickRange(1,4);
            let ticks = pickRange(10,50);
            return new FadeParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, size, new Color(0,255,255), ticks);
        }, 10));
        */

        /*
        this.ps.add(new ParticleEmitter(this.ps, () => {
            let xoff = pickRange(-15,15);
            let yoff = pickRange(-15,15);
            let velocity = pickRange(1,3);
            let size = pickRange(1,4);
            let ticks = pickRange(10,50);
            return new FadeParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, size, new Color(255,255,0), ticks);
        }, 10));

        this.ps.add(new ParticleEmitter(this.ps, () => {
            let xoff = pickRange(-15,15);
            let yoff = pickRange(-15,15);
            let velocity = pickRange(1,3);
            let ticks = pickRange(10,60);
            let len = pickRange(10,50);
            let width = pickRange(1,5);
            return new FadeLineParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, new Color(0,255,0), ticks, len, width, 0, 1);
        }, 10));
        */

    }

    loop() {
        const now = Date.now();
        const delta_time = now - last_update_time;
        last_update_time = now;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // run particle system update
        this.ps.update(delta_time);
        this.ps.draw();
    }

    setup() {
        return new Promise((resolve) => {
            console.log("env: setup complete");
            resolve();
        });
    }

    start() {
        let runningId = -1;
        if (runningId == -1) {
            console.log("env: starting loop...");
            runningId = setInterval(() => { this.loop(); }, this.INTERVAL);
        }
    }
}

window.onload = function() {
    let env = new Env();
    let promise = env.setup();
    promise.then( () => env.start());
}