/* NIVALIS 9 — original procedural weather and close breathing through a sealed mask.
 * No recordings, samples, distortion, dependencies or AI-hearing events.
 * All recurring sounds use a fixed source pool. Pausing the owning AudioContext
 * freezes both schedules; future events are never replayed in a catch-up burst.
 */
export class Fieldscape {
  constructor(context, windDestination, breathDestination, { seed = 0x9404 } = {}) {
    this.ctx = context; this.seed = seed >>> 0; this.nodes = []; this.sources = [];
    this.pending = []; this.disposed = false; this.lastTick = -Infinity;
    this.elapsed = 0; this.exertion = 0; this.indoor = false; this.crouching = false;
    this.speed = 0; this.stamina = 100; this.gustCount = 0; this.breathCount = 0;
    this.stepCount = 0; this.lastStep = -Infinity; this.breathBusyUntil = -Infinity;
    this.gustHistory = []; this.breathHistory = []; this.gustVoices = [];
    this.windDuck = this.gain(1); this.windDuck.connect(windDestination);
    this.windGain = this.gain(1); this.windGain.connect(this.windDuck);
    this.windFilter = this.filter('lowpass', 1550, .5); this.windFilter.connect(this.windGain);
    this.breathDuck = this.gain(1); this.breathDuck.connect(breathDestination);
    // Close, dry resonances of a small mask cavity. No distortion or room reverb.
    this.breathMix = this.gain(.70);
    this.maskChamber = this.filter('peaking', 390, 1.25);this.maskChamber.gain.value=4.4;
    this.maskMuffle = this.filter('lowpass', 1580, .58);
    this.breathMix.connect(this.maskChamber);this.maskChamber.connect(this.maskMuffle);this.maskMuffle.connect(this.breathDuck);
    this.makeWeather(); this.makeBreathing();
    this.epoch = context.currentTime + .12;
    for (const { source, offset } of this.pending) source.start(this.epoch, offset);
    this.pending.length = 0;
    this.nextGust = this.epoch + 2.4; this.nextBreath = this.epoch + 1.2;
  }
  random() { this.seed = (1664525 * this.seed + 1013904223) >>> 0; return this.seed / 4294967296; }
  node(n) { this.nodes.push(n); return n; }
  gain(x = 1) { const n = this.node(this.ctx.createGain()); n.gain.value = x; return n; }
  filter(type, frequency, q = .6) { const n = this.node(this.ctx.createBiquadFilter()); n.type = type; n.frequency.value = frequency; n.Q.value = q; return n; }
  pan(x) { const n = this.node(this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : this.ctx.createGain()); if (n.pan) n.pan.value = x; return n; }
  noise(seconds, smooth) {
    const c = this.ctx, b = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
    const d = b.getChannelData(0); let low = 0, energy = 0;
    for (let i = 0; i < d.length; i++) { low += (this.random() * 2 - 1 - low) * smooth; d[i] = low; energy += low * low; }
    const scale = .27 / Math.sqrt(energy / d.length);
    for (let i = 0; i < d.length; i++) d[i] *= scale * Math.min(1, i / (c.sampleRate * .08), (d.length - 1 - i) / (c.sampleRate * .08));
    return b;
  }
  loop(buffer, destination, offset = 0) {
    const s = this.ctx.createBufferSource(); s.buffer = buffer; s.loop = true; s.connect(destination);
    this.sources.push(s); this.pending.push({ source: s, offset }); return s;
  }
  makeWeather() {
    // Different source lengths prevent the ambient bed repeating as one short loop.
    for (let i = 0; i < 2; i++) {
      const high = this.filter('highpass', 95), low = this.filter('lowpass', 410 + i * 150);
      const gain = this.gain(i ? .125 : .155), pan = this.pan(i ? .40 : -.40);
      this.loop(this.noise(i ? 17.9 : 11.7, .085), high, i * 3.2);
      high.connect(low); low.connect(gain); gain.connect(pan); pan.connect(this.windFilter);
    }
    const buffer = this.noise(13.31, .13);
    for (let i = 0; i < 3; i++) {
      const high = this.filter('highpass', 100), color = this.filter('bandpass', 640, .65);
      const envelope = this.gain(0), pan = this.pan(0);
      this.loop(buffer, high, i * 3.71); high.connect(color); color.connect(envelope);
      envelope.connect(pan); pan.connect(this.windFilter);
      this.gustVoices.push({ color, envelope, pan, freeAt: -Infinity });
    }
  }
  makeBreathing() {
    const buffer = this.noise(7.73, .34);
    this.breathVoices = [0, 1].map(i => {
      // Inhale pulls through a small regulator; exhale is softer and throatier.
      const high = this.filter('highpass', 105), mouth = this.filter('bandpass', i ? 540 : 820, .66);
      const chest = this.filter('peaking', i ? 275 : 430, .95);chest.gain.value=i?4.2:2.3;
      const soft = this.filter('lowpass', i ? 1120 : 1460, .55), envelope = this.gain(0), pan = this.pan(i ? .018 : -.018);
      this.loop(buffer, high, i * 2.41); high.connect(mouth); mouth.connect(chest);chest.connect(soft);
      soft.connect(envelope); envelope.connect(pan); pan.connect(this.breathMix);
      // Reuse the same noise source for a tiny valve/pressure release at a
      // breath boundary. No constant hiss, oscillator, sample, or extra source.
      const valve=this.filter('bandpass',i?1130:1620,.85),valveSoft=this.filter('lowpass',1750,.5),valveEnvelope=this.gain(0);
      high.connect(valve);valve.connect(valveSoft);valveSoft.connect(valveEnvelope);valveEnvelope.connect(this.breathMix);
      return { mouth, chest, soft, envelope, valve, valveEnvelope };
    });
  }
  curve(peak, skew = 1) {
    const values = new Float32Array(96);
    for (let i = 0; i < values.length; i++) {
      const u = i / (values.length - 1);
      // Smooth onset and release, with a little natural airflow asymmetry.
      values[i] = peak * Math.pow(Math.sin(Math.PI * Math.pow(u, skew)), 1.7) * (1 + .035 * Math.sin(u * 27));
    }
    values[0] = values[values.length - 1] = 0; return values;
  }
  scheduleGust(when) {
    const v = this.gustVoices[this.gustCount % this.gustVoices.length];
    const duration = 4.2 + this.random() * 4.8, peak = .32 + this.random() * .38;
    const direction = this.random() < .5 ? -1 : 1, span = .35 + this.random() * .4;
    v.envelope.gain.setValueCurveAtTime(this.curve(peak, .78 + this.random() * .55), when, duration);
    const low = 330 + this.random() * 200, high = 770 + this.random() * 370;
    v.color.frequency.setValueAtTime(low, when); v.color.frequency.linearRampToValueAtTime(high, when + duration * .42);
    v.color.frequency.linearRampToValueAtTime(low * .85, when + duration);
    if (v.pan.pan) { v.pan.pan.setValueAtTime(direction * span, when); v.pan.pan.linearRampToValueAtTime(-direction * span * .70, when + duration); }
    v.freeAt = when + duration; this.gustCount++;
    this.gustHistory.push({ when: when - this.epoch, duration, peak, direction });
    if (this.gustHistory.length > 10) this.gustHistory.shift();
    this.nextGust = when + duration + 2.1 + this.random() * 6.2;
  }
  scheduleBreath(when) {
    const effort = this.exertion, moving = this.speed > .4;
    const inhale = .89 - effort * .37, exhale = 1.26 - effort * .45;
    const pause = .15 + this.random() * .09;
    // Quiet recovery breathing remains after a sprint; sneaking never switches
    // off breath abruptly or emits noise events into the patrol AI.
    const peak = (.085 + effort * .29) * (this.crouching ? .55 : 1);
    const [a, b] = this.breathVoices;
    a.envelope.gain.setValueCurveAtTime(this.curve(peak * .71, 1.08), when, inhale);
    const outAt = when + inhale + pause;
    b.envelope.gain.setValueCurveAtTime(this.curve(peak, .85), outAt, exhale);
    a.mouth.frequency.setValueAtTime(750 + effort * 195, when);
    b.mouth.frequency.setValueAtTime(505 + effort * 140, outAt);
    a.valveEnvelope.gain.setValueCurveAtTime(this.curve(peak*.20,.68),when+.025,.105);
    b.valveEnvelope.gain.setValueCurveAtTime(this.curve(peak*.12,.90),outAt+.018,.13);
    this.breathBusyUntil = outAt + exhale;
    const period = Math.max(inhale + pause + exhale + .42, 6.0 - effort * 3.3 - (moving ? .5 : 0)) + this.random() * .3;
    this.nextBreath = when + period; this.breathCount++;
    this.breathHistory.push({ when: when - this.epoch, period, effort, peak, crouching: this.crouching });
    if (this.breathHistory.length > 10) this.breathHistory.shift();
  }
  step(sprint = false) {
    if (this.disposed) return;
    const now = this.ctx.currentTime, first = now - this.lastStep > 1.15;
    this.stepCount++; this.lastStep = now;
    // A movement onset may cue the next breath; never stack one per footfall.
    if (first && now > this.breathBusyUntil + .2 && this.nextBreath > now + 1.1) this.nextBreath = now + .22;
  }
  resetMotion() { this.exertion = 0; this.speed = 0; this.stamina = 100; this.crouching = false; }
  update({ speed = 0, stamina = 100, crouching = false, indoor = false } = {}, when = this.ctx.currentTime) {
    if (this.disposed || !Number.isFinite(when) || when < this.epoch || when - this.lastTick < .07) return;
    const delta = Number.isFinite(this.lastTick) ? Math.max(0, Math.min(2, when - this.lastTick)) : .1;
    this.lastTick = when; this.elapsed = when - this.epoch;
    this.speed = Math.max(0, Number(speed) || 0); this.stamina = Math.max(0, Math.min(100, Number.isFinite(stamina) ? stamina : 100));
    this.indoor = !!indoor; this.crouching = !!crouching;
    const target = this.speed > 6 ? .98 : this.speed > .4 ? (crouching ? .12 : .34) : 0;
    const recovery = this.stamina < 65 ? (65 - this.stamina) / 150 : 0;
    const desired = Math.min(1, Math.max(target, recovery));
    this.exertion += (desired - this.exertion) * (1 - Math.exp(-delta / (desired > this.exertion ? 2 : 6.5)));
    this.windGain.gain.setTargetAtTime(indoor ? .22 : 1, when, 1.15);
    this.windFilter.frequency.setTargetAtTime(indoor ? 370 : 1550, when, 1.3);
    const safe = Math.max(when, this.ctx.currentTime) + .035;
    if (this.nextGust < safe) this.nextGust = safe + .2;
    if (this.nextGust <= when + 8) this.scheduleGust(this.nextGust);
    if (this.nextBreath < safe) this.nextBreath = Math.max(safe + .12, this.breathBusyUntil + .2);
    if (this.nextBreath <= when + 1.0) this.scheduleBreath(this.nextBreath);
  }
  duck(strength = .3, seconds = .5) {
    const t = this.ctx.currentTime;
    for (const node of [this.windDuck, this.breathDuck]) {
      const p = node.gain;
      if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { const v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); }
      p.setTargetAtTime(1 - Math.min(.7, Math.max(0, strength)), t, .035);
      p.setTargetAtTime(1, t + Math.max(.05, seconds), .6);
    }
  }
  snapshot() {
    return { name: 'Pass Weather / Mask Breathing', elapsed: this.elapsed, sources: this.sources.length, nodes: this.nodes.length,
      indoor: this.indoor, exertion: this.exertion, speed: this.speed, crouching: this.crouching,
      gusts: this.gustCount, breaths: this.breathCount, steps: this.stepCount,
      nextGust: this.nextGust, nextBreath: this.nextBreath, gustHistory: [...this.gustHistory], breathHistory: [...this.breathHistory],
      maskApparatus: true, continuousHiss: false, proceduralBreathing: true, recordedHuman: false, aiNoiseEvents: false, disposed: this.disposed };
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    for (const s of this.sources) { try { s.stop(); s.disconnect(); } catch {} }
    for (const n of this.nodes) { try { n.disconnect(); } catch {} }
    this.sources.length = 0; this.nodes.length = 0;
  }
}
