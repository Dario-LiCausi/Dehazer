import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, loadTools, saveTools, cleanMessage, MAX_SHOW, buildScript, CALL_FIELDS, MAX_FIELD } from '../src/tools.js';
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
  assert.deepEqual(TOOLS.map((t) => t.id), ['show', 'call', 'doctor']);
  const s2 = mem(); s2.setItem('dehazer.tools', JSON.stringify(['call', 'show'])); assert.deepEqual(loadTools(s2), ['show', 'call']); // doctor not saved, so not on
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

test('call script: fills the fields in plain words', () => {
  const t = buildScript({ who: 'the surgery', why: 'to book a blood test', name: 'Sam', phone: '07000 000000', when: 'after 2 pm', slow: false, writing: true });
  assert.match(t, /My name is Sam\./);
  assert.match(t, /I am calling the surgery\./);
  assert.match(t, /to book a blood test/);
  assert.match(t, /07000 000000/);
  assert.match(t, /after 2 pm/);
  assert.match(t, /in writing/i);
  assert.ok(!/go slowly/i.test(t));
});
test('call script: slow request only when ticked; empty fields are left out', () => {
  assert.match(buildScript({ slow: true }), /go slowly/i);
  const t = buildScript({});
  assert.ok(!/undefined|null|\[object/.test(t));
  assert.ok(!/My name is/.test(t) && !/My number/.test(t));
});
test('call script: fields are trimmed and limited', () => {
  const t = buildScript({ why: 'x'.repeat(900) });
  assert.ok(t.length < 900); assert.equal(MAX_FIELD, 200);
  assert.deepEqual(CALL_FIELDS.map((f) => f.id), ['who', 'why', 'name', 'phone', 'when']);
  assert.equal(buildScript({ name: 5, why: {} }).includes('5'), false);
});
test('call script wording avoids banned words', () => {
  const t = buildScript({ who: 'a', why: 'b', name: 'c', phone: '1', when: 'd', slow: true, writing: true }).toLowerCase();
  for (const w of ['missed', 'overdue', 'streak', 'behind', 'failed']) assert.ok(!t.includes(w), w);
});

import { beforeHangUp } from '../src/tools.js';
test('hang-up list follows the writing box', () => {
  assert.equal(beforeHangUp(true).length, 3); assert.equal(beforeHangUp(false).length, 2);
  assert.ok(!beforeHangUp(false).join(' ').includes('writing'));
});

import { buildSheet, sheetText, MAX_QUESTIONS } from '../src/tools.js';
test('doctor sheet: labelled sections, empty ones left out', () => {
  const s = buildSheet({ reason: 'a sore knee', main: 'it hurts on stairs', help: 'explain each step first', questions: 'Is it serious?\nWhat next?', writing: true });
  assert.deepEqual(s.map((x) => x.heading), ['Why I am here today', 'The main thing I want to talk about', 'What helps me in the room', 'Questions I want to ask', 'Please']);
  assert.deepEqual(s[3].lines, ['Is it serious?', 'What next?']);
  assert.deepEqual(buildSheet({}), []);
});
test('doctor sheet: questions limited, trimmed, non-strings ignored', () => {
  const q = Array.from({ length: 12 }, (_, i) => ` q${i} `).join('\n') + '\n\n';
  const s = buildSheet({ questions: q });
  assert.equal(s[0].lines.length, MAX_QUESTIONS); assert.equal(MAX_QUESTIONS, 5); assert.equal(s[0].lines[0], 'q0');
  assert.deepEqual(buildSheet({ reason: 7, main: {}, questions: null }), []);
  assert.ok(buildSheet({ reason: 'x'.repeat(900) })[0].lines[0].length <= 500);
});
test('doctor sheet: text version and banned words', () => {
  const t = sheetText(buildSheet({ reason: 'r', main: 'm', help: 'h', questions: 'q', writing: true }));
  assert.match(t, /Why I am here today\nr/);
  for (const w of ['missed', 'overdue', 'streak', 'behind', 'failed']) assert.ok(!t.toLowerCase().includes(w), w);
  assert.equal(TOOLS.map((x) => x.id).includes('doctor'), true);
});

import { checkSheet } from '../src/tools.js';
test('doctor sheet: too many or too long questions give a plain message, nothing is cut silently', () => {
  assert.equal(checkSheet({ questions: 'a\nb' }), '');
  assert.match(checkSheet({ questions: 'a\nb\nc\nd\ne\nf' }), /5 questions/);
  assert.match(checkSheet({ questions: 'x'.repeat(201) }), /200/);
  assert.equal(checkSheet({}), ''); assert.equal(checkSheet({ questions: 7 }), '');
});
