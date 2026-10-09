# 🪐 Drone Station

**Infinite Ambient Drone & Musical Backing Track Machine**  
*Dual-Engine Architecture: 1-Click Browser Keyboard + Novation Launchkey Mini Hardware Integration*

Live Deployment: **[https://drone.arman.love](https://drone.arman.love)**  
Local 1-Click Launcher: `drone.bat`

---

## 🌟 Overview

Drone Station is an autonomous drone tone and backing track generator designed for practicing scales, modal improvisation, songwriting, and ambient sound design.

It generates **infinite, butter-smooth sustaining chord beds and root drones** using a library of **128 General MIDI instruments** (Pianos, Organs, Strings, Choirs, Pads, Sitars, etc.) and pure analog synthesizers.

### Key Capabilities

* **⚡ 1-Click Quick Drone Selector (No MIDI Required):**
  * Tidy 12-pitch chromatic selector (`C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`).
  * 3 Octave registers: `C2 (Bass)`, `C3 (Mid)`, `C4 (High)`.
  * Comprehensive Voicing Modifiers:
    * **Roots & Power:** Single Root, Power Chord (5).
    * **Triads:** Major, Minor, Sus4, Sus2, Diminished, Augmented.
    * **7th Chords:** Maj7, Min7, Dominant 7, m7♭5 (Half-Dim), Dim7, m(Maj7), Aug7.
    * **Extended & Color:** Add9, Maj9, Min9, Dominant 9, Major 6, Minor 6.
  * Click any pitch to immediately latch that drone; click any chord modifier to smoothly morph into that voicing in real-time.
* **🎹 Full Novation Launchkey Mini Hardware Integration:**
  * Auto-detects Launchkey Mini via Web MIDI.
  * 8 Rotary Knobs mapped to Master Vol, Filter Cutoff, Space Mix, Freeze Blur, Sub-Bass, Crossfade Time, Modulation Rate, and Resonance (with 1-click MIDI Learn).
  * 16 RGB Velocity Pads mapped to root triggers, octave shifts, freeze toggles, and panic kill.
* **🧠 Real-Time Harmony & Scale Intelligence:**
  * Automatically analyzes sounding notes, identifies the chord formula (e.g. `Fmaj7`, `Dm9`), and lists suggested practice scales (e.g. *F Lydian*, *F Major Pentatonic*, *D Dorian*).
* **♾️ Dual-Layer Seamless Looping Audio DSP (Zero Stutter):**
  * Solves the classic 3–4 second soundfont loop glitch.
  * Layer A plays the authentic acoustic attack transient once upfront.
  * Layer B loops a mathematically processed, decay-compensated, equal-power crossfaded sustain buffer infinitely without clicks, volume drops, or re-attack thumps.
* **🛡️ Hardware-Grade Safety Brickwall Limiter:**
  * Integrated `DynamicsCompressorNode` clamped to -1.0 dBFS ensures no audio spike or feedback loop can ever exceed safe listening levels.
* **⚡ Instant Panic / Kill Switch:**
  * Silences all audio voices, clears feedback buffers, and resets the audio graph within 1 millisecond.

---

## 🎛️ Modular Tone Rack

Every module on the dashboard has an independent On/Off toggle:

1. **🔀 Crossfade Engine:** Smoothly morphs between chord changes (0.1s to 5.0s) with zero audio clicks.
2. **🪐 Octave Spreader:** Injects sub-bass fundamentals (-1 Octave), upper celestial shimmer (+1 Octave), and perfect 5th overtone drones.
3. **❄️ Sustain & Infinite Freeze:**
   * *Ambient Freeze Mode:* Envelopes decaying instruments (pianos, harps, sitars) in a high-diffusion stereo reverb wash.
   * *Raw / Natural Mode:* Allows testing authentic acoustic decay envelopes and raw SoundFonts without artificial smoothing.
4. **🌊 Modulation (LFO):** Ultra-slow breathing LFO (0.05 Hz to 3.0 Hz) sweeps filter frequencies so the drone gently breathes without static ear fatigue.
5. **🎛️ Master Tone & Vol:** 24dB low-pass filter cutoff, resonance warmth, and master output volume.

---

## 🚀 Running Locally

To launch on Windows:
1. Double-click `drone.bat` in the project root.
2. Your default web browser will automatically open to `http://127.0.0.1:5432`.
3. Click any note on screen or play your Novation Launchkey Mini.

---

## 🌐 Production Web Deployment (Docker + Traefik)

Drone Station is fully self-contained as a static web application:

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    container_name: drone-app
    restart: always
    volumes:
      - /mnt/540data/drone/site:/usr/share/nginx/html:ro
    networks:
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.drone-http.entryPoints=http"
      - "traefik.http.routers.drone-http.rule=Host(`drone.arman.love`)"
      - "traefik.http.routers.drone-http.middlewares=drone-redirect"
      - "traefik.http.middlewares.drone-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.drone-https.entryPoints=https"
      - "traefik.http.routers.drone-https.rule=Host(`drone.arman.love`)"
      - "traefik.http.routers.drone-https.tls=true"
      - "traefik.http.routers.drone-https.tls.certresolver=letsencrypt"
      - "traefik.http.services.drone-https.loadbalancer.server.port=80"

networks:
  coolify:
    external: true
```

---

## 📜 License

MIT License. Created by Arman / Turbonerd64.
