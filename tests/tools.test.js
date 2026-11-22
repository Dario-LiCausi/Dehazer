import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, loadTools, saveTools, cleanMessage, MAX_SHOW } from '../src/tools.js';
import { MSG } from '../src/messages.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

test('every tool is off by default', () => { assert.deepEqual(loadTools(mem()), []); });
test('unknown ids and wrong types are dropped', () => {
  const s = mem(); s.setItem('dehazer.tools', JSON.stringify(['show', 'nope', 7, null, 'show']));
  assert.deepEqual(loadTools(s), ['show']);
  s.setItem('dehazer.tools', '{"a":1}'); assert.deepEqual(loadTools(s), []);
});
test('bad JSON gives an empty list', () => { const s = mem(); s.setItem('dehazer.tools', 'oops'); assert.deepEqual(loadTools(s), []); });
test('blocked storage does not throw', () => {
  const bad = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); } };
  assert.deepEqual(loadTools(bad), []); saveTools(bad, ['show']);
  assert.deepEqual(loadTools(undefined), []);
});
test('round trip; order follows the registry', () => {
  const s = mem(); saveTools(s, ['show']); assert.deepEqual(loadTools(s), ['show']);
  assert.deepEqual(TOOLS.map((t) => t.id), ['show']);
});
test('message cleaning: trims, limits to 500, keeps line breaks', () => {
  assert.equal(cleanMessage('  hi  '), 'hi');
  assert.equal(cleanMessage('a\nb'), 'a\nb');
  assert.equal(cleanMessage('x'.repeat(900)).length, MAX_SHOW);
  assert.equal(MAX_SHOW, 500);
  assert.equal(cleanMessage(undefined), '');
});
test('tool wording avoids banned words', () => {
  const text = JSON.stringify([TOOLS, Object.entries(MSG).filter(([k]) => k.startsWith('tools') || k.startsWith('show'))]);
  for (const w of ['missed', 'overdue', 'streak', 'behind', 'failed']) assert.ok(!text.toLowerCase().includes(w), w);
});
test('tools-ui.js loads (syntax check) and exports mountTools', async () => {
  const m = await import('../src/tools-ui.js'); assert.equal(typeof m.mountTools, 'function');
});
