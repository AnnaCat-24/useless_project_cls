/**
 * Cinematic Life Score – Music Engine v2
 * ========================================
 * Five completely distinct layers, each with its own melodic character.
 * Layers are rebuilt fresh on every start() so AudioContext stays healthy.
 *
 *  🎹 Piano      (CALM 0–20)      – gentle music-box arpeggio, C major, soft sine
 *  🎻 Strings    (FOCUSED 20–40)  – warm plucked walking bass, triangle wave
 *  🥁 Percussion (TENSE 40–60)    – syncopated woodblock + rimshot pattern
 *  🎺 Brass      (INTENSE 60–80)  – staccato fanfare stabs, sawtooth + bandpass
 *  💥 Climax     (CINEMATIC 80+)  – tremolo swell + ascending arpeggios + sub bass
 */

const BPM        = 90;
const BEAT       = 60 / BPM;           // seconds per beat
const BAR        = BEAT * 4;

// C major pentatonic (C D E G A) – two octaves, bright and fun
const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00,
                    523.25, 587.33, 659.25];

// C major scale – for the walking bass
const MAJOR_SCALE = [130.81, 146.83, 164.81, 174.61, 196.00,
                     220.00, 246.94, 261.63];

// Fanfare motive: C E G C E G
const FANFARE = [261.63, 329.63, 392.00, 523.25, 329.63, 392.00];


export class MusicEngine {
  constructor() {
    this.ctx        = null;
    this.masterGain = null;
    this.reverb     = null;
    this.reverbBus  = null;
    this.layers     = {};
    this.isPlaying  = false;
    this.currentScore = 0;
    this.targetScore  = 0;
    this.animFrame    = null;
    this.onLayerChange = null;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.78, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Compressor keeps everything even
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value      =  8;
    comp.ratio.value     =  4;
    comp.attack.value    = 0.003;
    comp.release.value   = 0.25;
    this.masterGain.connect(comp);
    comp.connect(this.ctx.destination);

    // Reverb bus (subtle)
    this.reverb    = await this._makeReverb(1.8);
    this.reverbBus = this.ctx.createGain();
    this.reverbBus.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.reverb.connect(this.reverbBus);
    this.reverbBus.connect(this.masterGain);

    this._buildLayers();
  }

  async _makeReverb(dur) {
    const sr  = this.ctx.sampleRate;
    const len = Math.ceil(sr * dur);
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const cv = this.ctx.createConvolver();
    cv.buffer = buf;
    return cv;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _makeGain(vol = 0) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.connect(this.masterGain);
    g.connect(this.reverb);
    return g;
  }

  _makeFilter(type, freq, Q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type            = type;
    f.frequency.value = freq;
    f.Q.value         = Q;
    return f;
  }

  // Single pitched note with ADSR envelope
  _note(freq, type, dest, attack, sustain, release, vol = 0.5) {
    const t   = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0,        t);
    env.gain.linearRampToValueAtTime(vol,    t + attack);
    env.gain.setValueAtTime(vol,             t + attack + sustain);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + sustain + release);
    osc.connect(env);
    env.connect(dest);
    osc.start(t);
    osc.stop(t + attack + sustain + release + 0.05);
  }

  // Noise burst (woodblock / snare / rimshot)
  _noise(dest, dur, hpFreq, vol = 0.4) {
    const t   = this.ctx.currentTime;
    const len = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp  = this._makeFilter('highpass', hpFreq);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp); hp.connect(env); env.connect(dest);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // ── Layer builders ────────────────────────────────────────────────────────

  /*
   * 🎹 PIANO – CALM
   * Music-box feel: gentle C major pentatonic arpeggio that goes up then down.
   * Soft sine tones with a triangle octave overlay. Slow, swung tempo.
   */
  _buildPianoLayer() {
    const gn      = this._makeGain(0);
    const UP_DOWN = [0, 2, 4, 6, 7, 6, 4, 2]; // pentatonic index pattern
    let i = 0, timer = null;

    const tick = () => {
      if (!this.isPlaying) return;
      const freq = PENTATONIC[UP_DOWN[i % UP_DOWN.length]];
      i++;

      this._note(freq,     'sine',     gn, 0.012, 0.08, 0.50, 0.40);  // main tone
      this._note(freq * 2, 'triangle', gn, 0.012, 0.04, 0.28, 0.10);  // octave shimmer

      // Root note every 4 ticks for grounding
      if (i % 4 === 0) this._note(freq / 2, 'sine', gn, 0.02, 0.12, 0.55, 0.18);

      timer = setTimeout(tick, BEAT * 0.72 * 1000); // slightly swung
    };

    return { gainNode: gn, start: tick, stop: () => clearTimeout(timer) };
  }

  /*
   * 🎻 STRINGS / BASS – FOCUSED
   * Plucked walking bass line through C major scale.
   * Triangle wave + quick attack/decay = warm pluck sound.
   * Adds a 5th harmonic on even beats for richness.
   */
  _buildStringsLayer() {
    const gn  = this._makeGain(0);
    const lp  = this._makeFilter('lowpass', 580, 1.4);
    lp.connect(gn);

    const WALK = [0, 4, 2, 5, 3, 1, 4, 0]; // C G E A F D G C
    let i = 0, timer = null;

    const tick = () => {
      if (!this.isPlaying) return;
      const freq = MAJOR_SCALE[WALK[i % WALK.length]];
      i++;

      const t   = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.setValueAtTime(freq * 1.012, t + 0.01); // slight bend
      env.gain.setValueAtTime(0,     t);
      env.gain.linearRampToValueAtTime(0.58, t + 0.007);
      env.gain.exponentialRampToValueAtTime(0.18, t + 0.14);
      env.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.82);
      osc.connect(env); env.connect(lp);
      osc.start(t); osc.stop(t + BEAT * 0.9);

      // 5th on even beats
      if (i % 2 === 0) this._note(freq * 1.5, 'triangle', gn, 0.008, 0.06, 0.22, 0.17);

      timer = setTimeout(tick, BEAT * 1000);
    };

    return { gainNode: gn, start: tick, stop: () => clearTimeout(timer) };
  }

  /*
   * 🥁 PERCUSSION – TENSE
   * Syncopated 16th-note woodblock + rimshot grid.
   * Pattern: WB . WB RM  WB WB . RM  (repeating 16 steps)
   * Pitched click gives a fun 'tok tok' rather than generic noise.
   */
  _buildPercussionLayer() {
    const gn = this.ctx.createGain(); // dry — no reverb
    gn.gain.setValueAtTime(0, this.ctx.currentTime);
    gn.connect(this.masterGain);

    const S       = BEAT / 4; // 16th note
    const PATTERN = [1,0,1,0, 2,0,1,0, 1,1,0,0, 2,0,0,1]; // 1=woodblock 2=rimshot
    let step = 0, next = 0, timer = null;

    const sched = () => {
      while (next < this.ctx.currentTime + 0.18) {
        const hit = PATTERN[step % PATTERN.length];
        if (hit === 1) {
          this._noise(gn, 0.035, 1400, 0.58);
          this._note(900, 'square', gn, 0.001, 0.004, 0.025, 0.28); // tok click
        } else if (hit === 2) {
          this._noise(gn, 0.065, 2200, 0.48);
          this._note(420, 'square', gn, 0.001, 0.003, 0.055, 0.22); // rimshot pop
        }
        next += S; step++;
      }
      timer = setTimeout(sched, 25);
    };

    const start = () => { next = this.ctx.currentTime + 0.05; step = 0; sched(); };
    const stop  = () => clearTimeout(timer);
    return { gainNode: gn, start, stop };
  }

  /*
   * 🎺 BRASS – INTENSE
   * C–E–G–C fanfare stabs, sawtooth filtered through bandpass.
   * Short brass envelope with a tiny pitch rise = "dah!" articulation.
   * Alternating gap lengths make it feel punchy and comedic.
   */
  _buildBrassLayer() {
    const gn = this._makeGain(0);
    const bp = this._makeFilter('bandpass', 950, 2.8);
    bp.connect(gn);

    let i = 0, timer = null;

    const tick = () => {
      if (!this.isPlaying) return;
      const freq = FANFARE[i % FANFARE.length];
      i++;

      const t   = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.018, t + 0.04); // pitch rise articulation

      env.gain.setValueAtTime(0,    t);
      env.gain.linearRampToValueAtTime(0.72,  t + 0.022);
      env.gain.setValueAtTime(0.55,           t + 0.07);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);

      osc.connect(env); env.connect(bp);
      osc.start(t); osc.stop(t + 0.38);

      // Short–short–long rhythm pattern for character
      const gaps = [BEAT * 0.55, BEAT * 0.55, BEAT * 1.5];
      timer = setTimeout(tick, gaps[i % gaps.length] * 1000);
    };

    return { gainNode: gn, start: tick, stop: () => clearTimeout(timer) };
  }

  /*
   * 💥 CLIMAX – CINEMATIC
   * Three simultaneous elements:
   *   1. Tremolo high string pad (sawtooth × 4 detuned voices, 9 Hz LFO)
   *   2. Ascending C–E–G–B–D arpeggio in triplets
   *   3. Sub-bass C2 pulse every bar
   */
  _buildClimaxLayer() {
    const gn = this._makeGain(0);
    const lp = this._makeFilter('lowpass', 3500, 0.6);
    lp.connect(gn);

    // String pad – 4 detuned sawtooth voices
    const PAD_FREQS = [523.25, 587.33, 659.25, 783.99];
    const padOscs  = PAD_FREQS.flatMap(f => {
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      o1.type = 'sawtooth'; o1.frequency.value = f;
      o2.type = 'sawtooth'; o2.frequency.value = f * 1.006;
      o1.connect(lp); o2.connect(lp);
      return [o1, o2];
    });

    // Tremolo LFO
    const lfo     = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 9;
    lfoGain.gain.value  = 0.11;
    lfo.connect(lfoGain);
    lfoGain.connect(gn.gain);

    // Ascending arpeggio
    const ARP   = [261.63, 329.63, 392.00, 493.88, 587.33, 659.25];
    let ai = 0, arpTimer = null;
    const arpTick = () => {
      if (!this.isPlaying) return;
      this._note(ARP[ai % ARP.length] * 2, 'sine', gn, 0.008, 0.04, 0.28, 0.32);
      ai++;
      arpTimer = setTimeout(arpTick, BEAT * 0.33 * 1000); // triplet
    };

    // Sub-bass pulse
    let bassTimer = null;
    const bassTick = () => {
      if (!this.isPlaying) return;
      this._note(65.41, 'sine', gn, 0.01, 0.18, 0.55, 0.52); // C2
      bassTimer = setTimeout(bassTick, BAR * 1000);
    };

    const start = () => {
      padOscs.forEach(o => o.start());
      lfo.start();
      arpTick();
      bassTick();
    };
    const stop = () => {
      clearTimeout(arpTimer);
      clearTimeout(bassTimer);
      try { padOscs.forEach(o => o.stop()); lfo.stop(); } catch {}
    };

    return { gainNode: gn, start, stop };
  }

  // ── Layer assembly ────────────────────────────────────────────────────────

  _buildLayers() {
    this.layers = {
      piano:      this._buildPianoLayer(),
      strings:    this._buildStringsLayer(),
      percussion: this._buildPercussionLayer(),
      brass:      this._buildBrassLayer(),
      climax:     this._buildClimaxLayer(),
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async start() {
    // Close any previous context so nodes don't accumulate
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
    await this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.isPlaying    = true;
    this.currentScore = 0;
    this.targetScore  = 0;

    Object.values(this.layers).forEach(l => l.start());
    this._tick();
  }

  stop() {
    this.isPlaying = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (!this.ctx) return;
    this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    setTimeout(() => {
      Object.values(this.layers).forEach(l => { try { l.stop(); } catch {} });
      try { this.ctx.close(); } catch {}
    }, 1500);
  }

  setScore(score) {
    this.targetScore = Math.max(0, Math.min(100, score));
  }

  _tick() {
    if (!this.isPlaying) return;
    this.currentScore += (this.targetScore - this.currentScore) * 0.04;
    this._applyScoreToLayers(this.currentScore);
    this.animFrame = requestAnimationFrame(() => this._tick());
  }

  _applyScoreToLayers(s) {
    // Piano fades down slightly as more intense layers kick in
    const pianoGain   = Math.max(0, this._ramp(s, 0, 8, 0, 0.82) - this._ramp(s, 60, 100, 0, 0.28));
    const stringsGain = this._ramp(s, 18, 38, 0, 0.72);
    const percGain    = this._ramp(s, 38, 58, 0, 0.68);
    const brassGain   = this._ramp(s, 58, 78, 0, 0.70);
    const climaxGain  = this._ramp(s, 78, 100, 0, 0.75);

    this._setLayerGain('piano',      pianoGain,   0.5);
    this._setLayerGain('strings',    stringsGain, 0.6);
    this._setLayerGain('percussion', percGain,    0.5);
    this._setLayerGain('brass',      brassGain,   0.7);
    this._setLayerGain('climax',     climaxGain,  0.8);

    if (this.onLayerChange) {
      this.onLayerChange({ piano: pianoGain, strings: stringsGain,
        percussion: percGain, brass: brassGain, climax: climaxGain });
    }
  }

  _ramp(val, inMin, inMax, outMin, outMax) {
    if (val <= inMin) return outMin;
    if (val >= inMax) return outMax;
    return outMin + (outMax - outMin) * ((val - inMin) / (inMax - inMin));
  }

  _setLayerGain(name, value, tc) {
    const l = this.layers[name];
    if (!l) return;
    l.gainNode.gain.setTargetAtTime(Math.max(0, value), this.ctx.currentTime, tc);
    l.currentGain = value;
  }

  // ── Climax sequence ("Complete the Scene") ───────────────────────────────

  async triggerClimax(onComplete) {
    if (!this.isPlaying) await this.start();

    // Swell everything to full
    ['piano','strings','percussion','brass','climax'].forEach(n =>
      this._setLayerGain(n, 0.88, 0.08)
    );
    this.masterGain.gain.setTargetAtTime(1.05, this.ctx.currentTime, 0.2);

    setTimeout(() => {
      // Drop all layers except piano
      ['strings','percussion','brass','climax'].forEach(n =>
        this.layers[n].gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.55)
      );
      this.layers['piano'].gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.85);
      this.masterGain.gain.setTargetAtTime(0.78, this.ctx.currentTime, 0.5);

      // Final C major chord rings out
      setTimeout(() => {
        this._playFinalChord();
        setTimeout(() => { if (onComplete) onComplete(); }, 3200);
      }, 2000);
    }, 3500);
  }

  _playFinalChord() {
    if (!this.ctx) return;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
      const t   = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type            = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0,                 t);
      env.gain.linearRampToValueAtTime(0.28 - i * 0.04, t + 0.06);
      env.gain.exponentialRampToValueAtTime(0.0001,      t + 5);
      osc.connect(env); env.connect(this.masterGain);
      osc.start(t); osc.stop(t + 5.2);
    });
  }
}

export const musicEngine = new MusicEngine();
