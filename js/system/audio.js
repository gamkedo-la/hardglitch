export {
    initialize,
    playEvent,
    pauseEvent,
    stopEvent,
    setVolume,
    toggleMute,
};

import { clamp } from "./utility.js";

let muted = false;
let audio_context, mix_groups, audio_buffers, audio_streams;
let audio_events = [];

const event_defs = {
    'buffertest': {
        source_type: 'audiobuffer',
        source_name: 'test',
        group_name: 'SoundEffects',
        loop: false,
        volume: 1,
        unique: false,
    },

    'streamtest': {
        source_type: 'audiostream',
        source_name: 'test',
        group_name: 'Music',
        loop: true,
        volume: 1,
        unique: true, // Will not create a new event instance if true
    }
}

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
}

function playEvent(name, pan) {
    let event_def = event_defs[name];
    let event;

    let index;
    if ((event_def.unique || event_def.source_type === 'audiostream') && 
        (index = audio_events.findIndex((element) => element.event_name === name)) >= 0) {
        event = audio_events[index];
    } else { // Create new event instance
        switch (event_def.source_type) {
            case 'audiobuffer':
                event = new AudioBufferEvent(name, event_def);
                break;
            case 'audiostream': {
                event = new AudioStreamEvent(name, event_def);
                break;
            }
            default:
                return null;
        }
        audio_events.push(event);    
    }

    if (pan) event.pan = pan;
    event.play();
}

function pauseEvent(name) {
    let index = audio_events.findIndex((element) => element.event_name === name);
    if (index >= 0 && index < audio_events.length) audio_events[index].pause();
}

function stopEvent(name) {
    let index = audio_events.findIndex((element) => element.event_name === name);
    if (index >= 0 && index < audio_events.length) audio_events[index].stop();
}

function toggleMute() {
    if (!muted) {
        mix_groups.Master.disconnect();
        muted = true;
        console.log("Audio muted.")
    } else {
        mix_groups.Master.connect(audio_context.destination);
        muted = false;
        console.log("Audio unmuted.")
    }
}

function setVolume(group_name, setValue, addValue) {
    let gain = mix_groups[group_name].gain;
    if (setValue) gain.value = clamp(setValue, 0, 1);
    else if (addValue) gain.value = clamp(gain.value + addValue, 0, 1);
    console.log(group_name + ' volume: ' + gain.value.toPrecision(4));
}

function getMixGroup(name) {
    if (name && mix_groups[name]) return mix_groups[name];
    else return mix_groups.Master;
}

// Audio Event Classes

class AudioBufferEvent {
    constructor(name, event_def) {
        this.event_name = name;
        this.buffer = audio_buffers[event_def.source_name];
        this.bufferSource = audio_context.createBufferSource();
        this.bufferSource.buffer = this.buffer;
        this.panner = audio_context.createStereoPanner();
        this.vol = audio_context.createGain();

        this.panner.connect(this.vol);
        let output = getMixGroup(event_def.group_name);
        this.vol.connect(output);

        this.loop = event_def.loop ? event_def.loop : false;
    }

    play() {
        if (this.loop) {
            this.bufferSource.loop = true;
        } else {
            this.bufferSource.onended = () => {
                let index = audio_events.findIndex((element) => element === this);
                audio_events.splice(index, 1);
            }
        }
        this.bufferSource.connect(this.panner);
        this.bufferSource.start();
    }

    pause() {
        this.stop();
    }

    stop() {
        this.bufferSource.stop();
        let index = audio_events.findIndex((element) => element === this);
        audio_events.splice(index, 1);
    }

    setVolumeAtTime(volume, time) {
        this.vol.gain.setValueAtTime(volume, time);
    }

    setPanAtAtime(pan, time) {
        this.pannner.pan.setValueAtTime(pan, time);
    }

    get volume() { return this.vol.gain.value };
    set volume(value) { this.vol.gain.value = value }
    
    get pan() { return this.panner.pan.volume }
    set pan(value) { this.panner.pan.value = value }
}

class AudioStreamEvent {
    constructor(name, event_def) {
        this.event_name = name;
        this.source = audio_streams[event_def.source_name];
        this.sourceNode = audio_context.createMediaElementSource(this.source);
        this.panner = audio_context.createStereoPanner();
        this.vol = audio_context.createGain();

        this.sourceNode.connect(this.panner);
        this.panner.connect(this.vol);
        let output = event_def.group_name ? mix_groups[event_def.group_name] : mix_groups.Master;
        this.vol.connect(output);
    
        this.loop = event_def.loop ? event_def.loop : false;
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

    get pan() { return this.panner.pan.volume }
    set pan(value) { this.panner.pan.value = value }

    get loop() { return this.source.loop; }
    set loop(value) { this.source.loop = value ? true : false; }
}

/* Possible format for gain/pan node pool
//  gainNodes = {
//      nodes = [],
//      nodesUsed = [],
//  }
//
// Checkout on use (nodesUed[i] = 1) and check-in on event completion (nodesUsed[i] = 0) 
*/