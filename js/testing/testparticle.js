import { Color, ParticleSystem, ParticleEmitter, FadeLineParticle, ColorGlitchParticle, OffsetGlitchParticle, FadeParticle, BlipParticle, ParticleGroup } from "../system/particles.js";
import { random_float } from "../system/utility.js";
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
        let ctx = this.ctx;

        let g = new ParticleGroup();
        this.particles.add(g);

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,60);
            let ttl = random_float(.3, 1.5);
            return new BlipParticle(ctx, 100+xoff, 300+yoff, g, 0, -velocity, ttl, 10);
        }, .2, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,90);
            let size = random_float(1,4);
            let ttl = random_float(.3,1.6);
            return new FadeParticle(ctx, 200+xoff, 300+yoff, 0, -velocity, size, new Color(0,255,255), ttl);
        }, .2, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,90);
            let ttl = random_float(.3,1);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, new Color(0,255,0), ttl, len, width, 0, 1);
        }, .3, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(4,60);
            let yoff = random_float(4,60);
            let ttl = random_float(.1,.5);
            let width = random_float(10,Math.min(40,64-xoff));
            let height = random_float(10,Math.min(40,64-yoff));
            let dx = random_float(-(xoff+10),74-(xoff+width));
            let dy = random_float(-(yoff+10),74-(yoff+height));
            return new OffsetGlitchParticle(ctx, 400+xoff, 236+yoff, width, height, dx, dy, ttl, new Color(255,0,0));
        }, .3, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(4,60);
            let yoff = random_float(4,60);
            let width = random_float(20,Math.min(40,64-xoff));
            let height = random_float(20,Math.min(40,64-yoff));
            let roff = random_float(0,255);
            let goff = random_float(0,255);
            let boff = random_float(0,255);
            let ttl = random_float(.1,.5);
            return new ColorGlitchParticle(ctx, 400+xoff, 236+yoff, width, height, roff, goff, boff, ttl);
        }, .3, 25));

    }

    loop() {
        const now = Date.now();
        const delta_time = now - last_update_time;
        last_update_time = now;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.bgimg, 400, 236);
        // run particle system update
        this.particles.update(delta_time);
        this.particles.draw();
    }

    setup() {
        return new Promise((resolve) => {
            let promises = [];
            let promise = loadImage("srcref/circuit.png");
            promise.then(img => this.bgimg = img);
            promises.push(promise);
            Promise.all(promises).then(() => {
                console.log("setup complete");
                resolve();
            })
        });
    }

    start() {
        initialize({images:[]});
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