import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, createMemoryBackend } from '../src/store.js';

function make() {
  let t = 1000; let n = 0;
  return createStore(createMemoryBackend(), { now: () => ++t, newId: () => `id${++n}` });
}
const texts = async (s) => (await s.list()).map((i) => i.text);

test('edit changes text and keeps place and state', async () => {
  const s = make();
  const a = await s.add('one'); await s.add('two');
  await s.setState(a.id, 'later');
  const e = await s.edit(a.id, '  uno  ');
  assert.equal(e.text, 'uno'); assert.equal(e.state, 'later');
  assert.deepEqual(await texts(s), ['uno', 'two']);
});

test('edit with blank text changes nothing', async () => {
  const s = make();
  const a = await s.add('one');
  assert.equal(await s.edit(a.id, '   '), null);
  assert.deepEqual(await texts(s), ['one']);
  assert.equal(await s.edit('nope', 'x'), null);
});

test('move swaps with the neighbour of the same state, nothing else re-sorts', async () => {
  const s = make();
  const [a, b, c] = [await s.add('a'), await s.add('b'), await s.add('c')];
  await s.move(c.id, 'up');
  assert.deepEqual(await texts(s), ['a', 'c', 'b']);
  await s.move(a.id, 'down');
  assert.deepEqual(await texts(s), ['c', 'a', 'b']);
  await s.move(c.id, 'up'); // already first: no change
  assert.deepEqual(await texts(s), ['c', 'a', 'b']);
  await s.move(b.id, 'down'); // already last
  assert.deepEqual(await texts(s), ['c', 'a', 'b']);
});

test('move skips items of other states', async () => {
  const s = make();
  const [a, b, c] = [await s.add('a'), await s.add('b'), await s.add('c')];
  await s.setState(b.id, 'later');
  await s.move(c.id, 'up'); // swaps with a, not b
  assert.deepEqual((await s.list()).filter((i) => i.state === 'active').map((i) => i.text), ['c', 'a']);
  assert.equal((await s.list()).find((i) => i.id === b.id).state, 'later');
});

test('addMany saves each line in order and ignores blanks', async () => {
  const s = make();
  const r = await s.addMany(['x', '  ', 'y', 'z']);
  assert.equal(r.length, 3);
  assert.deepEqual(await texts(s), ['x', 'y', 'z']);
});

test('undo of a deleted last item does not tie with a newer item', async () => {
  const s = make();
  await s.add('a'); const b = await s.add('b');
  const gone = await s.remove(b.id);
  await s.add('c'); // takes the place b had
  await s.restore(gone);
  const all = await s.list();
  assert.equal(new Set(all.map((i) => i.pos)).size, all.length);
  assert.deepEqual(all.map((i) => i.text), ['a', 'c', 'b']);
});
