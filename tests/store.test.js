import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, createMemoryBackend, MAX_TEXT } from '../src/store.js';

function make() {
  let t = 1000; let n = 0;
  return createStore(createMemoryBackend(), { now: () => ++t, newId: () => `id${++n}` });
}

test('add saves a trimmed item as active', async () => {
  const s = make();
  const item = await s.add('  buy bread  ');
  assert.equal(item.text, 'buy bread');
  assert.equal(item.state, 'active');
  assert.equal((await s.list()).length, 1);
});

test('empty or blank capture is ignored', async () => {
  const s = make();
  assert.equal(await s.add(''), null);
  assert.equal(await s.add('   \n '), null);
  assert.equal(await s.add(undefined), null);
  assert.equal((await s.list()).length, 0);
});

test('long text is cut to MAX_TEXT', async () => {
  const s = make();
  const item = await s.add('x'.repeat(MAX_TEXT + 50));
  assert.equal(item.text.length, MAX_TEXT);
});

test('list keeps the order items were added', async () => {
  const s = make();
  for (const w of ['c', 'a', 'b']) await s.add(w);
  assert.deepEqual((await s.list()).map((i) => i.text), ['c', 'a', 'b']);
});

test('changing state never changes the order', async () => {
  const s = make();
  const a = await s.add('a'); await s.add('b'); await s.add('c');
  await s.setState(a.id, 'done');
  assert.deepEqual((await s.list()).map((i) => i.text), ['a', 'b', 'c']);
  assert.equal((await s.list())[0].state, 'done');
});

test('setState rejects an unknown state and ignores an unknown id', async () => {
  const s = make();
  const a = await s.add('a');
  await assert.rejects(() => s.setState(a.id, 'overdue'));
  assert.equal(await s.setState('nope', 'later'), null);
});

test('later sets state later and updates the time', async () => {
  const s = make();
  const a = await s.add('a');
  const b = await s.setState(a.id, 'later');
  assert.equal(b.state, 'later');
  assert.ok(b.updated > a.updated);
});

test('remove then restore puts the item back in the same place', async () => {
  const s = make();
  await s.add('a'); const b = await s.add('b'); await s.add('c');
  const gone = await s.remove(b.id);
  assert.deepEqual((await s.list()).map((i) => i.text), ['a', 'c']);
  await s.restore(gone);
  assert.deepEqual((await s.list()).map((i) => i.text), ['a', 'b', 'c']);
});

test('new item after a delete never reuses an order slot that moves others', async () => {
  const s = make();
  await s.add('a'); const b = await s.add('b');
  await s.remove(b.id);
  await s.add('c');
  assert.deepEqual((await s.list()).map((i) => i.text), ['a', 'c']);
});

test('restore does not duplicate an item that still exists', async () => {
  const s = make();
  const a = await s.add('a');
  assert.equal(await s.restore(a), null);
  assert.equal((await s.list()).length, 1);
});

test('remove of an unknown id returns null', async () => {
  assert.equal(await make().remove('nope'), null);
});

// v0.6: kinds
test('add with kind cue sets schedule fields; default is task', async () => {
  const s = make();
  const t = await s.add('a task'); const c = await s.add('a reason', 'cue');
  assert.equal(t.kind, 'task');
  assert.equal(c.kind, 'cue'); assert.equal(c.step, 0); assert.equal(c.due, c.created); assert.equal(c.shown, 0);
});
test('addMany gives every line the kind', async () => {
  const s = make();
  const out = await s.addMany(['x', 'y'], 'cue');
  assert.deepEqual(out.map((i) => i.kind), ['cue', 'cue']);
});
test('old item without kind counts as a task in nextFive', async () => {
  const { nextFive } = await import('../src/store.js');
  const old = { id: 'o', text: 'old', state: 'active', pos: 1, created: 1, updated: 1 };
  assert.deepEqual(nextFive([old]).map((i) => i.id), ['o']);
});
test('nextFive ignores cues', async () => {
  const { nextFive } = await import('../src/store.js');
  const s = make();
  await s.add('cue one', 'cue'); await s.add('task one');
  assert.deepEqual(nextFive(await s.list()).map((i) => i.text), ['task one']);
});
test('markCueShown sets shown, advances step and due', async () => {
  const day0 = new Date(2026, 0, 10, 9).getTime(); let n = 0;
  const s = createStore(createMemoryBackend(), { now: () => day0, newId: () => `c${++n}` });
  const c = await s.add('r', 'cue');
  const after = await s.markCueShown(c.id, day0);
  assert.equal(after.shown, day0); assert.equal(after.step, 1);
  assert.equal(after.due, new Date(2026, 0, 12).getTime()); // day 3
  assert.equal((await s.markCueShown(c.id, day0 + 2 * 86400000)).due, new Date(2026, 0, 16).getTime()); // day 7
});
test('markCueShown on a task or missing id does nothing', async () => {
  const s = make(); const t = await s.add('task');
  assert.equal(await s.markCueShown(t.id, 5), null);
  assert.equal(await s.markCueShown('nope', 5), null);
});
test('drop and undo a cue use the done and active states', async () => {
  const s = make(); const c = await s.add('r', 'cue');
  assert.equal((await s.setState(c.id, 'done')).state, 'done');
  assert.equal((await s.setState(c.id, 'active')).state, 'active');
});
test('import keeps the kind', async () => {
  const s = make();
  await s.importItems([{ id: 'z', text: 'cue z', state: 'active', kind: 'cue' }, { id: 'y', text: 'task y', state: 'active' }]);
  const l = await s.list();
  assert.equal(l.find((i) => i.id === 'z').kind, 'cue'); assert.equal(l.find((i) => i.id === 'z').step, 0);
  assert.equal(l.find((i) => i.id === 'y').kind, 'task');
});
test('markCueShown twice on the same day does not advance the schedule twice', async () => {
  const day0 = new Date(2026, 0, 10, 9).getTime(); let n = 0;
  const s = createStore(createMemoryBackend(), { now: () => day0, newId: () => `c${++n}` });
  const c = await s.add('r', 'cue');
  await s.markCueShown(c.id, day0);
  const again = await s.markCueShown(c.id, day0 + 3600000);
  assert.equal(again.step, 1);
});
test('markCueShown skips repeats that already passed', async () => {
  const day0 = new Date(2026, 0, 1, 9).getTime(); let n = 0;
  const s = createStore(createMemoryBackend(), { now: () => day0, newId: () => `c${++n}` });
  const c = await s.add('r', 'cue');
  const late = new Date(2026, 1, 9, 9).getTime(); // day 40
  const after = await s.markCueShown(c.id, late);
  assert.equal(after.step, 5); // day 60 is the next one
  assert.ok(after.due > late);
});
test('markCueShown ignores a dropped cue', async () => {
  const s = make(); const c = await s.add('r', 'cue');
  await s.setState(c.id, 'done');
  assert.equal(await s.markCueShown(c.id, 5), null);
});
