/* NIVALIS 9 — original generative score: "Subsurface / Night Current" (v1.4.1 audio review).
 * Low pads + two clean, muffled arpeggiators. No tape simulation, pitch
 * instability, waveshaping, saturation, hiss source, samples or dependencies.
 * A fixed voice pool and native audio-clock automation keep notes smooth
 * without allocating a new oscillator for every note or depending on FPS.
 */
export class EvolvingDroneScore {
  // Keep the existing export/API so the field mix, preferences and controls
  // remain compatible with v1.2. The composition and synthesis are new.
  constructor(context, destination, { seed = 0x4049 } = {}) {
    this.ctx = context;
    this.nodes = []; this.sources = []; this.pendingStarts = [];
    this.voices = []; this.padBanks = []; this.arps = [];
    this.seed = seed >>> 0; this.disposed = false;
    this.elapsed = 0; this.transitions = 0; this.lastTick = -Infinity;
    this.duckUntil = -Infinity; this.tension = 0; this.bpm = 84; this.beat = 60 / this.bpm;
    // Musical notes can be queued well ahead: combat only changes the mix,
    // not the note sequence. Eight seconds tolerates first-frame shader
    // compilation / software rendering without turning the arps into gaps.
    this.lookahead = 8; this.harmonyBars = 8;
    this.chordSeconds = this.beat * 4 * this.harmonyBars;
    // Stay around a low D pedal instead of resolving through brighter major
    // seventh chords. The second is a passing shade, not a horror cluster.
    this.chords = [
      { name: 'D minor / low pedal', pads: [38,45,48], notes: [50,53,45,48,57] },
      { name: 'D minor / closed voicing', pads: [38,41,45], notes: [50,48,53,45,57] },
      { name: 'C over D / unresolved', pads: [38,43,48], notes: [48,50,55,45,53] },
      { name: 'D minor / passing ninth', pads: [38,45,48], notes: [50,53,45,48,52] },
      { name: 'G minor over D', pads: [38,43,46], notes: [43,46,50,53,55] },
      { name: 'D minor / return', pads: [38,41,48], notes: [50,48,45,53,57] }
    ];
    this.harmony = [...this.chords[0].pads]; this.harmonyIndex = 0;
    this.activeBank = 0; this.nextChord = 1;
    this.makeSpace(destination);
    this.makePads();
    this.makeArpeggiator(0); this.makeArpeggiator(1);
    this.makeTension();
    // Construct all buffers before choosing a start time (also safe on phones).
    this.epoch = context.currentTime + .15;
    for (const source of this.pendingStarts) source.start(this.epoch);
    this.pendingStarts.length = 0;
    this.output.gain.setTargetAtTime(.50, this.epoch, 1.8);
    this.padBanks[0].envelope.gain.setValueAtTime(1, this.epoch);
    this.padBanks[1].envelope.gain.setValueAtTime(0, this.epoch);
    for (const layer of this.arps) {
      layer.origin = this.epoch + (layer.index ? 8.25 : 2) * this.beat;
      layer.nextTime = layer.origin;
    }
    this.update({}, this.epoch);
  }

  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  node(node) { this.nodes.push(node); return node; }
  gain(value = 1) { const g = this.node(this.ctx.createGain()); g.gain.value = value; return g; }
  filter(type, frequency, q = .5) {
    const f = this.node(this.ctx.createBiquadFilter());
    f.type = type; f.frequency.value = frequency; f.Q.value = q; return f;
  }
  oscillator(type, frequency, destination) {
    const o = this.node(this.ctx.createOscillator());
    o.type = type; o.frequency.value = frequency; o.connect(destination);
    this.sources.push(o); this.pendingStarts.push(o); return o;
  }
  modulate(frequency, depth, parameter) {
    const g = this.gain(depth); g.connect(parameter);
    return this.oscillator('sine', frequency, g);
  }
  pan(position) {
    const p = this.node(this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : this.ctx.createGain());
    if (p.pan) p.pan.value = position;
    return p;
  }
  frequency(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  wave(harmonics) {
    return this.ctx.createPeriodicWave(new Float32Array(harmonics.length), new Float32Array(harmonics));
  }

  makeSpace(destination) {
    const c = this.ctx;
    this.input = this.gain(); this.padBus = this.gain(); this.arpBus = this.gain();
    this.padBus.connect(this.input); this.arpBus.connect(this.input);
    this.output = this.gain(0); this.duckGain = this.gain();
    this.output.connect(this.duckGain); this.duckGain.connect(destination);
    const highpass = this.filter('highpass', 38, .5);
    this.warmth = this.filter('lowpass', 1330, .45);
    // Muffling is entirely subtractive EQ: no nonlinear processing in the score.
    this.input.connect(highpass); highpass.connect(this.warmth);
    this.dry = this.gain(.88); this.warmth.connect(this.dry); this.dry.connect(this.output);

    this.reverb = this.node(c.createConvolver());
    const rate = c.sampleRate, seconds = 4.8;
    const impulse = c.createBuffer(2, Math.ceil(rate * seconds), rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel); let low = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / rate;
        low += ((this.random() * 2 - 1) - low) * .18;
        data[i] = low * Math.exp(-t * 1.3) * Math.min(1, t / .045) * Math.min(1, (seconds - t) * 5);
      }
      for (const [delay, level] of [[.093,.12],[.179,.07],[.311,.045]]) {
        data[Math.floor((delay + channel * .017) * rate)] += level;
      }
    }
    this.reverb.buffer = impulse; this.reverb.normalize = true;
    this.wet = this.gain(.38);
    this.warmth.connect(this.reverb); this.reverb.connect(this.wet); this.wet.connect(this.output);

    // Fixed-time, filtered stereo echoes, rather than modulated "tape" delay.
    // Only the arpeggios feed these, keeping the low pad register uncluttered.
    for (let i = 0; i < 2; i++) {
      const echo = this.node(c.createDelay(2)); echo.delayTime.value = this.beat * (i ? 1.5 : 1);
      const damp = this.filter('lowpass', 650 + i * 90);
      const feedback = this.gain(.20), send = this.gain(.14), panner = this.pan(i ? .48 : -.48);
      this.arpBus.connect(echo); echo.connect(damp); damp.connect(feedback); feedback.connect(echo);
      damp.connect(send); send.connect(panner); panner.connect(this.reverb);
    }
  }

  makePads() {
    const wave = this.wave([0,1,.16,.045,.012,.003]);
    // Two three-note banks crossfade harmonies, so there are no pitch slides,
    // warble, hard chord changes, or indefinitely accumulating voices.
    for (let b = 0; b < 2; b++) {
      const envelope = this.gain(0), bank = { envelope, voices: [] };
      envelope.connect(this.padBus);
      this.chords[0].pads.forEach((midi, i) => {
        const filter = this.filter('lowpass', 340 + i * 85);
        const level = this.gain([.21,.135,.095][i]);
        const panner = this.pan([-.32,.30,0][i]);
        filter.connect(level); level.connect(panner); panner.connect(envelope);
        const oscillator = this.oscillator('sine', this.frequency(midi), filter);
        oscillator.setPeriodicWave(wave);
        // Only loudness breathes. Oscillator pitch stays stable throughout notes.
        this.modulate(.018 + i * .006, [.018,.012,.008][i], level.gain);
        const voice = { filter, gain: level, panner, oscillators: [oscillator] };
        bank.voices.push(voice); this.voices.push(voice);
      });
      const bassFilter = this.filter('lowpass', 110), bassGain = this.gain(.042);
      bassFilter.connect(bassGain); bassGain.connect(envelope);
      bank.bass = this.oscillator('sine', this.frequency(this.chords[0].pads[0] - 12), bassFilter);
      this.padBanks.push(bank);
    }
  }

  makeArpeggiator(index) {
    const layer = {
      index, name: index ? 'Mid undertow' : 'Low sequence',
      interval: this.beat * (index ? .75 : .5),
      patterns: index ? [[2,4,3,1,4,2,null,3],[4,2,3,null,1,3,4,2],[3,4,2,1,null,4,2,3]] :
        [[0,2,1,3,2,4,1,2],[0,1,2,4,3,2,1,3],[2,0,1,2,4,3,1,0]],
      voices: [], step: 0, played: 0, skipped: 0, lastMidi: null, minMidi: Infinity, maxMidi: -Infinity,
      lastVariation: 0, variations: new Set(), notesByChord: new Set(),
      nextTime: 0, origin: 0
    };
    const wave = this.wave(index ? [0,1,.21,.075,.020,.004] : [0,1,.32,.11,.035,.009]);
    // Six reusable voices per layer; even the longest release ends well before
    // that voice's next turn. No pitch changes occur under an audible envelope.
    for (let i = 0; i < 6; i++) {
      const filter = this.filter('lowpass', index ? 850 : 720, .45);
      const envelope = this.gain(0);
      const panner = this.pan((index ? .26 : -.24) + (i % 3 - 1) * .055);
      const o = this.oscillator('sine', 146.8324, filter); o.setPeriodicWave(wave);
      filter.connect(envelope); envelope.connect(panner); panner.connect(this.arpBus);
      layer.voices.push({ oscillator: o, filter, envelope, panner, freeAt: -Infinity });
    }
    this.arps.push(layer);
  }

  scheduleChord(number, when, seconds = 5.2) {
    const next = this.chords[number % this.chords.length];
    const outgoing = this.padBanks[this.activeBank], incoming = this.padBanks[1 - this.activeBank];
    incoming.voices.forEach((v, i) => v.oscillators[0].frequency.setValueAtTime(this.frequency(next.pads[i]), when));
    incoming.bass.frequency.setValueAtTime(this.frequency(next.pads[0] - 12), when);
    // Complementary raised-cosine fades: no abrupt starts or equal-power boost
    // when two neighbouring chords happen to share exactly the same note.
    const up = new Float32Array(96), down = new Float32Array(96);
    for (let i = 0; i < up.length; i++) {
      up[i] = .5 - .5 * Math.cos(Math.PI * i / (up.length - 1)); down[i] = 1 - up[i];
    }
    incoming.envelope.gain.setValueCurveAtTime(up, when, seconds);
    outgoing.envelope.gain.setValueCurveAtTime(down, when, seconds);
    this.activeBank = 1 - this.activeBank;
    this.harmony = [...next.pads]; this.harmonyIndex = number % this.chords.length;
    this.transitions++;
  }

  scheduleNote(layer, step, when) {
    const chordNumber = Math.max(0, Math.floor((when - this.epoch + .00001) / this.chordSeconds));
    const chord = this.chords[chordNumber % this.chords.length];
    const variation = Math.floor(step / 32) % layer.patterns.length;
    const pattern = layer.patterns[variation], degree = pattern[step % pattern.length];
    layer.lastVariation = variation; layer.variations.add(variation);
    if (degree === null) return; // A composed phrase rest, never a damage/dropout effect.
    const voice = layer.voices[step % layer.voices.length];
    if (voice.freeAt > when) { layer.skipped++; return; }
    const midi = chord.notes[degree], index = layer.index;
    const length = index ? 1.42 : 1.06, attack = index ? .085 : .060;
    const accent = step % 8 === 0 ? 1.05 : step % 2 === 0 ? 1 : .90;
    const evolution = .94 + .06 * Math.sin((when - this.epoch) * .043 + index * 1.7);
    const peak = (index ? .152 : .228) * accent * evolution;
    const cutoff = (index ? 760 : 640) + 75 * Math.sin((when - this.epoch) * .039 + index * 2);
    voice.oscillator.frequency.setValueAtTime(this.frequency(midi), when);
    const g = voice.envelope.gain;
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(peak, when + attack);
    g.exponentialRampToValueAtTime(peak * .31, when + (index ? .49 : .33));
    g.exponentialRampToValueAtTime(.00008, when + length - .09);
    g.linearRampToValueAtTime(0, when + length);
    const f = voice.filter.frequency;
    f.setValueAtTime(cutoff * .80, when);
    f.linearRampToValueAtTime(cutoff, when + attack);
    f.exponentialRampToValueAtTime(index ? 410 : 340, when + length);
    voice.freeAt = when + length;
    layer.played++; layer.lastMidi = midi;
    layer.minMidi = Math.min(layer.minMidi, midi); layer.maxMidi = Math.max(layer.maxMidi, midi);
    layer.notesByChord.add(chordNumber % this.chords.length);
  }

  makeTension() {
    // Same low, clean harmonic colour during danger; no distorted alert drone.
    this.tensionFilter = this.filter('lowpass', 240);
    this.tensionGain = this.gain(0);
    this.tensionFilter.connect(this.tensionGain); this.tensionGain.connect(this.input);
    this.oscillator('sine', this.frequency(45), this.tensionFilter);
    this.oscillator('sine', this.frequency(52), this.tensionFilter);
  }

  // Explicit `when` supports real OfflineAudioContext rendering in the QA tools.
  // Live notes use absolute context time, never the frame-capped gameplay clock.
  update({ tension = 0, indoor = false } = {}, when = this.ctx.currentTime) {
    if (this.disposed || !Number.isFinite(when) || when < this.epoch || when - this.lastTick < .08) return;
    this.lastTick = when; this.elapsed = when - this.epoch;
    const t = this.elapsed, x = Math.max(0, Math.min(1, Number(tension) || 0));
    this.tension = x;
    const safe = Math.max(when, this.ctx.currentTime) + .025;
    const horizon = when + this.lookahead;
    const due = this.epoch + this.nextChord * this.chordSeconds;
    if (due <= horizon) {
      const number = Math.max(this.nextChord, Math.floor((safe - this.epoch) / this.chordSeconds));
      const start = Math.max(safe, this.epoch + number * this.chordSeconds);
      // Normally 5.2 seconds. Following a missed scheduling window, keep this
      // fade clear of the next chord boundary, instead of overlapping curves.
      const remaining = this.epoch + (number + 1) * this.chordSeconds - start;
      this.scheduleChord(number, start, Math.max(.01, Math.min(5.2, remaining - .05)));
      this.nextChord = number + 1;
    }
    for (const layer of this.arps) {
      if (layer.nextTime < safe) {
        const step = Math.max(layer.step, Math.ceil((safe - layer.origin) / layer.interval));
        layer.skipped += step - layer.step; layer.step = step;
        layer.nextTime = layer.origin + layer.step * layer.interval;
      }
      // Bounded work after a tab interruption: skip missed notes, never replay
      // an avalanche of late events. The uninterrupted pad remains beneath.
      while (layer.nextTime <= horizon) {
        this.scheduleNote(layer, layer.step, layer.nextTime);
        layer.step++; layer.nextTime = layer.origin + layer.step * layer.interval;
      }
    }
    for (const bank of this.padBanks) bank.voices.forEach((v, i) => {
      v.filter.frequency.setTargetAtTime(335 + i * 85 + 65 * Math.sin(t * .021 + i * 1.9), when, 2.6);
    });
    this.warmth.frequency.setTargetAtTime(1330 + 80 * Math.sin(t * .029), when, 3);
    this.tensionGain.gain.setTargetAtTime(x * .035, when, 1.4);
    this.tensionFilter.frequency.setTargetAtTime(220 + x * 75, when, 1.8);
    this.wet.gain.setTargetAtTime(indoor ? .48 : .38, when, 3.2);
    this.dry.gain.setTargetAtTime(indoor ? .82 : .88, when, 3.2);
    if (when >= this.duckUntil) this.duckGain.gain.setTargetAtTime(1 - x * .23, when, .65);
  }

  duck(strength = .3, seconds = .5) {
    if (this.disposed) return;
    const t = this.ctx.currentTime;
    this.duckUntil = Math.max(this.duckUntil, t + Math.max(.05, Number(seconds) || .5));
    const gain = this.duckGain.gain;
    // Release on the audio clock even during a slow visual frame. Cancel only
    // this bus's superseded duck/release, so repeated shots extend one envelope.
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(t);
    else { const value = gain.value; gain.cancelScheduledValues(t); gain.setValueAtTime(value, t); }
    gain.setTargetAtTime(1 - Math.max(0, Math.min(.65, strength)), t, .035);
    gain.setTargetAtTime(1 - this.tension * .23, this.duckUntil, .65);
  }

  snapshot() {
    return { name: 'Subsurface / Night Current', elapsed: this.elapsed, bpm: this.bpm, transitions: this.transitions,
      harmony: [...this.harmony], harmonyIndex: this.harmonyIndex,
      sources: this.sources.length, nodes: this.nodes.length, disposed: this.disposed,
      padBanks: this.padBanks.length, distortion: false, tapeNoise: false, pitchModulation: false,
      arpeggiators: this.arps.map(a => ({ name: a.name, interval: a.interval, played: a.played,
        skipped: a.skipped, step: a.step, nextTime: a.nextTime, lastMidi: a.lastMidi,
        minMidi: Number.isFinite(a.minMidi) ? a.minMidi : null, maxMidi: Number.isFinite(a.maxMidi) ? a.maxMidi : null,
        variation: a.lastVariation, variationsHeard: [...a.variations], chordsHeard: [...a.notesByChord],
        pooledVoices: a.voices.length })) };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const source of this.sources) { try { source.stop(); } catch {} }
    for (const node of this.nodes) { try { node.disconnect(); } catch {} }
    this.sources.length = 0; this.nodes.length = 0;
  }
}
