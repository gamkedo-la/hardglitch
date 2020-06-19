import { Color, ParticleSystem, ParticleEmitter, FadeLineParticle, FadeParticle } from "../system/particles.js";

function pickRange(min, max) {
    return Math.random() * (max-min) + min;
}

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

        let p = new FadeLineParticle(this.ctx, 300, 300, 0, -2.5, new Color(0,255,0), 20, 50, 3, .1, 1);
        this.ps.add(p);

        this.ps.add(new ParticleEmitter(this.ps, () => {
            let xoff = pickRange(-15,15);
            let yoff = pickRange(-15,15);
            let velocity = pickRange(1,3);
            let size = pickRange(1,4);
            let ticks = pickRange(10,50);
            return new FadeParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, size, new Color(0,255,255), ticks);
        }, 10));

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

    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // run particle system update
        this.ps.update();
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