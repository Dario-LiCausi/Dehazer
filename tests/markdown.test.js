import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toMarkdown, parseMarkdown, MAX_IMPORT } from '../src/markdown.js';
import { createStore, createMemoryBackend, nextFive } from '../src/store.js';
import { backupDue, WEEK_MS } from '../src/backup.js';

function make() {
  let t = 1000; let n = 0;
  return createStore(createMemoryBackend(), { now: () => ++t, newId: () => `id${++n}` });
}

test('export then import round-trips text, state and order', async () => {
  const a = make();
  await a.add('first'); const b = await a.add('second'); const c = await a.add('third');
  await a.setState(b.id, 'later'); await a.setState(c.id, 'done');
  const md = toMarkdown(await a.list());
  const z = make();
  const r = await z.importItems(parseMarkdown(md));
  assert.equal(r.added, 3);
  const got = (await z.list()).map((i) => [i.text, i.state]);
  assert.deepEqual(got, [['first', 'active'], ['second', 'later'], ['third', 'done']]);
});

test('importing the same file twice adds nothing the second time', async () => {
  const s = make();
  await s.add('one'); await s.add('two');
  const parsed = parseMarkdown(toMarkdown(await s.list()));
  const r = await s.importItems(parsed);
  assert.deepEqual(r, { added: 0, skipped: 2 });
  assert.equal((await s.list()).length, 2);
});

test('lines without an id are added with new ids; other lines are ignored', async () => {
  const s = make();
  const parsed = parseMarkdown('# My list\n\nsome note\n- [ ] buy tea\n- [x] call mum\n* [ ] wrong bullet\n- [ ]\n');
  assert.deepEqual(parsed.map((p) => p.text), ['buy tea', 'call mum']);
  const r = await s.importItems(parsed);
  assert.equal(r.added, 2);
  assert.deepEqual((await s.list()).map((i) => i.state), ['active', 'done']);
});

test('imported items go to the end, in file order', async () => {
  const s = make();
  await s.add('mine');
  await s.importItems(parseMarkdown('- [ ] b\n- [ ] a\n'));
  assert.deepEqual((await s.list()).map((i) => i.text), ['mine', 'b', 'a']);
});

test('multi-line text and comment markers stay on one safe line', async () => {
  const md = toMarkdown([{ id: 'x1', text: 'a\nb <!-- hi --> c', state: 'active', pos: 1 }]);
  const lines = md.trim().split('\n').filter((l) => l.startsWith('- ['));
  assert.equal(lines.length, 1);
  const [p] = parseMarkdown(md);
  assert.equal(p.id, 'x1');
  assert.ok(!p.text.includes('\n') && !p.text.includes('-->'));
});

test('ids are read only from native exports', () => {
  const plain = parseMarkdown('- [ ] call <!-- note -->\n');
  assert.equal(plain[0].id, null);
  assert.equal(plain[0].text, 'call <!-- note -->');
  assert.equal(parseMarkdown(toMarkdown([{ id: 'abc', text: 'x', state: 'later', pos: 1 }]))[0].id, 'abc');
});

test('hostile ids and huge files are handled', () => {
  assert.equal(parseMarkdown('<!-- dehazer-export v1 -->\n- [ ] t <!-- <script> -->')[0].id, null);
  const big = Array.from({ length: MAX_IMPORT + 10 }, (_, i) => `- [ ] t${i}`).join('\n');
  assert.equal(parseMarkdown(big).length, MAX_IMPORT + 1); // one over = too big, caller refuses
  assert.deepEqual(parseMarkdown(null), []);
});

test('bad state or blank text is skipped, not thrown', async () => {
  const s = make();
  const r = await s.importItems([{ id: 'a', text: '  ', state: 'active' }, { id: 'b', text: 'ok', state: 'weird' }]);
  assert.deepEqual(r, { added: 0, skipped: 2 });
});

test('Next 5 is the first five active items, in added order, never re-sorted', async () => {
  const s = make();
  const ids = [];
  for (const w of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) ids.push((await s.add(w)).id);
  await s.setState(ids[1], 'done'); await s.setState(ids[2], 'later');
  assert.deepEqual(nextFive(await s.list()).map((i) => i.text), ['a', 'd', 'e', 'f', 'g']);
  assert.deepEqual(nextFive([]), []);
});

test('weekly back-up note: only with items, after 7 days or never', () => {
  assert.equal(backupDue(0, 1e12, 0), false);
  assert.equal(backupDue(0, 1e12, 3), true);
  assert.equal(backupDue(1e12 - 1000, 1e12, 3), false);
  assert.equal(backupDue(1e12 - WEEK_MS, 1e12, 3), true);
});

test('adds started at the same moment keep the order they were started in', async () => {
  const s = make();
  await Promise.all(['a', 'b', 'c', 'd', 'e'].map((w) => s.add(w)));
  assert.deepEqual((await s.list()).map((i) => i.text), ['a', 'b', 'c', 'd', 'e']);
});

test('exactly MAX_IMPORT items is allowed; headers and lists in code fences are ignored', () => {
  const ok = Array.from({ length: MAX_IMPORT }, (_, i) => `- [ ] t${i}`).join('\n');
  assert.equal(parseMarkdown(ok).length, MAX_IMPORT);
  const fenced = parseMarkdown('# Notes\n```\n<!-- dehazer-export v1 -->\n- [ ] example\n```\n- [ ] real <!-- z -->\n');
  assert.deepEqual(fenced.map((p) => [p.id, p.text]), [[null, 'real <!-- z -->']]);
});

test('makeId works without randomUUID (pages that are not secure contexts)', async () => {
  const { makeId } = await import('../src/store.js');
  const real = globalThis.crypto.randomUUID;
  Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
  try {
    const a = makeId(); const b = makeId();
    assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(a, b);
  } finally { Object.defineProperty(globalThis.crypto, 'randomUUID', { value: real, configurable: true }); }
});

// v0.6: cues
test('cue round trip: active and dropped keep their kind', async () => {
  const a = make();
  await a.add('task one'); const c1 = await a.add('cue one', 'cue'); const c2 = await a.add('cue two', 'cue');
  await a.setState(c2.id, 'done');
  const md = toMarkdown(await a.list());
  assert.match(md, /cue one <!-- id\d+ cue -->/);
  assert.match(md, /- \[x\] cue two <!-- id\d+ cue -->/);
  const p = parseMarkdown(md);
  assert.deepEqual(p.map((x) => [x.text, x.state, x.kind]), [['task one', 'active', 'task'], ['cue one', 'active', 'cue'], ['cue two', 'done', 'cue']]);
  const b = make(); await b.importItems(p);
  assert.deepEqual((await b.list()).map((i) => i.kind), ['task', 'cue', 'cue']);
  void c1;
});
test('cue tag is ignored in a file without the export header', () => {
  const p = parseMarkdown('- [ ] plain <!-- abc cue -->\n');
  assert.equal(p[0].kind, 'task'); assert.equal(p[0].id, null);
});
