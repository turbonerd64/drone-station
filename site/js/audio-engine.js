/**
 * Drone Station Audio Engine (Safe & Bulletproof Edition)
 * Features:
 * - Brickwall Safety Limiter (prevents volume overload / feedback spikes)
 * - Single-Pass High-Diffusion Ambient Reverb (Zero runaway feedback loops)
 * - True Sample Looping for Infinite Sustain
 * - Instant Silence Panic / Kill Switch
 * - Modular Crossfading, Octave Spreading, Modulation (LFO), and Filter
 */

class DroneAudioEngine {
    constructor() {
        this.ctx = null;
        this.loader = null;

        // Master Chain Nodes
        this.limiter = null;       // Hardware-grade safety limiter
        this.masterGain = null;
        this.masterFilter = null;
        this.analyser = null;

        // Routing Buses
        this.voiceBus = null;
        this.reverbDryGain = null;
        this.reverbWetGain = null;
        this.reverbConvolver = null;
        this.reverbDampFilter = null;

        // Modulation & Chorus
        this.chorusInput = null;
        this.chorusOutput = null;
        this.delayL = null;
        this.delayR = null;
        this.lfoOsc = null;
        this.lfoFilterGain = null;

        // Active State & Voices
        this.currentInstrument = 'string_ensemble_1';
        this.instrumentData = null;
        this.activeVoices = [];
        this.latchedMidiNotes = [];

        // Modular Settings
        this.settings = {
            masterVolume: 0.8,
            filterCutoff: 3500,
            filterResonance: 1.2,

            // Crossfade
            crossfadeEnabled: true,
            crossfadeTime: 1.5, // seconds

            // Octave Spread
            octaveSpreadEnabled: true,
            subBassLevel: 0.7,
            subOctave: -1,
            shimmerLevel: 0.45,
            shimmerOctave: 1,
            fifthLevel: 0.35,

            // Sustain & Freeze
            sustainMode: 'freeze', // 'natural' or 'freeze'
            freezeAmount: 0.7,
            reverbMix: 0.45,
            reverbDamping: 5000,

            // Modulation
            modulationEnabled: true,
            lfoRate: 0.18, // Hz
            lfoDepth: 0.35,
            lfoTarget: 'filter',
            chorusEnabled: true,

            // Latch Mode
            latchMode: 'replace'
        };

        this.onStateChange = () => {};
    }

    async init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext({ latencyHint: 'interactive' });
        this.loader = new SoundFontLoader(this.ctx);

        this.buildAudioGraph();
        await this.loadInstrument(this.currentInstrument);
    }

    buildAudioGraph() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 1. HARDWARE SAFETY BRICKWALL LIMITER (Clamps any signal to -1 dBFS maximum)
        this.limiter = ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-1.0, now);
        this.limiter.knee.setValueAtTime(0.0, now);
        this.limiter.ratio.setValueAtTime(20.0, now);
        this.limiter.attack.setValueAtTime(0.001, now);
        this.limiter.release.setValueAtTime(0.05, now);

        // 2. Master Analyser
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;

        // 3. Master Output Gain
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.settings.masterVolume, now);

        // 4. Master Tone Filter (Low-pass)
        this.masterFilter = ctx.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.setValueAtTime(this.settings.filterCutoff, now);
        this.masterFilter.Q.setValueAtTime(this.settings.filterResonance, now);

        // 5. Voice Input Bus
        this.voiceBus = ctx.createGain();
        this.voiceBus.gain.setValueAtTime(1.0, now);

        // 6. Build Reverb & Space (Single-Pass Normalized Convolver - Zero runaway loops!)
        this.buildReverbNetwork();

        // 7. Build Stereo Chorus
        this.buildChorusNetwork();

        // 8. Build LFO Breathing Modulation
        this.buildLFONetwork();

        // Connect Chain:
        // VoiceBus -> Chorus -> (Reverb Dry + Reverb Wet) -> MasterFilter -> MasterGain -> Analyser -> Limiter -> Destination
        this.voiceBus.connect(this.chorusInput);

        this.chorusOutput.connect(this.reverbDryGain);
        this.reverbDryGain.connect(this.masterFilter);

        this.chorusOutput.connect(this.reverbConvolver);
        this.reverbConvolver.connect(this.reverbDampFilter);
        this.reverbDampFilter.connect(this.reverbWetGain);
        this.reverbWetGain.connect(this.masterFilter);

        this.masterFilter.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.limiter);
        this.limiter.connect(ctx.destination);
    }

    buildReverbNetwork() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Normalized 6-Second Ambient Impulse Response
        const duration = 6.0;
        const length = Math.floor(ctx.sampleRate * duration);
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const t = i / ctx.sampleRate;
            // Smooth exponential decay curve
            const decay = Math.exp(-t / 1.8);
            // Energy-scaled white noise with gentle stereo decorrelation
            left[i] = ((Math.random() * 2 - 1) * decay) * 0.12;
            right[i] = ((Math.random() * 2 - 1) * decay) * 0.12;
        }

        this.reverbConvolver = ctx.createConvolver();
        this.reverbConvolver.buffer = impulse;

        this.reverbDampFilter = ctx.createBiquadFilter();
        this.reverbDampFilter.type = 'lowpass';
        this.reverbDampFilter.frequency.setValueAtTime(this.settings.reverbDamping, now);

        this.reverbDryGain = ctx.createGain();
        this.reverbDryGain.gain.setValueAtTime(1.0 - this.settings.reverbMix * 0.5, now);

        this.reverbWetGain = ctx.createGain();
        this.reverbWetGain.gain.setValueAtTime(this.settings.reverbMix * 0.5, now);
    }

    buildChorusNetwork() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        this.chorusInput = ctx.createGain();
        this.chorusOutput = ctx.createGain();

        // Dry direct path
        this.chorusDry = ctx.createGain();
        this.chorusDry.gain.setValueAtTime(0.8, now);
        this.chorusInput.connect(this.chorusDry);
        this.chorusDry.connect(this.chorusOutput);

        // Subtle Stereo Delay Lines (24ms and 32ms)
        this.delayL = ctx.createDelay();
        this.delayL.delayTime.setValueAtTime(0.024, now);
        this.delayR = ctx.createDelay();
        this.delayR.delayTime.setValueAtTime(0.032, now);

        this.chorusWetL = ctx.createGain();
        this.chorusWetL.gain.setValueAtTime(0.25, now);
        this.chorusWetR = ctx.createGain();
        this.chorusWetR.gain.setValueAtTime(0.25, now);

        this.chorusInput.connect(this.delayL);
        this.chorusInput.connect(this.delayR);
        this.delayL.connect(this.chorusWetL);
        this.delayR.connect(this.chorusWetR);

        // Stereo Panning
        if (ctx.createStereoPanner) {
            const panL = ctx.createStereoPanner();
            const panR = ctx.createStereoPanner();
            panL.pan.setValueAtTime(-0.7, now);
            panR.pan.setValueAtTime(0.7, now);
            this.chorusWetL.connect(panL);
            this.chorusWetR.connect(panR);
            panL.connect(this.chorusOutput);
            panR.connect(this.chorusOutput);
        } else {
            this.chorusWetL.connect(this.chorusOutput);
            this.chorusWetR.connect(this.chorusOutput);
        }
    }

    buildLFONetwork() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        this.lfoOsc = ctx.createOscillator();
        this.lfoOsc.type = 'sine';
        this.lfoOsc.frequency.setValueAtTime(this.settings.lfoRate, now);

        this.lfoFilterGain = ctx.createGain();
        const depthHz = this.settings.modulationEnabled ? this.settings.lfoDepth * 600 : 0;
        this.lfoFilterGain.gain.setValueAtTime(depthHz, now);

        this.lfoOsc.connect(this.lfoFilterGain);
        this.lfoFilterGain.connect(this.masterFilter.frequency);

        this.lfoOsc.start(now);
    }

    async loadInstrument(instrumentName, onProgress = () => {}) {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        if (instrumentName.startsWith('synth_')) {
            this.currentInstrument = instrumentName;
            this.instrumentData = { isSynth: true, name: instrumentName };
            onProgress(100);
            return;
        }

        try {
            onProgress(15);
            const data = await this.loader.loadInstrument(instrumentName, onProgress);
            this.instrumentData = data;
            this.currentInstrument = instrumentName;
            onProgress(100);
        } catch (e) {
            console.error('Failed to load instrument:', e);
            onProgress(0);
            throw e;
        }
    }

    /**
     * Trigger a new drone chord
     */
    triggerChord(midiNotes) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const fadeTime = this.settings.crossfadeEnabled ? Math.max(0.1, this.settings.crossfadeTime) : 0.08;

        // Release previous voices smoothly
        if (this.settings.latchMode === 'replace' && this.activeVoices.length > 0) {
            this.releaseAllVoices(fadeTime);
        }

        this.latchedMidiNotes = [...midiNotes];

        // Compute all notes to sound including Octave Spreading
        const soundingPitches = this.computeSoundingNotes(midiNotes);

        for (const pitchInfo of soundingPitches) {
            const voice = this.createVoice(pitchInfo, fadeTime);
            if (voice) {
                this.activeVoices.push(voice);
            }
        }

        this.updateSpaceGains();
        this.onStateChange();
    }

    computeSoundingNotes(baseMidiNotes) {
        const result = [];
        if (!baseMidiNotes || baseMidiNotes.length === 0) return result;

        const sorted = [...new Set(baseMidiNotes)].sort((a, b) => a - b);
        const lowestRoot = sorted[0];

        // 1. Core Played Notes
        for (const midi of sorted) {
            result.push({
                midi,
                gain: 1.0,
                type: 'core'
            });
        }

        // 2. Octave Spread
        if (this.settings.octaveSpreadEnabled) {
            // Sub-Bass
            const subMidi = lowestRoot + (this.settings.subOctave * 12);
            if (subMidi >= 12 && this.settings.subBassLevel > 0) {
                result.push({
                    midi: subMidi,
                    gain: this.settings.subBassLevel * 0.7,
                    type: 'sub_bass'
                });
            }

            // Upper Shimmer
            const highestNote = sorted[sorted.length - 1];
            const shimmerMidi = highestNote + (this.settings.shimmerOctave * 12);
            if (shimmerMidi <= 110 && this.settings.shimmerLevel > 0) {
                result.push({
                    midi: shimmerMidi,
                    gain: this.settings.shimmerLevel * 0.5,
                    type: 'shimmer'
                });
            }

            // 5th Drone Overtone
            if (this.settings.fifthLevel > 0) {
                const fifthMidi = lowestRoot + 7;
                if (!sorted.includes(fifthMidi) && fifthMidi <= 108) {
                    result.push({
                        midi: fifthMidi,
                        gain: this.settings.fifthLevel * 0.45,
                        type: 'fifth_drone'
                    });
                }
            }
        }

        return result;
    }

    createVoice(pitchInfo, attackTime) {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const isSynth = this.instrumentData && this.instrumentData.isSynth;
        const sources = [];
        const gainNodes = [];

        const targetGain = pitchInfo.gain * (isSynth ? 0.18 : 0.28);

        if (isSynth) {
            const osc = this.createSynthOscillator(pitchInfo.midi, this.instrumentData.name);
            const voiceGain = ctx.createGain();
            voiceGain.gain.setValueAtTime(0.0001, now);
            voiceGain.gain.linearRampToValueAtTime(targetGain, now + attackTime * 0.5);

            osc.connect(voiceGain);
            voiceGain.connect(this.voiceBus);
            osc.start(now);

            sources.push(osc);
            gainNodes.push(voiceGain);
        } else {
            const sampleInfo = this.loader.getSampleForMidi(this.instrumentData, pitchInfo.midi);
            if (!sampleInfo) return null;

            // 1. Initial Attack Layer (plays raw sample once for authentic acoustic bite)
            const attackSource = ctx.createBufferSource();
            attackSource.buffer = sampleInfo.rawBuffer;
            attackSource.playbackRate.setValueAtTime(sampleInfo.playbackRate, now);

            const attackGain = ctx.createGain();
            attackGain.gain.setValueAtTime(targetGain * 0.9, now);
            attackGain.gain.setValueAtTime(targetGain * 0.9, now + 0.35);
            attackGain.gain.linearRampToValueAtTime(0.0001, now + 0.95);

            attackSource.connect(attackGain);
            attackGain.connect(this.voiceBus);
            attackSource.start(now);

            sources.push(attackSource);
            gainNodes.push(attackGain);

            // 2. Seamless Infinite Loop Layer (No clicks, no gaps, no restarts)
            const isDecaying = this.isDecayingInstrument(this.currentInstrument);
            const shouldLoop = this.settings.sustainMode !== 'natural' || !isDecaying;

            if (shouldLoop) {
                const loopSource = ctx.createBufferSource();
                loopSource.buffer = sampleInfo.loopBuffer;
                loopSource.playbackRate.setValueAtTime(sampleInfo.playbackRate, now);
                loopSource.loop = true;

                const loopGain = ctx.createGain();
                loopGain.gain.setValueAtTime(0.0001, now);
                loopGain.gain.linearRampToValueAtTime(targetGain, now + Math.max(0.2, attackTime * 0.45));

                loopSource.connect(loopGain);
                loopGain.connect(this.voiceBus);
                loopSource.start(now);

                sources.push(loopSource);
                gainNodes.push(loopGain);
            }
        }

        return {
            midi: pitchInfo.midi,
            type: pitchInfo.type,
            sources,
            gainNodes
        };
    }

    createSynthOscillator(midi, synthType) {
        const ctx = this.ctx;
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        const osc = ctx.createOscillator();

        if (synthType === 'synth_sub_organ') {
            osc.type = 'triangle';
        } else if (synthType === 'synth_crystal_glass') {
            osc.type = 'sine';
        } else {
            osc.type = 'sawtooth';
        }

        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        return osc;
    }

    isDecayingInstrument(name) {
        const decayingPrefixes = [
            'acoustic_grand_piano', 'bright_acoustic_piano', 'electric_grand_piano',
            'honkytonk_piano', 'electric_piano', 'clavinet', 'harpsichord',
            'vibraphone', 'marimba', 'xylophone', 'tubular_bells', 'music_box',
            'acoustic_guitar', 'pizzicato_strings', 'orchestral_harp', 'kalimba',
            'koto', 'shamisen', 'sitar', 'steel_drums'
        ];
        return decayingPrefixes.some(d => name.includes(d));
    }

    releaseAllVoices(fadeTime = 1.0) {
        const now = this.ctx ? this.ctx.currentTime : 0;
        const voicesToRelease = [...this.activeVoices];
        this.activeVoices = [];

        for (const voice of voicesToRelease) {
            for (const g of voice.gainNodes) {
                try {
                    g.gain.cancelScheduledValues(now);
                    g.gain.setValueAtTime(g.gain.value, now);
                    g.gain.linearRampToValueAtTime(0.0001, now + fadeTime);
                } catch (e) {}
            }

            setTimeout(() => {
                for (const s of voice.sources) {
                    try { s.stop(); } catch (e) {}
                    try { s.disconnect(); } catch (e) {}
                }
                for (const g of voice.gainNodes) {
                    try { g.disconnect(); } catch (e) {}
                }
            }, (fadeTime + 0.1) * 1000);
        }
    }

    /**
     * BULLETPROOF PANIC / KILL SWITCH
     * Instantly cuts all master audio to dead silence, stops all voices,
     * and resets audio graph safely.
     */
    panic() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.latchedMidiNotes = [];

        // 1. Immediately clamp Master & Voice Gains to 0
        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(0, now);
        }
        if (this.voiceBus) {
            this.voiceBus.gain.cancelScheduledValues(now);
            this.voiceBus.gain.setValueAtTime(0, now);
        }

        // 2. Stop and disconnect every active sound source immediately
        for (const voice of this.activeVoices) {
            for (const s of voice.sources) {
                try { s.stop(); } catch (e) {}
                try { s.disconnect(); } catch (e) {}
            }
            for (const g of voice.gainNodes) {
                try { g.disconnect(); } catch (e) {}
            }
        }
        this.activeVoices = [];

        // 3. Restore Master & Voice buses cleanly after 200ms of absolute silence
        setTimeout(() => {
            if (this.ctx && this.masterGain && this.voiceBus) {
                const resumeTime = this.ctx.currentTime;
                this.voiceBus.gain.setValueAtTime(1.0, resumeTime);
                this.masterGain.gain.setValueAtTime(0, resumeTime);
                this.masterGain.gain.linearRampToValueAtTime(this.settings.masterVolume, resumeTime + 0.15);
            }
        }, 200);

        this.onStateChange();
    }

    updateSpaceGains() {
        if (!this.ctx || !this.reverbDryGain || !this.reverbWetGain) return;
        const now = this.ctx.currentTime;
        const mix = this.settings.reverbMix;

        // Controlled wet/dry mix without runaway feedback
        this.reverbDryGain.gain.setTargetAtTime(1.0 - mix * 0.5, now, 0.1);
        this.reverbWetGain.gain.setTargetAtTime(mix * 0.6, now, 0.1);
    }

    // Modular Parameter Setters
    setMasterVolume(val) {
        this.settings.masterVolume = Math.min(1.0, Math.max(0.0, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.settings.masterVolume, this.ctx.currentTime, 0.05);
        }
    }

    setFilterCutoff(hz) {
        this.settings.filterCutoff = Math.min(20000, Math.max(100, hz));
        if (this.masterFilter && this.ctx) {
            this.masterFilter.frequency.setTargetAtTime(this.settings.filterCutoff, this.ctx.currentTime, 0.05);
        }
    }

    setFilterResonance(q) {
        this.settings.filterResonance = Math.min(10, Math.max(0.1, q));
        if (this.masterFilter && this.ctx) {
            this.masterFilter.Q.setTargetAtTime(this.settings.filterResonance, this.ctx.currentTime, 0.05);
        }
    }

    setCrossfade(enabled, timeSec) {
        this.settings.crossfadeEnabled = enabled;
        if (timeSec !== undefined) this.settings.crossfadeTime = Math.max(0.05, timeSec);
    }

    setOctaveSpread(enabled, subLevel, shimmerLevel, fifthLevel) {
        this.settings.octaveSpreadEnabled = enabled;
        if (subLevel !== undefined) this.settings.subBassLevel = subLevel;
        if (shimmerLevel !== undefined) this.settings.shimmerLevel = shimmerLevel;
        if (fifthLevel !== undefined) this.settings.fifthLevel = fifthLevel;
    }

    setSustainMode(mode, freezeAmt, reverbMix, damping) {
        this.settings.sustainMode = mode;
        if (freezeAmt !== undefined) this.settings.freezeAmount = freezeAmt;
        if (reverbMix !== undefined) this.settings.reverbMix = reverbMix;
        if (damping !== undefined) {
            this.settings.reverbDamping = damping;
            if (this.reverbDampFilter && this.ctx) {
                this.reverbDampFilter.frequency.setTargetAtTime(damping, this.ctx.currentTime, 0.05);
            }
        }
        this.updateSpaceGains();
    }

    setModulation(enabled, rateHz, depth) {
        this.settings.modulationEnabled = enabled;
        if (rateHz !== undefined) {
            this.settings.lfoRate = rateHz;
            if (this.lfoOsc && this.ctx) {
                this.lfoOsc.frequency.setTargetAtTime(rateHz, this.ctx.currentTime, 0.05);
            }
        }
        if (depth !== undefined) this.settings.lfoDepth = depth;

        if (this.lfoFilterGain && this.ctx) {
            const gainVal = enabled ? this.settings.lfoDepth * 700 : 0;
            this.lfoFilterGain.gain.setTargetAtTime(gainVal, this.ctx.currentTime, 0.05);
        }
    }
}

window.DroneAudioEngine = DroneAudioEngine;
