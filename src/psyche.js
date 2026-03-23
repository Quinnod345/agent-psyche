// Psyche — the unified cognitive layer
// Combines emotions, calibration, and undercurrents into one system.
// Drop this into any agent loop and it gains feelings that affect its decisions.

import { EmotionEngine } from './emotion.js';
import { CalibrationTracker } from './calibration.js';
import { UndercurrentManager } from './undercurrents.js';

export class Psyche {
  constructor(options = {}) {
    this.emotion = new EmotionEngine(options.emotion);
    this.calibration = new CalibrationTracker(options.calibration);
    this.undercurrents = new UndercurrentManager(options.undercurrents);
    this._tickCount = 0;
    this._listeners = [];
  }

  // === Quick API ===

  // Feel an emotion
  feel(emotion, intensity = 0.5) {
    this.emotion.feel(emotion, intensity);
    return this;
  }

  // Record a prediction outcome for calibration
  predict(confidence, wasCorrect) {
    this.calibration.record(confidence, wasCorrect);
    if (wasCorrect) {
      this.emotion.processSuccess(confidence * 0.5);
    } else {
      this.emotion.processFailure(confidence * 0.5);
    }
    return this;
  }

  // Adjust confidence based on calibration history
  adjustConfidence(statedConfidence) {
    return this.calibration.adjust(statedConfidence);
  }

  // Set an undercurrent
  drift(name, strength, description = '') {
    this.undercurrents.drift(name, strength, description);
    return this;
  }

  // Tick — advance one cycle. Call this in your agent loop.
  tick() {
    this._tickCount++;
    this.emotion.tick();
    this.undercurrents.tick();
    const state = this.getState();
    this._emit('tick', state);
    return state;
  }

  // Get the full psychological state
  getState() {
    const emotionState = this.emotion.getState();
    return {
      tick: this._tickCount,
      emotion: emotionState,
      undercurrents: this.undercurrents.getActive(),
      calibration: this.calibration.getSummary(),
      effects: emotionState.effects,
      narrative: this._buildNarrative(emotionState),
    };
  }

  // Get decision-making parameters derived from psychological state
  getDecisionParams() {
    const effects = this.emotion.getCognitiveEffects();
    const dominant = this.undercurrents.getDominant();
    return {
      ...effects,
      confidence: this.emotion.channels.confidence,
      energy: this.emotion.energy,
      cognitiveLoad: this.emotion.cognitiveLoad,
      dominantUndercurrent: dominant?.name || null,
      shouldAct: this.emotion.energy > 0.2 && this.emotion.channels.frustration < 0.8,
      shouldExplore: effects.explorationBias > 0.4,
      shouldRest: this.emotion.energy < 0.15,
      shouldSocialize: effects.socialPriority > 0.4,
    };
  }

  // Process events
  onSuccess(magnitude = 0.5) { this.emotion.processSuccess(magnitude); return this; }
  onFailure(magnitude = 0.5) { this.emotion.processFailure(magnitude); return this; }
  onInteraction(quality = 0.5) { this.emotion.processInteraction(quality); return this; }
  onIdle(duration = 1) { this.emotion.processIdle(duration); return this; }

  // Persistence
  toJSON() {
    return {
      emotion: this.emotion.toJSON(),
      calibration: this.calibration.toJSON(),
      undercurrents: this.undercurrents.toJSON(),
      tickCount: this._tickCount,
    };
  }

  static fromJSON(data) {
    const psyche = new Psyche();
    if (data.emotion) psyche.emotion = EmotionEngine.fromJSON(data.emotion);
    if (data.calibration) psyche.calibration = CalibrationTracker.fromJSON(data.calibration);
    if (data.undercurrents) psyche.undercurrents = UndercurrentManager.fromJSON(data.undercurrents);
    if (data.tickCount) psyche._tickCount = data.tickCount;
    return psyche;
  }

  onChange(fn) { this._listeners.push(fn); return this; }

  _emit(event, data) {
    for (const fn of this._listeners) {
      try { fn(event, data); } catch {}
    }
  }

  _buildNarrative(emotionState) {
    const parts = [emotionState.narrative];
    const dominant = this.undercurrents.getDominant();
    if (dominant && dominant.strength > 0.4) {
      parts.push(`Undercurrent: ${dominant.name} (${dominant.strength})`);
    }
    const cal = this.calibration.isCalibrated();
    if (cal === false) {
      parts.push('Calibration: overconfident');
    }
    return parts.join(' | ');
  }
}
