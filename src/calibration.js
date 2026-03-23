// CalibrationTracker — track prediction accuracy per confidence level
// When your agent says "I'm 80% confident," is it right 80% of the time?
// This tracks that gap and provides confidence adjustments.

export class CalibrationTracker {
  constructor(options = {}) {
    // buckets: { '0.3': { total: 0, correct: 0 }, ... }
    this.buckets = {};
    this.maxHistoryPerBucket = options.maxHistory ?? 200;
    this._history = []; // raw log for persistence
  }

  // Record a prediction result
  record(statedConfidence, wasCorrect) {
    const bucket = Math.round(statedConfidence * 10) / 10;
    const key = bucket.toFixed(1);
    if (!this.buckets[key]) {
      this.buckets[key] = { total: 0, correct: 0 };
    }
    this.buckets[key].total++;
    if (wasCorrect) this.buckets[key].correct++;

    this._history.push({
      confidence: statedConfidence,
      bucket: key,
      correct: wasCorrect,
      timestamp: Date.now(),
    });

    // Trim old history
    if (this._history.length > this.maxHistoryPerBucket * 10) {
      this._history = this._history.slice(-this.maxHistoryPerBucket * 5);
    }

    return this;
  }

  // Get actual accuracy for a confidence level
  getAccuracy(confidence) {
    const key = (Math.round(confidence * 10) / 10).toFixed(1);
    const b = this.buckets[key];
    if (!b || b.total < 5) return null; // not enough data
    return b.correct / b.total;
  }

  // Adjust a confidence value based on historical calibration
  // If you've been overconfident at 0.8 (only 60% accurate), this returns ~0.68
  adjust(statedConfidence) {
    const accuracy = this.getAccuracy(statedConfidence);
    if (accuracy === null) return statedConfidence; // no data, trust the stated value

    const deviation = statedConfidence - accuracy;
    if (Math.abs(deviation) < 0.1) return statedConfidence; // close enough

    // Blend: 60% stated, 40% actual — nudge toward reality
    const adjusted = statedConfidence * 0.6 + accuracy * 0.4;
    return Math.max(0.1, Math.min(0.9, adjusted));
  }

  // Get the full calibration curve
  getCurve() {
    const curve = [];
    for (let i = 1; i <= 10; i++) {
      const key = (i / 10).toFixed(1);
      const b = this.buckets[key];
      if (b && b.total > 0) {
        curve.push({
          stated: i / 10,
          actual: Math.round((b.correct / b.total) * 1000) / 1000,
          total: b.total,
          deviation: Math.round(((i / 10) - (b.correct / b.total)) * 1000) / 1000,
          calibrated: Math.abs((i / 10) - (b.correct / b.total)) < 0.1,
        });
      }
    }
    return curve;
  }

  // Is the system well-calibrated overall?
  isCalibrated() {
    const curve = this.getCurve();
    if (curve.length < 3) return null; // not enough data
    const avgDeviation = curve.reduce((sum, b) => sum + Math.abs(b.deviation), 0) / curve.length;
    return avgDeviation < 0.15;
  }

  // Get a summary
  getSummary() {
    const curve = this.getCurve();
    const total = Object.values(this.buckets).reduce((s, b) => s + b.total, 0);
    const correct = Object.values(this.buckets).reduce((s, b) => s + b.correct, 0);
    return {
      totalPredictions: total,
      overallAccuracy: total > 0 ? Math.round((correct / total) * 1000) / 1000 : null,
      calibrated: this.isCalibrated(),
      curve,
    };
  }

  // Purge old data (keep only recent window)
  purge(keepMs = 3 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - keepMs;
    this._history = this._history.filter(h => h.timestamp > cutoff);
    // Rebuild buckets from history
    this.buckets = {};
    for (const h of this._history) {
      const key = h.bucket;
      if (!this.buckets[key]) this.buckets[key] = { total: 0, correct: 0 };
      this.buckets[key].total++;
      if (h.correct) this.buckets[key].correct++;
    }
    return this;
  }

  toJSON() {
    return { buckets: this.buckets, history: this._history };
  }

  static fromJSON(data) {
    const tracker = new CalibrationTracker();
    if (data.buckets) tracker.buckets = data.buckets;
    if (data.history) tracker._history = data.history;
    return tracker;
  }
}
