#!/usr/bin/env node
// agent-psyche CLI — quick demo/test of the psyche system

import { Psyche } from './psyche.js';

const psyche = new Psyche();

console.log('🧠 agent-psyche demo\n');

// Simulate an agent lifecycle
console.log('Starting fresh...');
console.log('State:', JSON.stringify(psyche.getState().emotion.narrative));
console.log('Effects:', psyche.getDecisionParams());

console.log('\n--- Agent gets a task and succeeds ---');
psyche.feel('excitement', 0.7);
psyche.onSuccess(0.8);
psyche.predict(0.7, true);
psyche.drift('momentum', 0.6, 'things are working');
let state = psyche.tick();
console.log('Narrative:', state.narrative);
console.log('Effects:', state.effects);

console.log('\n--- Agent fails twice ---');
psyche.onFailure(0.6);
psyche.predict(0.8, false);
psyche.onFailure(0.4);
psyche.predict(0.6, false);
psyche.drift('doubt', 0.4, 'two failures in a row');
state = psyche.tick();
console.log('Narrative:', state.narrative);
console.log('Decision params:', psyche.getDecisionParams());

console.log('\n--- Long idle period ---');
for (let i = 0; i < 20; i++) {
  psyche.onIdle(1);
  psyche.tick();
}
state = psyche.getState();
console.log('After 20 idle ticks:');
console.log('Narrative:', state.narrative);
console.log('Undercurrents:', state.undercurrents);

console.log('\n--- Calibration ---');
// Simulate 30 predictions at 0.7 confidence, 50% correct (overconfident)
for (let i = 0; i < 30; i++) {
  psyche.predict(0.7, Math.random() < 0.5);
}
console.log('Calibration:', psyche.calibration.getSummary());
console.log('Adjusted 0.7 confidence:', psyche.adjustConfidence(0.7));

console.log('\n--- Persistence ---');
const saved = JSON.stringify(psyche.toJSON());
const restored = Psyche.fromJSON(JSON.parse(saved));
console.log('Restored narrative:', restored.getState().narrative);
console.log(`Serialized size: ${saved.length} bytes`);

console.log('\n✅ agent-psyche is working');
