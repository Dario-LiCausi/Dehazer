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
