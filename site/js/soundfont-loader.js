/**
 * SoundFont Loader & Sample Decoder with Seamless Infinite Loop Processing & IndexedDB Caching
 * Provides high-speed loading and artifact-free infinite sustain for all 128 General MIDI instruments.
 */

class SoundFontLoader {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.cache = new Map(); // instrumentName -> { buffers: Map(midi -> { rawBuffer, loopBuffer }), sampleMidis: [] }
        this.loadingPromises = new Map();
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                resolve(null);
                return;
            }
            const req = indexedDB.open('DroneStationSoundFonts', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('fonts')) {
                    db.createObjectStore('fonts');
                }
            };
            req.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            req.onerror = () => resolve(null);
        });
    }

    async getFromDB(key) {
        if (!this.db) return null;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction('fonts', 'readonly');
                const store = tx.objectStore('fonts');
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    }

    async saveToDB(key, val) {
        if (!this.db) return;
        try {
            const tx = this.db.transaction('fonts', 'readwrite');
            const store = tx.objectStore('fonts');
            store.put(val, key);
        } catch (err) {
            console.warn('Could not save to IndexedDB', err);
        }
    }

    /**
     * Transforms a raw finite sample into a mathematically seamless infinite loop.
     * 1. Skips the initial attack transient (so attack doesn't re-trigger every 3s).
     * 2. Compensates for natural sample decay so volume remains flat and steady.
     * 3. Blends head and tail using equal-power sine/cosine crossfading to eliminate all seam clicks.
     */
    createSeamlessLoopBuffer(rawBuffer) {
        const ctx = this.ctx;
        const dur = rawBuffer.duration;
        if (dur < 0.6) return rawBuffer;

        const sr = rawBuffer.sampleRate;
        const numChannels = rawBuffer.numberOfChannels;

        // Skip attack transient (e.g. 0.35s to 0.45s)
        const attackSec = Math.min(0.45, dur * 0.18);
        const endSec = Math.max(attackSec + 0.9, dur * 0.88);
        const fadeSec = Math.min(0.55, (endSec - attackSec) * 0.35);

        const sStart = Math.floor(attackSec * sr);
        const sEnd = Math.floor(endSec * sr);
        const nFade = Math.floor(fadeSec * sr);
        const nSustain = sEnd - sStart;
        const nLoop = nSustain - nFade;

        if (nLoop <= 0 || nFade <= 0) return rawBuffer;

        const loopBuffer = ctx.createBuffer(numChannels, nLoop, sr);

        for (let ch = 0; ch < numChannels; ch++) {
            const raw = rawBuffer.getChannelData(ch);
            const loopData = loopBuffer.getChannelData(ch);

            // Extract sustain portion
            const sustainSlice = new Float32Array(nSustain);
            for (let i = 0; i < nSustain; i++) {
                sustainSlice[i] = raw[sStart + i] || 0;
            }

            // Measure RMS at start vs end of sustain to counteract natural volume decay
            let sumStart = 0;
            let sumEnd = 0;
            for (let i = 0; i < nFade; i++) {
                sumStart += sustainSlice[i] * sustainSlice[i];
                sumEnd += sustainSlice[nLoop + i] * sustainSlice[nLoop + i];
            }
            const rmsStart = Math.sqrt(sumStart / nFade) + 1e-5;
            const rmsEnd = Math.sqrt(sumEnd / nFade) + 1e-5;
            const gainTarget = Math.min(3.2, rmsStart / rmsEnd);

            // Level out natural decay with a linear gain ramp
            for (let i = 0; i < nSustain; i++) {
                const factor = 1.0 + (gainTarget - 1.0) * (i / nSustain);
                sustainSlice[i] *= factor;
            }

            // Copy main body
            for (let i = 0; i < nLoop; i++) {
                loopData[i] = sustainSlice[i];
            }

            // Equal-power crossfade between the tail and the head
            for (let i = 0; i < nFade; i++) {
                const progress = i / nFade;
                const wIn = Math.sin(progress * Math.PI * 0.5);
                const wOut = Math.cos(progress * Math.PI * 0.5);
                const headSample = sustainSlice[i];
                const tailSample = sustainSlice[nLoop + i];
                loopData[i] = headSample * wIn + tailSample * wOut;
            }
        }

        return loopBuffer;
    }

    async loadInstrument(instrumentName, onProgress = () => {}) {
        if (this.cache.has(instrumentName)) {
            onProgress(100);
            return this.cache.get(instrumentName);
        }

        if (this.loadingPromises.has(instrumentName)) {
            return this.loadingPromises.get(instrumentName);
        }

        const promise = (async () => {
            onProgress(10);
            let jsContent = await this.getFromDB(instrumentName);

            if (!jsContent) {
                onProgress(25);
                const localUrl = `/soundfonts/${instrumentName}-mp3.js`;
                let fetched = false;

                try {
                    const resp = await fetch(localUrl);
                    if (resp.ok) {
                        jsContent = await resp.text();
                        fetched = true;
                    }
                } catch (e) {}

                if (!fetched) {
                    const cdnUrl = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrumentName}-mp3.js`;
                    const respCdn = await fetch(cdnUrl);
                    if (!respCdn.ok) {
                        throw new Error(`Failed to load soundfont: ${respCdn.status} ${respCdn.statusText}`);
                    }
                    jsContent = await respCdn.text();
                }

                this.saveToDB(instrumentName, jsContent);
            }

            onProgress(45);

            if (typeof window.MIDI === 'undefined') window.MIDI = {};
            if (typeof window.MIDI.Soundfont === 'undefined') window.MIDI.Soundfont = {};

            const scriptEl = document.createElement('script');
            scriptEl.text = jsContent;
            document.head.appendChild(scriptEl);
            document.head.removeChild(scriptEl);

            const rawData = window.MIDI.Soundfont[instrumentName];
            if (!rawData) {
                throw new Error(`SoundFont data missing for ${instrumentName}`);
            }

            const noteEntries = Object.entries(rawData);
            const total = noteEntries.length;
            let decodedCount = 0;

            const buffers = new Map();
            const sampleMidis = [];

            const noteNameToMidi = (noteStr) => {
                const match = noteStr.match(/^([A-G][b#]?)(-?\d+)$/);
                if (!match) return null;
                const letter = match[1];
                const octave = parseInt(match[2], 10);
                const baseMap = {
                    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
                    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
                    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
                };
                return (octave + 1) * 12 + baseMap[letter];
            };

            for (const [noteName, dataUri] of noteEntries) {
                const midi = noteNameToMidi(noteName);
                if (midi === null) continue;

                try {
                    const base64Data = dataUri.split(',')[1];
                    const binaryStr = window.atob(base64Data);
                    const len = binaryStr.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryStr.charCodeAt(i);
                    }

                    const rawAudioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
                    // Generate seamless crossfaded loop buffer
                    const seamlessLoopBuffer = this.createSeamlessLoopBuffer(rawAudioBuffer);

                    buffers.set(midi, {
                        rawBuffer: rawAudioBuffer,
                        loopBuffer: seamlessLoopBuffer
                    });
                    sampleMidis.push(midi);
                } catch (e) {
                    console.warn(`Failed to decode note ${noteName}:`, e);
                }

                decodedCount++;
                const progressPct = 45 + Math.round((decodedCount / total) * 55);
                onProgress(progressPct);
            }

            sampleMidis.sort((a, b) => a - b);
            const instrumentData = {
                name: instrumentName,
                buffers,
                sampleMidis
            };

            this.cache.set(instrumentName, instrumentData);
            this.loadingPromises.delete(instrumentName);
            onProgress(100);
            return instrumentData;
        })();

        this.loadingPromises.set(instrumentName, promise);
        return promise;
    }

    getSampleForMidi(instrumentData, targetMidi) {
        if (!instrumentData || !instrumentData.buffers.size) return null;

        // Exact match
        if (instrumentData.buffers.has(targetMidi)) {
            const entry = instrumentData.buffers.get(targetMidi);
            return {
                rawBuffer: entry.rawBuffer,
                loopBuffer: entry.loopBuffer,
                playbackRate: 1.0,
                baseMidi: targetMidi
            };
        }

        // Closest match
        const samples = instrumentData.sampleMidis;
        let closest = samples[0];
        let minDiff = Math.abs(targetMidi - closest);

        for (let i = 1; i < samples.length; i++) {
            const diff = Math.abs(targetMidi - samples[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closest = samples[i];
            }
        }

        const semitoneShift = targetMidi - closest;
        const playbackRate = Math.pow(2, semitoneShift / 12);
        const entry = instrumentData.buffers.get(closest);

        return {
            rawBuffer: entry.rawBuffer,
            loopBuffer: entry.loopBuffer,
            playbackRate,
            baseMidi: closest
        };
    }
}

window.SoundFontLoader = SoundFontLoader;
