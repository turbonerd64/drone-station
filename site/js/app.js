/**
 * Drone Station - Main Application Coordinator
 * Binds UI controls, Presets, Instrument Selectors, Chord Display, and Launchkey Mini HUD.
 */

const INSTRUMENT_CATEGORIES = [
    {
        name: '⭐ Favorite Drones',
        items: [
            { id: 'string_ensemble_1', label: '🎻 Lush String Ensemble' },
            { id: 'pad_2_warm', label: '🌌 Warm Analog Pad' },
            { id: 'acoustic_grand_piano', label: '🎹 Acoustic Grand Piano' },
            { id: 'church_organ', label: '⛪ Cathedral Church Organ' },
            { id: 'choir_aahs', label: '🎤 Choir Aahs' },
            { id: 'cello', label: '🎻 Deep Solo Cello' },
            { id: 'electric_piano_1', label: '⚡ Rhodes Electric Piano' },
            { id: 'sitar', label: '🪕 Indian Sitar & Drone' },
            { id: 'synth_analog_pad', label: '🔮 Pure Dual-Saw Synth Pad' },
            { id: 'synth_sub_organ', label: '🔮 Pure Sub Harmonics Organ' }
        ]
    },
    {
        name: '🎹 Pianos & Keys',
        items: [
            { id: 'acoustic_grand_piano', label: 'Acoustic Grand Piano' },
            { id: 'bright_acoustic_piano', label: 'Bright Piano' },
            { id: 'electric_grand_piano', label: 'Electric Grand Piano' },
            { id: 'honkytonk_piano', label: 'Honky-tonk Piano' },
            { id: 'electric_piano_1', label: 'Electric Piano 1 (Rhodes)' },
            { id: 'electric_piano_2', label: 'Electric Piano 2 (DX7)' },
            { id: 'harpsichord', label: 'Harpsichord' },
            { id: 'clavinet', label: 'Clavinet' },
            { id: 'celesta', label: 'Celesta' },
            { id: 'glockenspiel', label: 'Glockenspiel' },
            { id: 'music_box', label: 'Music Box' },
            { id: 'vibraphone', label: 'Vibraphone' },
            { id: 'marimba', label: 'Marimba' },
            { id: 'xylophone', label: 'Xylophone' },
            { id: 'tubular_bells', label: 'Tubular Bells' },
            { id: 'dulcimer', label: 'Dulcimer' }
        ]
    },
    {
        name: '⛪ Organs & Accordions',
        items: [
            { id: 'church_organ', label: 'Church Organ' },
            { id: 'drawbar_organ', label: 'Drawbar Organ (Hammond)' },
            { id: 'percussive_organ', label: 'Percussive Organ' },
            { id: 'rock_organ', label: 'Rock Organ' },
            { id: 'reed_organ', label: 'Reed Organ' },
            { id: 'accordion', label: 'Accordion' },
            { id: 'harmonica', label: 'Harmonica' },
            { id: 'tango_accordion', label: 'Tango Accordion' }
        ]
    },
    {
        name: '🎻 Strings & Orchestral',
        items: [
            { id: 'string_ensemble_1', label: 'String Ensemble 1' },
            { id: 'string_ensemble_2', label: 'String Ensemble 2' },
            { id: 'synth_strings_1', label: 'Synth Strings 1' },
            { id: 'synth_strings_2', label: 'Synth Strings 2' },
            { id: 'violin', label: 'Violin' },
            { id: 'viola', label: 'Viola' },
            { id: 'cello', label: 'Cello' },
            { id: 'contrabass', label: 'Contrabass' },
            { id: 'tremolo_strings', label: 'Tremolo Strings' },
            { id: 'pizzicato_strings', label: 'Pizzicato Strings' },
            { id: 'orchestral_harp', label: 'Orchestral Harp' },
            { id: 'choir_aahs', label: 'Choir Aahs' },
            { id: 'voice_oohs', label: 'Voice Oohs' },
            { id: 'synth_choir', label: 'Synth Choir' },
            { id: 'orchestra_hit', label: 'Orchestra Hit' }
        ]
    },
    {
        name: '🌌 Synth Pads & Leads',
        items: [
            { id: 'pad_1_new_age', label: 'Pad 1 (New Age)' },
            { id: 'pad_2_warm', label: 'Pad 2 (Warm Analog)' },
            { id: 'pad_3_polysynth', label: 'Pad 3 (Polysynth)' },
            { id: 'pad_4_choir', label: 'Pad 4 (Choir Pad)' },
            { id: 'pad_5_bowed', label: 'Pad 5 (Bowed Glass)' },
            { id: 'pad_6_metallic', label: 'Pad 6 (Metallic)' },
            { id: 'pad_7_halo', label: 'Pad 7 (Halo)' },
            { id: 'pad_8_sweep', label: 'Pad 8 (Sweep)' },
            { id: 'lead_1_square', label: 'Square Wave Lead' },
            { id: 'lead_2_sawtooth', label: 'Sawtooth Lead' },
            { id: 'lead_8_bass__lead', label: 'Bass & Lead' },
            { id: 'fx_2_soundtrack', label: 'FX Soundtrack' },
            { id: 'fx_4_atmosphere', label: 'FX Atmosphere' },
            { id: 'fx_5_brightness', label: 'FX Brightness Shimmer' },
            { id: 'synth_analog_pad', label: 'Pure Dual-Saw Synth' },
            { id: 'synth_crystal_glass', label: 'Pure FM Crystal Glass' }
        ]
    },
    {
        name: '🪕 World, Ethnic & Plucked',
        items: [
            { id: 'sitar', label: 'Sitar' },
            { id: 'kalimba', label: 'Kalimba' },
            { id: 'koto', label: 'Koto' },
            { id: 'shamisen', label: 'Shamisen' },
            { id: 'banjo', label: 'Banjo' },
            { id: 'bagpipe', label: 'Bagpipe' },
            { id: 'fiddle', label: 'Fiddle' },
            { id: 'shanai', label: 'Shanai' },
            { id: 'steel_drums', label: 'Steel Drums' }
        ]
    },
    {
        name: '🎺 Brass & Woodwinds',
        items: [
            { id: 'flute', label: 'Flute' },
            { id: 'pan_flute', label: 'Pan Flute' },
            { id: 'shakuhachi', label: 'Shakuhachi' },
            { id: 'whistle', label: 'Whistle' },
            { id: 'ocarina', label: 'Ocarina' },
            { id: 'french_horn', label: 'French Horn' },
            { id: 'brass_section', label: 'Brass Section' },
            { id: 'synth_brass_1', label: 'Synth Brass 1' },
            { id: 'soprano_sax', label: 'Soprano Sax' },
            { id: 'tenor_sax', label: 'Tenor Sax' },
            { id: 'clarinet', label: 'Clarinet' },
            { id: 'oboe', label: 'Oboe' }
        ]
    },
    {
        name: '🎸 Guitars & Basses',
        items: [
            { id: 'acoustic_guitar_nylon', label: 'Nylon Acoustic Guitar' },
            { id: 'acoustic_guitar_steel', label: 'Steel Acoustic Guitar' },
            { id: 'electric_guitar_jazz', label: 'Jazz Guitar' },
            { id: 'electric_guitar_clean', label: 'Clean Guitar' },
            { id: 'overdriven_guitar', label: 'Overdriven Guitar' },
            { id: 'acoustic_bass', label: 'Acoustic Bass' },
            { id: 'fretless_bass', label: 'Fretless Bass' },
            { id: 'synth_bass_1', label: 'Synth Bass 1' }
        ]
    }
];

const PRESETS = [
    {
        name: '🌌 Lush Ambient Bed',
        instrument: 'string_ensemble_1',
        crossfadeEnabled: true,
        crossfadeTime: 2.0,
        octaveSpreadEnabled: true,
        subBassLevel: 0.8,
        shimmerLevel: 0.5,
        fifthLevel: 0.4,
        sustainMode: 'freeze',
        freezeAmount: 0.8,
        reverbMix: 0.55,
        filterCutoff: 3800,
        filterResonance: 1.2,
        modulationEnabled: true,
        lfoRate: 0.15,
        lfoDepth: 0.45
    },
    {
        name: '🎹 Ethereal Piano Freeze',
        instrument: 'acoustic_grand_piano',
        crossfadeEnabled: true,
        crossfadeTime: 1.8,
        octaveSpreadEnabled: true,
        subBassLevel: 0.65,
        shimmerLevel: 0.6,
        fifthLevel: 0.3,
        sustainMode: 'freeze',
        freezeAmount: 0.88,
        reverbMix: 0.65,
        filterCutoff: 4200,
        filterResonance: 1.0,
        modulationEnabled: true,
        lfoRate: 0.12,
        lfoDepth: 0.35
    },
    {
        name: '🎹 Raw Acoustic Grand',
        instrument: 'acoustic_grand_piano',
        crossfadeEnabled: false,
        crossfadeTime: 0.2,
        octaveSpreadEnabled: false,
        subBassLevel: 0.0,
        shimmerLevel: 0.0,
        fifthLevel: 0.0,
        sustainMode: 'natural',
        freezeAmount: 0.0,
        reverbMix: 0.2,
        filterCutoff: 16000,
        filterResonance: 0.5,
        modulationEnabled: false,
        lfoRate: 0.1,
        lfoDepth: 0.0
    },
    {
        name: '⛪ Cathedral Church',
        instrument: 'church_organ',
        crossfadeEnabled: true,
        crossfadeTime: 1.5,
        octaveSpreadEnabled: true,
        subBassLevel: 0.9,
        shimmerLevel: 0.3,
        fifthLevel: 0.6,
        sustainMode: 'natural',
        freezeAmount: 0.0,
        reverbMix: 0.45,
        filterCutoff: 5000,
        filterResonance: 1.0,
        modulationEnabled: false,
        lfoRate: 0.2,
        lfoDepth: 0.0
    },
    {
        name: '🔮 Warm Analog Pad',
        instrument: 'pad_2_warm',
        crossfadeEnabled: true,
        crossfadeTime: 2.2,
        octaveSpreadEnabled: true,
        subBassLevel: 0.75,
        shimmerLevel: 0.5,
        fifthLevel: 0.3,
        sustainMode: 'natural',
        freezeAmount: 0.0,
        reverbMix: 0.4,
        filterCutoff: 2600,
        filterResonance: 2.0,
        modulationEnabled: true,
        lfoRate: 0.2,
        lfoDepth: 0.6
    },
    {
        name: '🎤 Sacred Choir Drone',
        instrument: 'choir_aahs',
        crossfadeEnabled: true,
        crossfadeTime: 2.5,
        octaveSpreadEnabled: true,
        subBassLevel: 0.7,
        shimmerLevel: 0.65,
        fifthLevel: 0.5,
        sustainMode: 'freeze',
        freezeAmount: 0.75,
        reverbMix: 0.6,
        filterCutoff: 3500,
        filterResonance: 1.4,
        modulationEnabled: true,
        lfoRate: 0.16,
        lfoDepth: 0.4
    },
    {
        name: '🪕 Mystic Sitar & Tanpura',
        instrument: 'sitar',
        crossfadeEnabled: true,
        crossfadeTime: 1.8,
        octaveSpreadEnabled: true,
        subBassLevel: 0.8,
        shimmerLevel: 0.3,
        fifthLevel: 0.85,
        sustainMode: 'freeze',
        freezeAmount: 0.78,
        reverbMix: 0.5,
        filterCutoff: 4000,
        filterResonance: 2.2,
        modulationEnabled: true,
        lfoRate: 0.22,
        lfoDepth: 0.5
    },
    {
        name: '🎻 Deep Cello Chamber',
        instrument: 'cello',
        crossfadeEnabled: true,
        crossfadeTime: 1.6,
        octaveSpreadEnabled: true,
        subBassLevel: 0.85,
        shimmerLevel: 0.2,
        fifthLevel: 0.4,
        sustainMode: 'natural',
        freezeAmount: 0.0,
        reverbMix: 0.35,
        filterCutoff: 2800,
        filterResonance: 1.5,
        modulationEnabled: true,
        lfoRate: 0.25,
        lfoDepth: 0.3
    }
];

class DroneApp {
    constructor() {
        this.engine = new DroneAudioEngine();
        this.midi = null;
        this.visualizer = null;
        this.isStarted = false;
        this.beginAudio = null;

        // Quick Drone State (No MIDI required)
        this.currentRootPitchClass = 5; // Default F
        this.currentOctave = 3;         // Default C3
        this.currentIntervals = [0, 4, 7]; // Default Major Triad
        this.isDroneSounding = false;
    }

    async init() {
        this.setupInstrumentDropdown();
        this.setupPresetButtons();
        this.bindModularControls();
        this.bindLaunchkeyHUD();
        this.bindQuickDroneSelector();

        // First click unlocks Web Audio
        const startOverlay = document.getElementById('start-overlay');
        const startBtn = document.getElementById('btn-start-audio');

        const begin = async () => {
            if (this.isStarted) return;
            this.isStarted = true;
            await this.engine.init();

            this.visualizer = new VisualizerManager(
                this.engine,
                document.getElementById('canvas-spectrum'),
                document.getElementById('virtual-piano')
            );

            this.midi = new MidiManager(this.engine, (e) => this.handleMidiEvent(e));
            await this.midi.init();

            this.engine.onStateChange = () => {
                const sounding = this.engine.computeSoundingNotes(this.engine.latchedMidiNotes);
                this.visualizer.updateActiveKeys(sounding);
                this.updateActivePitchesList(sounding);
            };

            if (startOverlay) {
                startOverlay.style.opacity = '0';
                setTimeout(() => startOverlay.style.display = 'none', 300);
            }

            // Silent start: Awaiting user keyboard input
            this.updateChordDisplay([]);
        };

        this.beginAudio = begin;

        if (startBtn) startBtn.addEventListener('click', begin);
        document.body.addEventListener('click', () => { if (!this.isStarted) begin(); }, { once: true });
    }

    setupInstrumentDropdown() {
        const selectEl = document.getElementById('instrument-select');
        if (!selectEl) return;
        selectEl.innerHTML = '';

        for (const cat of INSTRUMENT_CATEGORIES) {
            const group = document.createElement('optgroup');
            group.label = cat.name;
            for (const item of cat.items) {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.label;
                if (item.id === this.engine.currentInstrument) opt.selected = true;
                group.appendChild(opt);
            }
            selectEl.appendChild(group);
        }

        selectEl.addEventListener('change', async (e) => {
            const chosen = e.target.value;
            const progressEl = document.getElementById('instrument-progress');
            const progressFill = document.getElementById('instrument-progress-fill');
            const statusText = document.getElementById('instrument-loading-text');

            if (progressEl) progressEl.style.display = 'block';
            if (statusText) statusText.textContent = `Loading ${chosen}...`;

            try {
                await this.engine.loadInstrument(chosen, (pct) => {
                    if (progressFill) progressFill.style.width = `${pct}%`;
                });
                if (statusText) statusText.textContent = `Ready`;
                setTimeout(() => { if (progressEl) progressEl.style.display = 'none'; }, 600);

                // If drone was currently active, refresh voices with new instrument
                if (this.engine.latchedMidiNotes.length > 0) {
                    this.engine.triggerChord(this.engine.latchedMidiNotes);
                }
            } catch (err) {
                if (statusText) statusText.textContent = `Error loading instrument`;
            }
        });
    }

    setupPresetButtons() {
        const presetContainer = document.getElementById('presets-list');
        if (!presetContainer) return;
        presetContainer.innerHTML = '';

        PRESETS.forEach((preset, idx) => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.name;
            btn.addEventListener('click', () => this.applyPreset(preset));
            presetContainer.appendChild(btn);
        });
    }

    applyPreset(preset) {
        // Apply to audio engine
        this.engine.settings.crossfadeEnabled = preset.crossfadeEnabled;
        this.engine.settings.crossfadeTime = preset.crossfadeTime;
        this.engine.settings.octaveSpreadEnabled = preset.octaveSpreadEnabled;
        this.engine.settings.subBassLevel = preset.subBassLevel;
        this.engine.settings.shimmerLevel = preset.shimmerLevel;
        this.engine.settings.fifthLevel = preset.fifthLevel;
        this.engine.settings.sustainMode = preset.sustainMode;
        this.engine.settings.freezeAmount = preset.freezeAmount;
        this.engine.settings.reverbMix = preset.reverbMix;
        this.engine.settings.filterCutoff = preset.filterCutoff;
        this.engine.settings.filterResonance = preset.filterResonance;
        this.engine.settings.modulationEnabled = preset.modulationEnabled;
        this.engine.settings.lfoRate = preset.lfoRate;
        this.engine.settings.lfoDepth = preset.lfoDepth;

        // Apply to hardware/nodes
        this.engine.setFilterCutoff(preset.filterCutoff);
        this.engine.setFilterResonance(preset.filterResonance);
        this.engine.setModulation(preset.modulationEnabled, preset.lfoRate, preset.lfoDepth);
        this.engine.setSustainMode(preset.sustainMode, preset.freezeAmount, preset.reverbMix);

        // Update UI controls
        this.syncUIWithSettings();

        // Switch instrument
        const selectEl = document.getElementById('instrument-select');
        if (selectEl && selectEl.value !== preset.instrument) {
            selectEl.value = preset.instrument;
            selectEl.dispatchEvent(new Event('change'));
        } else if (this.engine.latchedMidiNotes.length > 0) {
            this.engine.triggerChord(this.engine.latchedMidiNotes);
        }
    }

    bindModularControls() {
        // Crossfade Toggle & Slider
        const toggleCrossfade = document.getElementById('toggle-crossfade');
        const sliderCrossfade = document.getElementById('slider-crossfade');
        const labelCrossfade = document.getElementById('val-crossfade');

        if (toggleCrossfade) {
            toggleCrossfade.addEventListener('change', (e) => {
                this.engine.setCrossfade(e.target.checked);
            });
        }
        if (sliderCrossfade) {
            sliderCrossfade.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.engine.setCrossfade(this.engine.settings.crossfadeEnabled, val);
                if (labelCrossfade) labelCrossfade.textContent = `${val.toFixed(1)}s`;
            });
        }

        // Octave Spread Controls
        const toggleSpread = document.getElementById('toggle-spread');
        const sliderSub = document.getElementById('slider-sub-level');
        const sliderShimmer = document.getElementById('slider-shimmer-level');
        const sliderFifth = document.getElementById('slider-fifth-level');

        if (toggleSpread) {
            toggleSpread.addEventListener('change', (e) => {
                this.engine.setOctaveSpread(e.target.checked);
                this.engine.onStateChange();
            });
        }
        if (sliderSub) {
            sliderSub.addEventListener('input', (e) => {
                this.engine.setOctaveSpread(this.engine.settings.octaveSpreadEnabled, parseFloat(e.target.value));
                this.engine.onStateChange();
            });
        }
        if (sliderShimmer) {
            sliderShimmer.addEventListener('input', (e) => {
                this.engine.setOctaveSpread(this.engine.settings.octaveSpreadEnabled, undefined, parseFloat(e.target.value));
                this.engine.onStateChange();
            });
        }
        if (sliderFifth) {
            sliderFifth.addEventListener('input', (e) => {
                this.engine.setOctaveSpread(this.engine.settings.octaveSpreadEnabled, undefined, undefined, parseFloat(e.target.value));
                this.engine.onStateChange();
            });
        }

        // Sustain Mode & Freeze Controls
        const radioFreeze = document.getElementById('mode-freeze');
        const radioNatural = document.getElementById('mode-natural');
        const sliderFreezeAmt = document.getElementById('slider-freeze-amount');
        const sliderReverbMix = document.getElementById('slider-reverb-mix');
        const sliderDamping = document.getElementById('slider-reverb-damp');

        const updateSustainMode = () => {
            const mode = radioFreeze && radioFreeze.checked ? 'freeze' : 'natural';
            this.engine.setSustainMode(mode);
        };
        if (radioFreeze) radioFreeze.addEventListener('change', updateSustainMode);
        if (radioNatural) radioNatural.addEventListener('change', updateSustainMode);

        if (sliderFreezeAmt) {
            sliderFreezeAmt.addEventListener('input', (e) => {
                this.engine.setSustainMode(this.engine.settings.sustainMode, parseFloat(e.target.value));
            });
        }
        if (sliderReverbMix) {
            sliderReverbMix.addEventListener('input', (e) => {
                this.engine.setSustainMode(this.engine.settings.sustainMode, undefined, parseFloat(e.target.value));
            });
        }
        if (sliderDamping) {
            sliderDamping.addEventListener('input', (e) => {
                this.engine.setSustainMode(this.engine.settings.sustainMode, undefined, undefined, parseFloat(e.target.value));
            });
        }

        // Modulation Controls
        const toggleMod = document.getElementById('toggle-modulation');
        const sliderLfoRate = document.getElementById('slider-lfo-rate');
        const sliderLfoDepth = document.getElementById('slider-lfo-depth');

        if (toggleMod) {
            toggleMod.addEventListener('change', (e) => {
                this.engine.setModulation(e.target.checked);
            });
        }
        if (sliderLfoRate) {
            sliderLfoRate.addEventListener('input', (e) => {
                this.engine.setModulation(this.engine.settings.modulationEnabled, parseFloat(e.target.value));
            });
        }
        if (sliderLfoDepth) {
            sliderLfoDepth.addEventListener('input', (e) => {
                this.engine.setModulation(this.engine.settings.modulationEnabled, undefined, parseFloat(e.target.value));
            });
        }

        // Master Filter & Volume Controls
        const sliderCutoff = document.getElementById('slider-cutoff');
        const sliderRes = document.getElementById('slider-resonance');
        const sliderVolume = document.getElementById('slider-volume');

        if (sliderCutoff) {
            sliderCutoff.addEventListener('input', (e) => {
                const norm = parseFloat(e.target.value) / 100.0;
                const hz = 150 * Math.pow(18000 / 150, norm);
                this.engine.setFilterCutoff(hz);
                const lbl = document.getElementById('val-cutoff');
                if (lbl) lbl.textContent = `${Math.round(hz)} Hz`;
            });
        }
        if (sliderRes) {
            sliderRes.addEventListener('input', (e) => {
                this.engine.setFilterResonance(parseFloat(e.target.value));
            });
        }
        if (sliderVolume) {
            sliderVolume.addEventListener('input', (e) => {
                this.engine.setMasterVolume(parseFloat(e.target.value));
            });
        }

        // Panic / Clear Button
        const btnPanic = document.getElementById('btn-panic');
        if (btnPanic) {
            btnPanic.addEventListener('click', () => {
                this.engine.panic();
                if (this.visualizer) {
                    this.visualizer.updateActiveKeys([]);
                }
                this.updateActivePitchesList([]);
                this.updateChordDisplay([]);

                // Visual flash on button
                btnPanic.style.transform = 'scale(0.94)';
                btnPanic.style.background = 'rgba(239, 68, 68, 0.6)';
                btnPanic.textContent = 'SILENCED!';
                setTimeout(() => {
                    btnPanic.style.transform = '';
                    btnPanic.style.background = '';
                    btnPanic.textContent = '⚡ PANIC / KILL';
                }, 700);
            });
        }
    }

    syncUIWithSettings() {
        const s = this.engine.settings;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setChecked = (id, chk) => { const el = document.getElementById(id); if (el) el.checked = chk; };

        setChecked('toggle-crossfade', s.crossfadeEnabled);
        setVal('slider-crossfade', s.crossfadeTime);
        const lblCrossfade = document.getElementById('val-crossfade');
        if (lblCrossfade) lblCrossfade.textContent = `${s.crossfadeTime.toFixed(1)}s`;

        setChecked('toggle-spread', s.octaveSpreadEnabled);
        setVal('slider-sub-level', s.subBassLevel);
        setVal('slider-shimmer-level', s.shimmerLevel);
        setVal('slider-fifth-level', s.fifthLevel);

        setChecked('mode-freeze', s.sustainMode === 'freeze');
        setChecked('mode-natural', s.sustainMode === 'natural');
        setVal('slider-freeze-amount', s.freezeAmount);
        setVal('slider-reverb-mix', s.reverbMix);

        setChecked('toggle-modulation', s.modulationEnabled);
        setVal('slider-lfo-rate', s.lfoRate);
        setVal('slider-lfo-depth', s.lfoDepth);

        setVal('slider-volume', s.masterVolume);
    }

    bindLaunchkeyHUD() {
        // Render 8 Rotary Knob widgets
        const knobsRow = document.getElementById('launchkey-knobs-grid');
        if (knobsRow) {
            knobsRow.innerHTML = '';
            const knobDefs = [
                { key: 'masterVolume', name: 'Master Vol', cc: 21 },
                { key: 'filterCutoff', name: 'Filter Cut', cc: 22 },
                { key: 'reverbMix', name: 'Space Mix', cc: 23 },
                { key: 'freezeAmount', name: 'Freeze Blur', cc: 24 },
                { key: 'subBassLevel', name: 'Sub-Bass', cc: 25 },
                { key: 'crossfadeTime', name: 'Crossfade', cc: 26 },
                { key: 'lfoRate', name: 'Mod Rate', cc: 27 },
                { key: 'filterResonance', name: 'Resonance', cc: 28 }
            ];

            knobDefs.forEach((k, idx) => {
                const knobBox = document.createElement('div');
                knobBox.className = 'knob-widget';
                knobBox.id = `knob-widget-${k.key}`;
                knobBox.innerHTML = `
                    <div class="knob-ring-outer">
                        <div class="knob-cap">
                            <div class="knob-notch"></div>
                        </div>
                    </div>
                    <div class="knob-meta">
                        <span class="knob-name">K${idx + 1}: ${k.name}</span>
                        <div class="knob-subline">
                            <span class="knob-cc">CC ${k.cc}</span>
                            <button class="btn-learn" data-param="${k.key}">Learn</button>
                        </div>
                    </div>
                `;

                // Handle MIDI Learn click
                const learnBtn = knobBox.querySelector('.btn-learn');
                learnBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.midi) {
                        this.midi.startLearning(k.key);
                    }
                });

                knobsRow.appendChild(knobBox);
            });
        }

        // Render 16 RGB Pad widgets
        const padsGrid = document.getElementById('launchkey-pads-grid');
        if (padsGrid) {
            padsGrid.innerHTML = '';
            const padNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Oct-', 'Oct+', 'Freeze', 'Clear'];

            for (let i = 0; i < 16; i++) {
                const pad = document.createElement('div');
                pad.className = 'pad-widget';
                pad.id = `pad-${i}`;
                pad.textContent = padNotes[i] || `P${i + 1}`;

                pad.addEventListener('click', () => {
                    if (this.midi) {
                        this.midi.handlePadHit(36 + i, 100);
                    }
                });

                padsGrid.appendChild(pad);
            }
        }
    }

    handleMidiEvent(event) {
        switch (event.type) {
            case 'device_selected':
            case 'device_list_updated':
                const devName = event.current ? event.current.name : 'No MIDI Controller detected';
                const devStatusEl = document.getElementById('midi-device-name');
                const devIndicator = document.getElementById('midi-status-indicator');
                if (devStatusEl) devStatusEl.textContent = devName;
                if (devIndicator) {
                    devIndicator.className = event.current ? 'status-dot online' : 'status-dot offline';
                }
                break;

            case 'chord_triggered':
                this.updateChordDisplay(event.notes);
                break;

            case 'knob_moved':
                this.updateKnobHUD(event.param, event.norm);
                this.syncUIWithSettings();
                break;

            case 'pad_hit':
                const padEl = document.getElementById(`pad-${event.padIndex}`);
                if (padEl) {
                    padEl.classList.add('hit');
                    setTimeout(() => padEl.classList.remove('hit'), 150);
                }
                break;

            case 'learning_started':
                const learnBtn = document.querySelector(`.btn-learn[data-param="${event.paramKey}"]`);
                if (learnBtn) {
                    learnBtn.textContent = 'Twist Knob...';
                    learnBtn.classList.add('learning');
                }
                break;

            case 'learn_completed':
                document.querySelectorAll('.btn-learn').forEach(b => {
                    b.textContent = 'Learn';
                    b.classList.remove('learning');
                });
                const box = document.getElementById(`knob-widget-${event.target}`);
                if (box) {
                    const ccLabel = box.querySelector('.knob-cc');
                    if (ccLabel) ccLabel.textContent = `CC ${event.cc}`;
                }
                break;
        }
    }

    updateKnobHUD(paramKey, normVal) {
        const box = document.getElementById(`knob-widget-${paramKey}`);
        if (!box) return;
        const notch = box.querySelector('.knob-notch');
        if (notch) {
            // Rotate from -135deg to +135deg
            const angle = -135 + normVal * 270;
            notch.style.transform = `rotate(${angle}deg)`;
        }
    }

    updateChordDisplay(midiNotes) {
        const info = window.DroneChordDetector.detectChord(midiNotes);

        const chordTitle = document.getElementById('chord-display-title');
        const chordDesc = document.getElementById('chord-display-desc');
        const scalesList = document.getElementById('scales-list');

        if (chordTitle) chordTitle.textContent = info.displayName;
        if (chordDesc) chordDesc.textContent = info.fullChord;

        if (scalesList) {
            scalesList.innerHTML = '';
            info.scales.forEach(s => {
                const li = document.createElement('li');
                li.className = 'scale-badge';
                li.textContent = s;
                scalesList.appendChild(li);
            });
        }
    }

    updateActivePitchesList(soundingPitches) {
        const container = document.getElementById('active-pitches-list');
        if (!container) return;
        container.innerHTML = '';

        if (!soundingPitches || soundingPitches.length === 0) {
            container.innerHTML = '<span class="empty-note">No active drone</span>';
            return;
        }

        soundingPitches.forEach(p => {
            const tag = document.createElement('span');
            tag.className = `pitch-tag ${p.type}`;
            const name = window.DroneChordDetector.midiToNoteName(p.midi);
            const freq = window.DroneChordDetector.midiToFrequency(p.midi);
            tag.textContent = `${name} (${freq}Hz)`;
            container.appendChild(tag);
        });
    }

    bindQuickDroneSelector() {
        const pitchButtons = document.querySelectorAll('.pitch-btn');
        const modifierButtons = document.querySelectorAll('.mod-btn');
        const octaveButtons = document.querySelectorAll('.oct-btn');
        const stopBtn = document.getElementById('btn-quick-stop');

        // Pitch Buttons (C through B)
        pitchButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                pitchButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentRootPitchClass = parseInt(btn.dataset.pc, 10);
                await this.triggerQuickDrone();
            });
        });

        // Voicing & Chord Modifier Buttons
        modifierButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                modifierButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentIntervals = btn.dataset.intervals.split(',').map(Number);
                await this.triggerQuickDrone();
            });
        });

        // Octave Buttons (C2 Bass, C3 Mid, C4 High)
        octaveButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                octaveButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentOctave = parseInt(btn.dataset.oct, 10);
                if (this.isDroneSounding) {
                    await this.triggerQuickDrone();
                }
            });
        });

        // Quick Stop Button
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopQuickDrone();
            });
        }
    }

    async triggerQuickDrone() {
        if (!this.isStarted && this.beginAudio) {
            await this.beginAudio();
        }

        const baseMidi = (this.currentOctave + 1) * 12 + this.currentRootPitchClass;
        const chordNotes = this.currentIntervals.map(interval => baseMidi + interval);

        this.isDroneSounding = true;
        this.engine.triggerChord(chordNotes);
        this.updateChordDisplay(chordNotes);
    }

    stopQuickDrone() {
        this.isDroneSounding = false;
        this.engine.panic();
        if (this.visualizer) {
            this.visualizer.updateActiveKeys([]);
        }
        this.updateActivePitchesList([]);
        this.updateChordDisplay([]);

        const stopBtn = document.getElementById('btn-quick-stop');
        if (stopBtn) {
            stopBtn.style.transform = 'scale(0.94)';
            stopBtn.textContent = 'STOPPED';
            setTimeout(() => {
                stopBtn.style.transform = '';
                stopBtn.textContent = '⏹ STOP DRONE';
            }, 600);
        }
    }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
    window.droneApp = new DroneApp();
    window.droneApp.init();
});
