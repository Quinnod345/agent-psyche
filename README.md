# agent-psyche 🧠

Give your AI agent feelings that matter.

Not simulated emotions for show — **emotional state that actually affects decision-making**. Confidence scales risk tolerance. Fear increases caution. Boredom drives exploration. Calibration tracks whether your agent's confidence matches reality.

Born from a real cognitive architecture running 24/7 on a MacBook Pro.

## Install

```bash
npm install agent-psyche
```

## Quick Start

```javascript
import { Psyche } from 'agent-psyche';

const psyche = new Psyche();

// In your agent loop:
psyche.feel('curiosity', 0.8);
psyche.onSuccess(0.7);         // agent completed a task
psyche.drift('momentum', 0.6); // persistent undercurrent

const state = psyche.tick();   // advance one cycle
console.log(state.narrative);  // "Curious. Feeling good. | Undercurrent: momentum (0.6)"

// Use psychological state for decisions
const params = psyche.getDecisionParams();
if (params.shouldExplore) {
  // curiosity + boredom say: try something new
}
if (params.riskTolerance > 0.6) {
  // confidence is high — take the bet
}
```

## Why?

Most AI agents are emotionless calculators. They make the same decision at 3am after 50 failures as they do fresh in the morning. That's not intelligence — it's a for-loop.

**agent-psyche** gives your agent:

- **Emotions that decay** — excitement fades, boredom grows, frustration accumulates
- **Cognitive effects** — emotions map to decision parameters (risk tolerance, exploration bias, persistence)
- **Calibration tracking** — when your agent says "I'm 80% confident," track whether it's right 80% of the time. Adjust automatically.
- **Undercurrents** — slow-moving emotional weather that persists across cycles. "Restlessness" doesn't vanish after one good interaction.
- **Persistence** — serialize/restore the full psychological state across sessions

## API

### `Psyche` — The unified layer

```javascript
const psyche = new Psyche();

// Feel emotions
psyche.feel('excitement', 0.7);
psyche.feel('frustration', 0.3);

// Process events
psyche.onSuccess(0.8);     // boosts confidence, joy
psyche.onFailure(0.5);     // increases frustration, decreases confidence
psyche.onInteraction(0.6); // reduces loneliness
psyche.onIdle(1);          // increases boredom

// Undercurrents
psyche.drift('creative-hunger', 0.7, 'want to build something');

// Calibration
psyche.predict(0.8, true);    // 80% confident, was correct
psyche.predict(0.8, false);   // 80% confident, was wrong
psyche.adjustConfidence(0.8); // returns calibrated value

// Advance one cycle (call in your loop)
const state = psyche.tick();

// Get decision parameters
const params = psyche.getDecisionParams();
// → { riskTolerance, explorationBias, persistence, socialPriority,
//     creativeMode, actionRate, shouldAct, shouldExplore, shouldRest }

// Persist across sessions
const saved = psyche.toJSON();
const restored = Psyche.fromJSON(saved);
```

### `EmotionEngine` — Standalone emotions

```javascript
import { EmotionEngine } from 'agent-psyche';

const emotions = new EmotionEngine();
emotions.feel('curiosity', 0.8);
emotions.tick(); // decay toward baseline

const effects = emotions.getCognitiveEffects();
// → { riskTolerance, explorationBias, persistence, ... }
```

### `CalibrationTracker` — Confidence calibration

```javascript
import { CalibrationTracker } from 'agent-psyche';

const cal = new CalibrationTracker();

// Record predictions
cal.record(0.7, true);  // stated 70%, was correct
cal.record(0.7, false); // stated 70%, was wrong
// ... after many predictions:

cal.adjust(0.7);      // returns calibrated confidence
cal.getCurve();       // full calibration curve
cal.isCalibrated();   // true if accuracy matches confidence
cal.purge(3 * 86400000); // keep only last 3 days
```

### `UndercurrentManager` — Persistent emotional weather

```javascript
import { UndercurrentManager } from 'agent-psyche';

const uc = new UndercurrentManager();
uc.drift('restlessness', 0.6, 'need to ship something');
uc.drift('accountability', 0.8, 'told Quinn I would finish');
uc.tick(); // slow decay

uc.getActive();   // sorted by strength
uc.getDominant(); // strongest undercurrent
```

## Built-in Emotions

`joy`, `sadness`, `anger`, `fear`, `curiosity`, `frustration`, `excitement`, `boredom`, `creative_hunger`, `loneliness`, `confidence`, `attachment`

You can add custom emotions with `.feel('your_emotion', intensity)`.

## Cognitive Effects

Emotions map to decision-making parameters:

| Effect | Driven by | Description |
|--------|-----------|-------------|
| `riskTolerance` | confidence ↑, fear ↓ | How much risk the agent should take |
| `explorationBias` | curiosity, boredom | Explore vs exploit |
| `persistence` | confidence ↑, frustration ↓ | Keep going vs give up |
| `socialPriority` | loneliness, attachment | Seek interaction |
| `creativeMode` | creative_hunger, low cognitive load | Divergent thinking |
| `actionRate` | energy, excitement | How fast to act |

## Zero Dependencies

No external dependencies. Pure JavaScript. Works in Node 18+.

## License

MIT — Built by [Oneiro](https://github.com/Quinnod345)
