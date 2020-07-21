export {
    audio_context,
    initialize,
    addEvent,
    addMixGroup,
    playEvent,
    pauseEvent,
    stopEvent,
};


let audio_context;
let mix_groups = {};
let audio_buffers;
let events = {};

function initialize(buffers) {
    audio_context = new AudioContext();
    audio_buffers = buffers;
    mix_groups['Master'] = audio_context.createGain();
    mix_groups['Music'] = audio_context.createGain();
    mix_groups['SFX'] = audio_context.createGain();

    mix_groups.Master.connect(audio_context.destination);
    mix_groups.Music.connect(mix_groups.Master);
    mix_groups.SFX.connect(mix_groups.Master);

    addEvent('test', AudioContainer);
}

function playEvent(name) {
    console.log(events[name]);
    events[name].play();
}

function pauseEvent(name) {
    events[name].pause();
}

function stopEvent(name) {
    events[name].stop();
}

function addEvent(name, container) {
    events[name] = new container(audio_buffers[name]);
}

function addMixGroup(name) {
    mix_groups[name] = audio_context.createGain(); 
}

// Audio Event Classes

class AudioContainer {
    constructor (buffer, mixGroup) {
        this.buffer = buffer;
        this.bufferSources = [];
        this.panner = audio_context.createStereoPanner();
        this.vol = audio_context.createGain();

        this.panner.connect(this.vol);
        let output = mixGroup ? mixGroup : mix_groups.Master;
        this.vol.connect(output);
    }

    play() {
        let new_source = audio_context.createBufferSource();
        new_source.buffer = this.buffer;
        new_source.onended = () => {
            let index = this.bufferSources.findIndex((element) => element === new_source);
            this.bufferSources.splice(index, 1);
        }
        new_source.connect(this.panner);
        new_source.start();
        
        this.bufferSources.push(new_source);
    }

    pause() {
        this.stop();
    }

    stop() {
        for (let source of this.bufferSources) {
            source.stop();
        }
        this.bufferSources.length = 0;
    }

    setVolumeAtTime(volume, time) {
        this.vol.gain.setValueAtTime(volume, time);
    }

    setPanAtAtime(pan, time) {
        this.pannner.pan.setValueAtTime(pan, time);
    }

    get volume() {return this.vol.gain.value};
    set volume(value) {this.vol.gain.value = value}
    get pan() {return this.pannner.pan.volume}
    set pan(value) {this.pannner.pan.value = value}
}