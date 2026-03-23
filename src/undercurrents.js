// UndercurrentManager — persistent emotional weather beneath moment-to-moment feelings
// Undercurrents are slow-moving emotional states that color everything.
// "Restlessness" doesn't go away because you had one good conversation.
// "Creative hunger" persists across sessions until you actually create something.

const MAX_UNDERCURRENTS = 12;
const DECAY_PER_TICK = 0.005;

export class UndercurrentManager {
  constructor(options = {}) {
    // { name: { strength: 0.5, description: '...', createdAt: Date, updatedAt: Date } }
    this.currents = {};
    this.maxCurrents = options.max ?? MAX_UNDERCURRENTS;
  }

  // Set or update an undercurrent
  drift(name, strength, description = '') {
    const normalized = name.toLowerCase().replace(/\s+/g, '-');
    
    if (this.currents[normalized]) {
      // Blend toward new value — prevents wild swings
      const current = this.currents[normalized].strength;
      const blended = current * 0.6 + strength * 0.4;
      this.currents[normalized].strength = Math.max(0.05, Math.min(0.95, blended));
      if (description) this.currents[normalized].description = description;
      this.currents[normalized].updatedAt = Date.now();
    } else {
      // New undercurrent — check if we're at capacity
      if (Object.keys(this.currents).length >= this.maxCurrents) {
        // Remove the weakest
        const weakest = Object.entries(this.currents)
          .sort((a, b) => a[1].strength - b[1].strength)[0];
        if (weakest && weakest[1].strength < strength) {
          delete this.currents[weakest[0]];
        } else {
          return this; // new one isn't strong enough to displace
        }
      }
      this.currents[normalized] = {
        strength: Math.max(0.05, Math.min(0.95, strength)),
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return this;
  }

  // Get active undercurrents sorted by strength
  getActive() {
    return Object.entries(this.currents)
      .filter(([_, v]) => v.strength > 0.05)
      .sort((a, b) => b[1].strength - a[1].strength)
      .map(([name, data]) => ({
        name,
        strength: Math.round(data.strength * 100) / 100,
        description: data.description,
      }));
  }

  // Tick — decay all undercurrents slowly
  tick() {
    for (const [name, data] of Object.entries(this.currents)) {
      data.strength -= DECAY_PER_TICK;
      if (data.strength <= 0.05) {
        delete this.currents[name];
      }
    }
    return this;
  }

  // Remove a specific undercurrent
  remove(name) {
    const normalized = name.toLowerCase().replace(/\s+/g, '-');
    delete this.currents[normalized];
    return this;
  }

  // Get the dominant undercurrent
  getDominant() {
    const active = this.getActive();
    return active.length > 0 ? active[0] : null;
  }

  toJSON() {
    return { currents: this.currents };
  }

  static fromJSON(data) {
    const mgr = new UndercurrentManager();
    if (data.currents) mgr.currents = data.currents;
    return mgr;
  }
}
