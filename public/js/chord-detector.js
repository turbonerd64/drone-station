/**
 * Chord & Scale Detector for Drone Station
 * Identifies roots, chords, intervals, and suggested practice scales in real-time.
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_FORMULAS = [
    { name: 'Major', symbol: '', intervals: [0, 4, 7], scales: ['Major', 'Lydian', 'Major Pentatonic'] },
    { name: 'Minor', symbol: 'm', intervals: [0, 3, 7], scales: ['Natural Minor (Aeolian)', 'Dorian', 'Minor Pentatonic', 'Blues'] },
    { name: 'Major 7th', symbol: 'maj7', intervals: [0, 4, 7, 11], scales: ['Major (Ionian)', 'Lydian'] },
    { name: 'Minor 7th', symbol: 'm7', intervals: [0, 3, 7, 10], scales: ['Dorian', 'Aeolian', 'Minor Pentatonic'] },
    { name: 'Dominant 7th', symbol: '7', intervals: [0, 4, 7, 10], scales: ['Mixolydian', 'Blues', 'Bebop Dominant'] },
    { name: 'Suspended 4th', symbol: 'sus4', intervals: [0, 5, 7], scales: ['Mixolydian', 'Major', 'Dorian'] },
    { name: 'Suspended 2nd', symbol: 'sus2', intervals: [0, 2, 7], scales: ['Major', 'Mixolydian', 'Lydian'] },
    { name: 'Power Chord', symbol: '5', intervals: [0, 7], scales: ['Any Scale with root & 5th (Major, Minor, Pentatonic)'] },
    { name: 'Diminished', symbol: 'dim', intervals: [0, 3, 6], scales: ['Locrian', 'Diminished'] },
    { name: 'Half-Diminished', symbol: 'm7b5', intervals: [0, 3, 6, 10], scales: ['Locrian', 'Locrian #2'] },
    { name: 'Diminished 7th', symbol: 'dim7', intervals: [0, 3, 6, 9], scales: ['Whole-Half Diminished'] },
    { name: 'Augmented', symbol: 'aug', intervals: [0, 4, 8], scales: ['Whole Tone', 'Lydian Augmented'] },
    { name: 'Major 9th', symbol: 'maj9', intervals: [0, 2, 4, 7, 11], scales: ['Lydian', 'Major'] },
    { name: 'Minor 9th', symbol: 'm9', intervals: [0, 2, 3, 7, 10], scales: ['Dorian', 'Aeolian'] },
    { name: 'Dominant 9th', symbol: '9', intervals: [0, 2, 4, 7, 10], scales: ['Mixolydian'] },
    { name: 'Add 9', symbol: 'add9', intervals: [0, 2, 4, 7], scales: ['Major', 'Lydian'] },
    { name: 'Minor 6th', symbol: 'm6', intervals: [0, 3, 7, 9], scales: ['Dorian', 'Melodic Minor'] },
    { name: 'Major 6th', symbol: '6', intervals: [0, 4, 7, 9], scales: ['Major', 'Pentatonic'] }
];

function midiToNoteName(midiNumber) {
    const note = NOTE_NAMES[midiNumber % 12];
    const octave = Math.floor(midiNumber / 12) - 1;
    return `${note}${octave}`;
}

function midiToFrequency(midiNumber) {
    return (440 * Math.pow(2, (midiNumber - 69) / 12)).toFixed(1);
}

function detectChord(midiNotes) {
    if (!midiNotes || midiNotes.length === 0) {
        return {
            root: null,
            displayName: 'Ready',
            fullChord: 'Awaiting MIDI input',
            scales: ['Strike any note or chord on your Launchkey Mini to begin.'],
            notes: []
        };
    }

    // Sort ascending
    const sorted = [...new Set(midiNotes)].sort((a, b) => a - b);
    const detailedNotes = sorted.map(midi => ({
        midi,
        name: midiToNoteName(midi),
        pitchClass: NOTE_NAMES[midi % 12],
        freq: midiToFrequency(midi)
    }));

    // Single note drone
    if (sorted.length === 1) {
        const root = NOTE_NAMES[sorted[0] % 12];
        return {
            root,
            displayName: `${root} Drone`,
            fullChord: `${root} (Single Root)`,
            scales: [
                `${root} Major Pentatonic`,
                `${root} Minor Pentatonic / Blues`,
                `${root} Natural Minor (Aeolian)`,
                `${root} Major (Ionian)`,
                `${root} Dorian`,
                `${root} Mixolydian`
            ],
            notes: detailedNotes
        };
    }

    // Two notes - check for 5th or interval
    const pitchClasses = [...new Set(sorted.map(m => m % 12))];
    const rootCandidateMidi = sorted[0];
    const rootCandidate = NOTE_NAMES[rootCandidateMidi % 12];

    if (pitchClasses.length === 2) {
        const interval = (pitchClasses[1] - pitchClasses[0] + 12) % 12;
        if (interval === 7 || interval === 5) {
            const rootName = interval === 7 ? NOTE_NAMES[pitchClasses[0]] : NOTE_NAMES[pitchClasses[1]];
            return {
                root: rootName,
                displayName: `${rootName}5 (Power Chord)`,
                fullChord: `${rootName} Power Drone`,
                scales: [`${rootName} Minor Pentatonic`, `${rootName} Major Pentatonic`, `${rootName} Dorian`],
                notes: detailedNotes
            };
        }
    }

    // Search matching chord formulas
    for (let r = 0; r < pitchClasses.length; r++) {
        const rootIndex = pitchClasses[r];
        const intervals = pitchClasses.map(pc => (pc - rootIndex + 12) % 12).sort((a, b) => a - b);

        for (const formula of CHORD_FORMULAS) {
            const fIntervals = formula.intervals;
            const matches = fIntervals.every(intVal => intervals.includes(intVal));
            if (matches) {
                const rootName = NOTE_NAMES[rootIndex];
                const fullName = `${rootName}${formula.symbol}`;
                return {
                    root: rootName,
                    displayName: fullName,
                    fullChord: `${rootName} ${formula.name}`,
                    scales: formula.scales.map(s => `${rootName} ${s}`),
                    notes: detailedNotes
                };
            }
        }
    }

    // Fallback: Name by lowest root note
    const lowestRoot = NOTE_NAMES[sorted[0] % 12];
    return {
        root: lowestRoot,
        displayName: `${lowestRoot} Complex Drone`,
        fullChord: `${lowestRoot} Custom Voicing (${detailedNotes.map(n => n.pitchClass).join(' - ')})`,
        scales: [`${lowestRoot} Chromatic / Free Modal`],
        notes: detailedNotes
    };
}

window.DroneChordDetector = {
    detectChord,
    midiToNoteName,
    midiToFrequency,
    NOTE_NAMES
};
