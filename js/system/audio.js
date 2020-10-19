export {
    initialize,
    playEvent,
    pauseEvent,
    stopEvent,
    getVolume,
    setVolume,
    toggleMute,
    is_muted,
    are_events_enabled,
    set_events_enabled,
};

import * as debug from "../system/debug.js";
import { clamp, is_number } from "./utility.js";

let audio_context, mix_groups, audio_buffers, audio_streams;
let audio_events = [];
let event_defs;
let events_enabled = true;

function is_muted() { return mix_groups.Mute.gain.value == 0; }

function are_events_enabled() { return events_enabled; }
function set_events_enabled(is_enabled) {
    debug.assertion(()=>typeof is_enabled === "boolean");
    events_enabled = is_enabled;
    return events_enabled;
}

function initialize(assets, sound_event_defs) {
    debug.assertion(()=>assets instanceof Object);
    debug.assertion(()=>sound_event_defs instanceof Object);

    event_defs = sound_event_defs;

    audio_context = new AudioContext();
    audio_buffers = assets.audio_buffers;
    audio_streams = assets.audio_streams;

    mix_groups = {};
    mix_groups['Mute'] = audio_context.createGain();
    mix_groups['Master'] = new AudioMixNode(1, {});
    mix_groups['Music'] = new AudioMixNode(1, {});
    mix_groups['SoundEffects'] = new AudioMixNode(1, {
        threshold: -44,
        knee: 16,
        ratio: 16,
    });

    mix_groups.Mute.connect(audio_context.destination);
    mix_groups.Master.connect(mix_groups.Mute);
    mix_groups.Music.connect(mix_groups.Master.input);
    mix_groups.SoundEffects.connect(mix_groups.Master.input);
}

function playEvent(name, pan) {
    debug.assertion(()=>event_defs instanceof Object);

    if(!events_enabled)
        return;

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
    if (mix_groups.Mute.gain.value) {
        mix_groups.Mute.gain.cancelScheduledValues(audio_context.currentTime);
        mix_groups.Mute.gain.setValueAtTime(0, audio_context.currentTime + 0.2);
        debug.log("Audio muted.")
    } else {
        mix_groups.Mute.gain.cancelScheduledValues(audio_context.currentTime);
        mix_groups.Mute.gain.setValueAtTime(1, audio_context.currentTime + 0.2);
        debug.log("Audio unmuted.")
    }
}

function getVolume(group_name) {
    return mix_groups[group_name].gain.value;
}

function setVolume(group_name, setValue, addValue) {
    let gain = mix_groups[group_name].gain;
    if (setValue) gain.value = clamp(setValue, 0, 1);
    else if (addValue) gain.value = clamp(gain.value + addValue, 0, 1);
    debug.log(group_name + ' volume: ' + gain.value.toPrecision(4));
}

function getMixGroup(name) {
    if (name && mix_groups[name]) return mix_groups[name];
    else return mix_groups.Master;
}

class AudioMixNode {
    output = null;
    constructor(vol, comp_def) {
        // Web Audio won't let you look at AudioNode inputs directly, because that would be useful.
        this.input = audio_context.createDynamicsCompressor();
        
        if(comp_def) {
            this.input.threshold.value = comp_def.threshold ? comp_def.threshold : -24;
            this.input.knee.value = comp_def.knee ? comp_def.knee : 30;
            this.input.ratio.value = comp_def.ratio ? comp_def.ratio : 12;
            this.input.attack.value = comp_def.attack ? comp_def.attack : 0.003;
            this.input.release.value = comp_def.release ? comp_def.release : 0.25;
        }
        
        this.output = audio_context.createGain();

        this.gain = vol ? vol : 1;

        this.input.connect(this.output);
    }

    connect(audio_node) {
        this.output.connect(audio_node)
    }

    get gain() {return this.output.gain; }
    set gain(value) { this.output.gain.value = value; }
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
        this.vol.connect(output.input);

        this.loop = event_def.loop ? event_def.loop : false;
        this.loopStart = event_def.loopStart ? event_def.loopStart : 0;
        this.loopEnd = event_def.loopEnd ? event_def.loopEnd : 0;

        debug.assertion(()=>is_number(event_def.volume));
        this.volume = event_def.volume;
    }

    play() {
        if (this.loop) {
            this.bufferSource.loop = true;
            this.bufferSource.loopStart = this.loopStart;
            this.bufferSource.loopEnd = this.loopEnd;
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
        this.vol.connect(output.input);

        this.loop = event_def.loop ? event_def.loop : false;

        debug.assertion(()=>is_number(event_def.volume));
        this.volume = event_def.volume;
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