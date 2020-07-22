export {
    initialize,
    playEvent,
    pauseEvent,
    stopEvent,
};


let audio_context, mix_groups, audio_buffers, audio_streams, events;

function initialize(assets) {
    audio_context = new AudioContext();
    audio_buffers = assets.audio_buffers;
    audio_streams = assets.audio_streams;

    mix_groups = {};
    mix_groups['Master'] = audio_context.createGain();
    mix_groups['Music'] = audio_context.createGain();
    mix_groups['SoundEffects'] = audio_context.createGain();

    mix_groups.Master.connect(audio_context.destination);
    mix_groups.Music.connect(mix_groups.Master);
    mix_groups.SoundEffects.connect(mix_groups.Master);

    events = {};
    events['buffertest'] = new AudioBufferEvent(audio_buffers['test'], mix_groups.SoundEffects);
    events['streamtest'] = new AudioStreamEvent(audio_streams['test'], mix_groups.Music);
    events['streamtest'].loop = true;
}

function playEvent(name) {
    events[name].play();
}

function pauseEvent(name) {
    events[name].pause();
}

function stopEvent(name) {
    events[name].stop();
}

// Audio Event Classes

class AudioBufferEvent {
    constructor(buffer, mixGroup) {
        this.buffer = buffer;
        this.bufferSources = [];
        this.panner = audio_context.createStereoPanner();
        this.vol = audio_context.createGain();

        this.panner.connect(this.vol);
        let output = mixGroup ? mixGroup : mix_groups.Master;
        this.vol.connect(output);

        this.loop = false;
    }

    play() {
        let new_source = audio_context.createBufferSource();
        new_source.buffer = this.buffer;
        if (this.loop) new_source.loop = true;
        else {
            new_source.onended = () => {
                let index = this.bufferSources.findIndex((element) => element === new_source);
                this.bufferSources.splice(index, 1);
            }
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

    get volume() { return this.vol.gain.value };
    set volume(value) { this.vol.gain.value = value }
    
    get pan() { return this.pannner.pan.volume }
    set pan(value) { this.pannner.pan.value = value }
}

class AudioStreamEvent {
    constructor(source, mixGroup) {
        this.source = source;
        this.sourceNode = audio_context.createMediaElementSource(this.source);
        this.panner = audio_context.createStereoPanner();
        this.vol = audio_context.createGain();

        this.sourceNode.connect(this.panner);
        this.panner.connect(this.vol);
        let output = mixGroup ? mixGroup : mix_groups.Master;
        this.vol.connect(output);
    }

    play() {
        this.source.play();
    }

    pause() {
        this.source.pause();
    }

    stop() {
        this.source.pause();
        this.source.currentTime = 0;
    }

    setVolumeAtTime(volume, time) {
        this.vol.gain.setValueAtTime(volume, time);
    }

    setPanAtAtime(pan, time) {
        this.pannner.pan.setValueAtTime(pan, time);
    }

    get volume() { return this.vol.gain.value };
    set volume(value) { this.vol.gain.value = value }

    get pan() { return this.pannner.pan.volume }
    set pan(value) { this.pannner.pan.value = value }

    get loop() { return this.source.loop; }
    set loop(value) { this.source.loop = value ? true : false; }
}