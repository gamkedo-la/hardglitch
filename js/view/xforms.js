export {
    linearFade,
    linearFadeInOut,
    lifetime,
    translate,
};

function *linearFade(min, max, ttl, cb) {
    ttl *= 1000;
    let rate = (max-min)/ttl;
    let value = min;
    do {
        let delta_time = yield;
        // increase
        value += rate*delta_time;
        if (value >= max) value = max;
        // callback
        if (cb) cb(value);
        // handle lifetime
        ttl -= delta_time;
    } while (ttl > 0);
    value = max;
    if (cb) cb(value);
}

function *lifetime(ttl, cb) {
    ttl *= 1000;
    do {
        let delta_time = yield;
        // handle lifetime
        ttl -= delta_time;
    } while (ttl > 0);
    if (cb) cb();
}

function *linearFadeInOut(min, max, ttl, loop, cb) {
    ttl *= 1000;
    let maxttl = ttl;
    let rate = (max-min)*2/ttl;
    let increase = true;
    let value = min;
    do {
        let delta_time = yield;
        // increase
        if (increase) {
            value += rate*delta_time;
            if (value >= max) {
                value = max;
                increase = false;
            }
        } else {
            value -= rate*delta_time;
            if (value < min) value = min;
        }
        if (cb) cb(value);
        // handle lifetime
        ttl -= delta_time;
        if (loop && ttl <= 0) {
            ttl = maxttl;
            increase = true;
        }
    } while (ttl > 0);
    value = min;
    if (cb) cb(value);
}

function *translate(from, to, ttl, cb) {
    ttl *= 1000;
    let dx = (to.x-from.x)/ttl;
    let dy = (to.y-from.y)/ttl;
    let x = from.x;
    let y = from.y;
    do {
        let delta_time = yield;
        // move along
        x += dx * delta_time;
        y += dy * delta_time;
        if (cb) cb(x, y);
        // handle lifetime
        ttl -= delta_time;
    } while (ttl > 0);
    x = to.x;
    y = to.y;
    if (cb) cb(x, y);
}

