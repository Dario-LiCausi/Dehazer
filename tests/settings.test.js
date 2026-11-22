import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, loadSettings, saveSettings } from '../src/settings.js';
import { whatsNewDue, markSeen, VERSION } from '../src/whatsnew.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

test('defaults when nothing saved', () => { assert.deepEqual(loadSettings(mem()), DEFAULTS); });
test('defaults hold calm, no reminders pushed', () => {
  assert.equal(DEFAULTS.theme, 'system'); assert.equal(DEFAULTS.size, 'normal');
  assert.equal(DEFAULTS.font, 'system'); assert.equal(DEFAULTS.backupNote, true);
});
test('save then load round trip', () => {
  const s = mem(); saveSettings(s, { ...DEFAULTS, theme: 'dark', size: 'large', font: 'easy', backupNote: false });
  assert.deepEqual(loadSettings(s), { theme: 'dark', size: 'large', font: 'easy', backupNote: false });
});
test('bad stored values fall back to defaults', () => {
  const s = mem(); s.setItem('dehazer.settings', '{"theme":"pink","size":9,"font":"x","backupNote":"yes"}');
  assert.deepEqual(loadSettings(s), DEFAULTS);
  s.setItem('dehazer.settings', 'not json'); assert.deepEqual(loadSettings(s), DEFAULTS);
});
test('blocked storage does not throw', () => {
  const bad = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); } };
  assert.deepEqual(loadSettings(bad), DEFAULTS); saveSettings(bad, DEFAULTS);
  assert.equal(whatsNewDue(bad), false);
});
test('what changed: new user is not greeted; update shows once', () => {
  const s = mem();
  assert.equal(whatsNewDue(s), false); // first run records the version silently
  assert.equal(whatsNewDue(s), false);
  s.setItem('dehazer.seenVersion', '0.0.1');
  assert.equal(whatsNewDue(s), true);
  markSeen(s);
  assert.equal(whatsNewDue(s), false);
  assert.equal(s.getItem('dehazer.seenVersion'), VERSION);
});
