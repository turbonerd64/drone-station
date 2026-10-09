/**
 * Novation Launchkey Mini Web MIDI Manager
 * Handles keyboard chords, 8 rotary knobs with MIDI Learn, and 16 velocity-sensitive pads.
 */

class MidiManager {
    constructor(audioEngine, onMidiEvent = () => {}) {
        this.engine = audioEngine;
        this.onMidiEvent = onMidiEvent;
        this.midiAccess = null;
        this.currentInput = null;
        this.inputs = [];

        // Chord buffer for grouping simultaneous or rolled notes
        this.heldPhysicalKeys = new Set();
        this.chordCollectTimer = null;
        this.chordWindowMs = 45; // Group notes struck within 45ms into single chord

        // Novation Launchkey Mini Knobs Mappings (Default CC 21 - 28)
        this.defaultKnobCCs = [21, 22, 23, 24, 25, 26, 27, 28];
        this.knobBindings = this.loadKnobBindings();

        // MIDI Learn State
        this.learningTarget = null; // null or parameter key like 'filterCutoff'

        // Pad Mode: 'drone_roots' or 'presets'
        this.padMode = 'drone_roots';

        // Root note mapping for 16 pads
        this.padRootMap = [
            { note: 60, name: 'C' },  { note: 61, name: 'C#' }, { note: 62, name: 'D' },  { note: 63, name: 'D#' },
            { note: 64, name: 'E' },  { note: 65, name: 'F' },  { note: 66, name: 'F#' }, { note: 67, name: 'G' },
            { note: 68, name: 'G#' }, { note: 69, name: 'A' },  { note: 70, name: 'A#' }, { note: 71, name: 'B' },
            { note: 48, name: 'Oct-' }, { note: 72, name: 'Oct+' }, { action: 'freeze', name: 'Freeze' }, { action: 'clear', name: 'Clear' }
        ];
    }

    loadKnobBindings() {
        const saved = localStorage.getItem('drone_midi_knobs');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {
            masterVolume: 21,
            filterCutoff: 22,
            reverbMix: 23,
            freezeAmount: 24,
            subBassLevel: 25,
            crossfadeTime: 26,
            lfoRate: 27,
            filterResonance: 28
        };
    }

    saveKnobBindings() {
        localStorage.setItem('drone_midi_knobs', JSON.stringify(this.knobBindings));
    }

    async init() {
        if (!navigator.requestMIDIAccess) {
            console.warn('Web MIDI API is not supported in this browser.');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
            this.updateInputs();
            this.midiAccess.onstatechange = () => this.updateInputs();
            return true;
        } catch (e) {
            console.warn('MIDI Access request denied or failed:', e);
            return false;
        }
    }

    updateInputs() {
        if (!this.midiAccess) return;
        this.inputs = [];
        const iter = this.midiAccess.inputs.values();
        for (let input of iter) {
            this.inputs.push(input);
        }

        // Auto-select Novation Launchkey Mini if available
        let bestMatch = this.inputs.find(i => /launchkey/i.test(i.name));
        if (!bestMatch && this.inputs.length > 0) {
            bestMatch = this.inputs[0];
        }

        if (bestMatch && (!this.currentInput || this.currentInput.id !== bestMatch.id)) {
            this.selectInput(bestMatch.id);
        }

        this.onMidiEvent({ type: 'device_list_updated', inputs: this.inputs, current: this.currentInput });
    }

    selectInput(inputId) {
        if (this.currentInput) {
            this.currentInput.onmidimessage = null;
        }

        this.currentInput = this.inputs.find(i => i.id === inputId) || null;
        if (this.currentInput) {
            this.currentInput.onmidimessage = (e) => this.handleMidiMessage(e);
            console.log(`[MIDI] Connected to: ${this.currentInput.name}`);
        }
        this.onMidiEvent({ type: 'device_selected', current: this.currentInput });
    }

    handleMidiMessage(event) {
        const [status, data1, data2] = event.data;
        const command = status >> 4;
        const channel = status & 0xf;

        // Note On (with velocity > 0)
        if (command === 9 && data2 > 0) {
            this.handleNoteOn(data1, data2, channel);
        }
        // Note Off (or Note On with velocity 0)
        else if (command === 8 || (command === 9 && data2 === 0)) {
            this.handleNoteOff(data1, channel);
        }
        // Control Change (Knobs / Modulation / Sustain)
        else if (command === 11) {
            this.handleControlChange(data1, data2);
        }
        // Pitch Bend
        else if (command === 14) {
            const bendVal = ((data2 << 7) | data1) - 8192;
            this.onMidiEvent({ type: 'pitch_bend', value: bendVal / 8192 });
        }
    }

    handleNoteOn(note, velocity, channel) {
        // Check if note came from Launchkey Mini drum pads (typically channel 9 / 10 or notes 36..51)
        const isPad = channel === 9 || (channel === 0 && (note >= 36 && note <= 51) && this.padMode === 'presets');

        if (isPad) {
            this.handlePadHit(note, velocity);
            return;
        }

        // Standard Keyboard Note
        this.heldPhysicalKeys.add(note);

        if (this.chordCollectTimer) {
            clearTimeout(this.chordCollectTimer);
        }

        // Delay slightly to collect all notes in rolled chords
        this.chordCollectTimer = setTimeout(() => {
            const chord = Array.from(this.heldPhysicalKeys);
            if (chord.length > 0) {
                this.engine.triggerChord(chord);
                this.onMidiEvent({ type: 'chord_triggered', notes: chord });
            }
        }, this.chordWindowMs);

        this.onMidiEvent({ type: 'note_on', note, velocity });
    }

    handleNoteOff(note, channel) {
        this.heldPhysicalKeys.delete(note);

        // If momentary mode is on, release chord when all keys released
        if (this.engine.settings.latchMode === 'momentary') {
            if (this.heldPhysicalKeys.size === 0) {
                this.engine.releaseAllVoices(this.engine.settings.crossfadeTime);
                this.onMidiEvent({ type: 'chord_released' });
            }
        }

        this.onMidiEvent({ type: 'note_off', note });
    }

    handleControlChange(cc, value) {
        const norm = value / 127.0; // 0.0 to 1.0

        // If currently in MIDI Learn mode
        if (this.learningTarget) {
            this.knobBindings[this.learningTarget] = cc;
            this.saveKnobBindings();
            const target = this.learningTarget;
            this.learningTarget = null;
            this.onMidiEvent({ type: 'learn_completed', target, cc });
            return;
        }

        // Find which parameter this CC is bound to
        for (const [param, boundCC] of Object.entries(this.knobBindings)) {
            if (boundCC === cc) {
                this.applyParameterChange(param, norm);
                this.onMidiEvent({ type: 'knob_moved', param, cc, value, norm });
                return;
            }
        }

        // Sustain Pedal (CC 64)
        if (cc === 64) {
            if (value >= 64) {
                // Sustain pedal pressed: lock current freeze
                this.engine.updateFreezeState();
            }
        }
    }

    applyParameterChange(param, norm) {
        switch (param) {
            case 'masterVolume':
                this.engine.setMasterVolume(norm * 1.2);
                break;
            case 'filterCutoff':
                // Logarithmic frequency scale from 150 Hz to 18000 Hz
                const cutoffHz = 150 * Math.pow(18000 / 150, norm);
                this.engine.setFilterCutoff(cutoffHz);
                break;
            case 'filterResonance':
                this.engine.setFilterResonance(norm * 12.0);
                break;
            case 'reverbMix':
                this.engine.setSustainMode(this.engine.settings.sustainMode, undefined, norm, undefined);
                break;
            case 'freezeAmount':
                this.engine.setSustainMode(this.engine.settings.sustainMode, norm, undefined, undefined);
                break;
            case 'crossfadeTime':
                // 0.1s to 5.0s
                this.engine.setCrossfade(this.engine.settings.crossfadeEnabled, 0.1 + norm * 4.9);
                break;
            case 'subBassLevel':
                this.engine.setOctaveSpread(this.engine.settings.octaveSpreadEnabled, norm, undefined, undefined);
                break;
            case 'lfoRate':
                // 0.05 Hz to 4.0 Hz
                this.engine.setModulation(this.engine.settings.modulationEnabled, 0.05 + norm * 3.95, undefined, undefined);
                break;
        }
    }

    handlePadHit(note, velocity) {
        const padIndex = (note >= 36 && note <= 51) ? (note - 36) : (note % 16);
        this.onMidiEvent({ type: 'pad_hit', padIndex, velocity });

        if (this.padMode === 'drone_roots') {
            const mapping = this.padRootMap[padIndex];
            if (!mapping) return;

            if (mapping.action === 'freeze') {
                const newMode = this.engine.settings.sustainMode === 'freeze' ? 'natural' : 'freeze';
                this.engine.setSustainMode(newMode);
            } else if (mapping.action === 'clear') {
                this.engine.panic();
            } else if (mapping.note) {
                // Trigger single root drone
                this.engine.triggerChord([mapping.note]);
                this.onMidiEvent({ type: 'chord_triggered', notes: [mapping.note] });
            }
        }
    }

    startLearning(paramKey) {
        this.learningTarget = paramKey;
        this.onMidiEvent({ type: 'learning_started', paramKey });
    }

    cancelLearning() {
        this.learningTarget = null;
        this.onMidiEvent({ type: 'learning_canceled' });
    }
}

window.MidiManager = MidiManager;
