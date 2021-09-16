// Debug tools.
export {
    log,
    warn,
    assertion,
}

window.enable_logs = false; // Set to true (even while playing) to see the logs).
window.enable_warnings = true; // Set to true (even while playing) to see the logs).
window.enable_assertions = true; // Set to true (even while playing) to see the logs).

function log(...anything){
    if(window.enable_logs){
        console.log(...anything);
    }
}

function warn(...anything){
    if(window.enable_logs){
        console.warn(...anything);
    }
}

function assertion(predicate){
    if(window.enable_assertions){
        console.assert(predicate());
    }
}



