/**
 * Drone Station Visualizer & UI Component Renderer
 * Handles interactive 61-key piano keyboard, real-time spectrum visualizer, and hardware HUD.
 */

class VisualizerManager {
    constructor(audioEngine, canvasSpectrum, keyboardContainer) {
        this.engine = audioEngine;
        this.canvas = canvasSpectrum;
        this.ctx = canvasSpectrum ? canvasSpectrum.getContext('2d') : null;
        this.keyboardEl = keyboardContainer;
        this.animFrameId = null;

        this.keyElements = new Map(); // midi -> DOM element
        this.activeMidiMap = new Map(); // midi -> type ('core', 'sub_bass', 'shimmer', 'fifth_drone')

        this.initKeyboard();
        this.startRenderLoop();
    }

    initKeyboard() {
        if (!this.keyboardEl) return;
        this.keyboardEl.innerHTML = '';

        // Render 5 octaves: C2 (MIDI 36) to C7 (MIDI 96)
        const startMidi = 36;
        const endMidi = 96;

        const isBlackKey = (midi) => {
            const pc = midi % 12;
            return [1, 3, 6, 8, 10].includes(pc);
        };

        const keyboardWrapper = document.createElement('div');
        keyboardWrapper.className = 'piano-wrapper';

        for (let midi = startMidi; midi <= endMidi; midi++) {
            const key = document.createElement('div');
            const black = isBlackKey(midi);
            key.className = `piano-key ${black ? 'black-key' : 'white-key'}`;
            key.dataset.midi = midi;

            const label = document.createElement('span');
            label.className = 'key-label';
            const noteName = window.DroneChordDetector.NOTE_NAMES[midi % 12];
            const oct = Math.floor(midi / 12) - 1;
            label.textContent = midi % 12 === 0 ? `C${oct}` : '';
            key.appendChild(label);

            // Click to trigger single note or chord
            key.addEventListener('mousedown', () => {
                this.engine.triggerChord([midi]);
                if (window.droneApp) {
                    window.droneApp.updateChordDisplay([midi]);
                }
            });

            keyboardWrapper.appendChild(key);
            this.keyElements.set(midi, key);
        }

        this.keyboardEl.appendChild(keyboardWrapper);
    }

    updateActiveKeys(soundingNotes) {
        // Clear old highlights
        for (const [midi, el] of this.keyElements) {
            el.classList.remove('active-core', 'active-sub', 'active-shimmer', 'active-fifth');
        }

        this.activeMidiMap.clear();

        if (!soundingNotes) return;

        for (const item of soundingNotes) {
            const midi = item.midi;
            this.activeMidiMap.set(midi, item.type);

            const el = this.keyElements.get(midi);
            if (el) {
                if (item.type === 'core') el.classList.add('active-core');
                else if (item.type === 'sub_bass') el.classList.add('active-sub');
                else if (item.type === 'shimmer') el.classList.add('active-shimmer');
                else if (item.type === 'fifth_drone') el.classList.add('active-fifth');
            }
        }
    }

    startRenderLoop() {
        if (!this.canvas || !this.ctx) return;

        const draw = () => {
            this.renderVisuals();
            this.animFrameId = requestAnimationFrame(draw);
        };
        draw();
    }

    renderVisuals() {
        if (!this.engine.analyser) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, width, height);

        const bufferLength = this.engine.analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        this.engine.analyser.getByteFrequencyData(freqData);

        // Ambient Background Glow
        const bgGrad = ctx.createLinearGradient(0, height, 0, 0);
        bgGrad.addColorStop(0, 'rgba(10, 15, 29, 0.95)');
        bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw Ambient Frequency Harmonic Bars
        const barCount = 64;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
            // Logarithmic bin sampling for musical harmonic response
            const binIndex = Math.floor(Math.pow(i / barCount, 2.2) * (bufferLength * 0.45));
            const val = freqData[binIndex] || 0;
            const barHeight = (val / 255.0) * height * 0.85;

            const x = i * barWidth;
            const y = height - barHeight;

            const grad = ctx.createLinearGradient(x, height, x, y);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
            grad.addColorStop(0.5, 'rgba(129, 140, 248, 0.4)');
            grad.addColorStop(1, 'rgba(236, 72, 153, 0.85)');

            ctx.fillStyle = grad;
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }

        // Overlay Smooth Glowing Waveform
        const timeData = new Uint8Array(bufferLength);
        this.engine.analyser.getByteTimeDomainData(timeData);

        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;

        const sliceWidth = width / bufferLength;
        let xPos = 0;

        for (let i = 0; i < bufferLength; i += 4) {
            const v = timeData[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) ctx.moveTo(xPos, y);
            else ctx.lineTo(xPos, y);

            xPos += sliceWidth * 4;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // Reset blur
    }
}

window.VisualizerManager = VisualizerManager;
