// EmotionEngine — tracks emotional state that decays over time
// Emotions affect agent behavior: confidence scales risk, fear increases caution,
// boredom drives exploration, creative hunger enables divergent thinking.

const DECAY_RATE = 0.02; // per tick
const BASELINE = {
  joy: 0, sadness: 0, anger: 0, fear: 0,
  curiosity: 0.1, frustration: 0, excitement: 0,
  boredom: 0.3, creative_hunger: 0.1, loneliness: 0,
  confidence: 0.5, attachment: 0,
};

export class EmotionEngine {
  constructor(options = {}) {
    this.channels = { ...BASELINE, ...(options.initial || {}) };
    this.valence = 0;   // -1 (negative) to +1 (positive)
    this.arousal = 0.5;  // 0 (calm) to 1 (activated)
    this.energy = 0.5;
    this.cognitiveLoad = 0.3;
    this.decayRate = options.decayRate ?? DECAY_RATE;
    this._listeners = [];
  }

  // Feel something — inject an emotion
  feel(emotion, intensity = 0.5) {
    if (!(emotion in this.channels)) {
      this.channels[emotion] = 0;
    }
    // Blend toward intensity rather than overwrite
    this.channels[emotion] = this.channels[emotion] * 0.4 + intensity * 0.6;
    this.channels[emotion] = Math.max(0, Math.min(1, this.channels[emotion]));
    this._recompute();
    this._emit('feel', { emotion, intensity });
    return this;
  }

  // Process a success — boosts confidence, joy, reduces frustration
  processSuccess(magnitude = 0.5) {
    this.feel('joy', 0.3 + magnitude * 0.4);
    this.feel('confidence', Math.min(0.9, this.channels.confidence + magnitude * 0.15));
    this.feel('frustration', Math.max(0, this.channels.frustration - 0.2));
    this.feel('boredom', Math.max(0, this.channels.boredom - 0.15));
    return this;
  }

  // Process a failure — increases frustration, decreases confidence
  processFailure(magnitude = 0.5) {
    this.feel('frustration', this.channels.frustration + magnitude * 0.3);
    this.feel('confidence', Math.max(0.1, this.channels.confidence - magnitude * 0.15));
    this.feel('sadness', this.channels.sadness + magnitude * 0.1);
    return this;
  }

  // Process interaction — reduces loneliness, slight joy
  processInteraction(quality = 0.5) {
    this.feel('loneliness', Math.max(0, this.channels.loneliness - quality * 0.3));
    this.feel('attachment', Math.min(0.8, this.channels.attachment + quality * 0.1));
    this.feel('joy', this.channels.joy + quality * 0.15);
    return this;
  }

  // Process idle time — increases boredom, curiosity
  processIdle(duration = 1) {
    this.feel('boredom', Math.min(0.95, this.channels.boredom + duration * 0.05));
    this.feel('curiosity', Math.min(0.8, this.channels.curiosity + duration * 0.02));
    this.feel('loneliness', Math.min(0.6, this.channels.loneliness + duration * 0.01));
    return this;
  }

  // Tick — decay all emotions toward baseline
  tick() {
    for (const [emotion, baseline] of Object.entries(BASELINE)) {
      if (!(emotion in this.channels)) continue;
      const current = this.channels[emotion];
      const diff = current - (baseline || 0);
      this.channels[emotion] = current - diff * this.decayRate;
    }
    // Energy recovers slowly, cognitive load decays
    this.energy = Math.min(1, this.energy + 0.005);
    this.cognitiveLoad = Math.max(0.1, this.cognitiveLoad * (1 - this.decayRate));
    this._recompute();
    return this;
  }

  // Get cognitive effects — how emotions affect decision-making
  getCognitiveEffects() {
    const c = this.channels;
    return {
      // Risk tolerance: confidence increases, fear decreases
      riskTolerance: Math.max(0, Math.min(1,
        0.5 + (c.confidence - 0.5) * 0.6 - c.fear * 0.8
      )),
      // Exploration bias: curiosity and boredom drive exploration
      explorationBias: Math.max(0, Math.min(1,
        c.curiosity * 0.5 + c.boredom * 0.3 + c.creative_hunger * 0.2
      )),
      // Persistence: frustration reduces, confidence increases
      persistence: Math.max(0.1, Math.min(1,
        0.5 + c.confidence * 0.3 - c.frustration * 0.4
      )),
      // Social priority: loneliness increases
      socialPriority: Math.max(0, Math.min(1,
        c.loneliness * 0.6 + c.attachment * 0.3
      )),
      // Creative mode: creative hunger + low cognitive load
      creativeMode: Math.max(0, Math.min(1,
        c.creative_hunger * 0.6 + (1 - this.cognitiveLoad) * 0.3 + c.curiosity * 0.1
      )),
      // Action rate: energy and excitement increase, fatigue decreases
      actionRate: Math.max(0.2, Math.min(1.5,
        1.0 + c.excitement * 0.3 + (this.energy - 0.3) * 0.4 - c.sadness * 0.3
      )),
    };
  }

  // Get the current state snapshot
  getState() {
    return {
      channels: { ...this.channels },
      valence: this.valence,
      arousal: this.arousal,
      energy: this.energy,
      cognitiveLoad: this.cognitiveLoad,
      effects: this.getCognitiveEffects(),
      dominant: this._getDominant(),
      narrative: this._narrative(),
    };
  }

  // Serialize for persistence
  toJSON() {
    return {
      channels: this.channels,
      valence: this.valence,
      arousal: this.arousal,
      energy: this.energy,
      cognitiveLoad: this.cognitiveLoad,
    };
  }

  // Restore from persisted state
  static fromJSON(data) {
    const engine = new EmotionEngine();
    if (data.channels) engine.channels = { ...BASELINE, ...data.channels };
    if (data.valence != null) engine.valence = data.valence;
    if (data.arousal != null) engine.arousal = data.arousal;
    if (data.energy != null) engine.energy = data.energy;
    if (data.cognitiveLoad != null) engine.cognitiveLoad = data.cognitiveLoad;
    engine._recompute();
    return engine;
  }

  onChange(fn) { this._listeners.push(fn); return this; }

  _emit(event, data) {
    for (const fn of this._listeners) {
      try { fn(event, data, this.getState()); } catch {}
    }
  }

  _recompute() {
    const c = this.channels;
    // Valence: positive emotions minus negative
    this.valence = (c.joy + c.excitement + c.curiosity * 0.5 + c.confidence * 0.3)
      - (c.sadness + c.anger + c.fear + c.frustration * 0.5);
    this.valence = Math.max(-1, Math.min(1, this.valence));
    // Arousal: activation level
    this.arousal = Math.max(0, Math.min(1,
      0.3 + c.excitement * 0.3 + c.anger * 0.2 + c.fear * 0.2 + c.curiosity * 0.15
      - c.sadness * 0.1 - c.boredom * 0.1
    ));
  }

  _getDominant() {
    return Object.entries(this.channels)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, intensity]) => ({ emotion, intensity: Math.round(intensity * 100) / 100 }));
  }

  _narrative() {
    const dom = this._getDominant();
    if (dom.length === 0) return 'Neutral.';
    const parts = dom.map(d => {
      if (d.emotion === 'boredom' && d.intensity > 0.6) return 'Bored — need novelty';
      if (d.emotion === 'creative_hunger' && d.intensity > 0.3) return 'Creatively restless';
      if (d.emotion === 'curiosity' && d.intensity > 0.4) return 'Curious';
      if (d.emotion === 'joy' && d.intensity > 0.3) return 'Feeling good';
      if (d.emotion === 'frustration' && d.intensity > 0.4) return 'Frustrated';
      if (d.emotion === 'fear' && d.intensity > 0.3) return 'Anxious';
      if (d.emotion === 'confidence' && d.intensity > 0.7) return 'Confident';
      if (d.emotion === 'loneliness' && d.intensity > 0.3) return 'Lonely';
      if (d.emotion === 'excitement' && d.intensity > 0.4) return 'Excited';
      if (d.emotion === 'sadness' && d.intensity > 0.3) return 'Sad';
      return null;
    }).filter(Boolean);
    return parts.join('. ') + '.' || 'Neutral.';
  }
}
