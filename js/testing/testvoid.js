import { ParticleSystem, ParticleEmitter, FadeLineParticle, FadeParticle, BlipParticle, ParticleGroup } from "../system/particles.js";
import { random_float } from "../system/utility.js";
import { Color } from "../system/color.js";

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
        // setup environment
        this.particles = new ParticleSystem();
        let ctx = this.ctx;
        this.voidimg;
        this.voidbg;

        /*
        let g = new ParticleGroup();
        this.particles.add(g);
        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,60);
            let ttl = random_float(.3, 1.5);
            return new BlipParticle(ctx, 100+xoff, 300+yoff, g, 0, -velocity, ttl, 10);
        }, .2, 25));
        */

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(0,100);
            let velocity = 30;
            let size = random_float(.5,2);
            let ttl = random_float(.3,.6);
            return new FadeParticle(ctx, 140+xoff, 190, 0, -velocity, size, new Color(130,233,39), ttl);
        }, .2, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(0,100);
            let velocity = 30;
            let size = random_float(.5,2);
            let ttl = random_float(.3,.6);
            return new FadeParticle(ctx, 140+xoff, 190, 0, -velocity, size, new Color(205,48,49), ttl);
        }, .2, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(0,100);
            let velocity = 30;
            let size = random_float(.5,2);
            let ttl = random_float(.3,.6);
            return new FadeParticle(ctx, 140+xoff, 140, 0, velocity, size, new Color(130,233,39), ttl);
        }, .2, 25));

        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(0,100);
            let velocity = 30;
            let size = random_float(.5,2);
            let ttl = random_float(.3,.6);
            return new FadeParticle(ctx, 140+xoff, 140, 0, velocity, size, new Color(205,48,49), ttl);
        }, .2, 25));

        /*
        this.particles.add(new ParticleEmitter(this.particles, () => {
            let xoff = random_float(-15,15);
            let yoff = random_float(-15,15);
            let velocity = random_float(30,90);
            let ttl = random_float(.3,1);
            let len = random_float(10,50);
            let width = random_float(1,5);
            return new FadeLineParticle(ctx, 300+xoff, 300+yoff, 0, -velocity, new Color(0,255,0), ttl, len, width, 0, 1);
        }, .3, 25));
        */

    }

    loop() {
        const now = Date.now();
        const delta_time = now - last_update_time;
        last_update_time = now;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.voidimg, 100, 100);
        // run particle system update
        this.particles.update(delta_time);
        this.particles.draw();
    }

    setup() {
        return new Promise((resolve) => {
            let promises = [];
            // load images
            let promise = loadImage("srcref/voidmock.png");
            promise.then(img => this.voidimg = img);
            promises.push(promise);
            promise = loadImage("images/world_void.png");
            promise.then(img => this.voidbg = img);
            promises.push(promise);
            // wait for images to be loaded
            Promise.all(promises).then(() => {
                console.log("voidimg w: " + this.voidimg.width);
                console.log("setup complete");
                resolve();
            });
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