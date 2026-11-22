import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, createMemoryBackend } from '../src/store.js';

// Two stores on one backend stand in for two browser tabs on one database.
function twoTabs() {
  const backend = createMemoryBackend();
  let n = 0; let t = 1000;
  const opts = { now: () => ++t, newId: () => `id${++n}` };
  return { a: createStore(backend, opts), b: createStore(backend, opts), backend };
}

test('two tabs adding at once never share a position', async () => {
  const { a, b } = twoTabs();
  await Promise.all([a.add('one'), b.add('two'), a.add('three'), b.add('four')]);
  const pos = (await a.list()).map((i) => i.pos);
  assert.equal(new Set(pos).size, 4, `positions must differ, got ${pos}`);
});

test('two tabs importing at once never share a position', async () => {
  const { a, b } = twoTabs();
  await Promise.all([
    a.importItems([{ text: 'a1', state: 'active' }, { text: 'a2', state: 'active' }]),
    b.importItems([{ text: 'b1', state: 'active' }, { text: 'b2', state: 'active' }]),
  ]);
  const pos = (await a.list()).map((i) => i.pos);
  assert.equal(new Set(pos).size, 4, `positions must differ, got ${pos}`);
});

test('a failed import changes nothing, so a retry cannot duplicate', async () => {
  const backend = createMemoryBackend();
  let n = 0;
  const s = createStore(backend, { now: () => 1, newId: () => `id${++n}` });
  const real = backend.transact.bind(backend);
  let puts = 0;
  // Fail the 2nd write inside the transaction.
  backend.transact = (fn) => real((tx) => fn({ ...tx, put: async (i) => { if (++puts === 2) throw new Error('disk full'); return tx.put(i); } }));
  await assert.rejects(s.importItems([{ text: 'x', state: 'active' }, { text: 'y', state: 'active' }, { text: 'z', state: 'active' }]), /disk full/);
  assert.equal((await s.list()).length, 0, 'nothing is kept from a failed import');
  backend.transact = real;
  const r = await s.importItems([{ text: 'x', state: 'active' }, { text: 'y', state: 'active' }, { text: 'z', state: 'active' }]);
  assert.equal(r.added, 3);
  assert.equal((await s.list()).length, 3);
});

test('a plain read and the old four methods still work on the backend', async () => {
  const b = createMemoryBackend();
  await b.put({ id: 'q', pos: 1 });
  assert.equal((await b.get('q')).pos, 1);
  assert.equal((await b.getAll()).length, 1);
  await b.delete('q');
  assert.equal(await b.get('q'), undefined);
});

test('a failed paste keeps nothing and the next write works', async () => {
  const backend = createMemoryBackend();
  let n = 0;
  const s = createStore(backend, { now: () => 1, newId: () => `id${++n}` });
  const real = backend.transact.bind(backend);
  let puts = 0;
  backend.transact = (fn) => real((tx) => fn({ ...tx, put: async (i) => { if (++puts === 2) throw new Error('disk full'); return tx.put(i); } }));
  await assert.rejects(s.addMany(['a', 'b', 'c']), /disk full/);
  assert.equal((await s.list()).length, 0);
  assert.ok(await s.add('after'), 'the next queued write still works');
  assert.equal((await s.list()).length, 1);
});

test('a failed move keeps both positions and the next write works', async () => {
  const backend = createMemoryBackend();
  let n = 0;
  const s = createStore(backend, { now: () => 1, newId: () => `id${++n}` });
  await s.add('one'); await s.add('two');
  const before = (await s.list()).map((i) => `${i.id}:${i.pos}`).join();
  const real = backend.transact.bind(backend);
  let puts = 0;
  backend.transact = (fn) => real((tx) => fn({ ...tx, put: async (i) => { if (++puts === 2) throw new Error('disk full'); return tx.put(i); } }));
  await assert.rejects(s.move('id2', 'up'), /disk full/);
  assert.equal((await s.list()).map((i) => `${i.id}:${i.pos}`).join(), before);
  backend.transact = real;
  assert.equal(await s.move('id2', 'up'), true);
});

test('a read and a direct write during a failing transaction: read is committed data, write survives', async () => {
  const backend = createMemoryBackend();
  let release; const gate = new Promise((r) => { release = r; });
  let started; const inside = new Promise((r) => { started = r; });
  const tx = backend.transact(async (t) => {
    await t.put({ id: 'half', pos: 1 });
    started();
    await gate; // hold the transaction open after its first write
    throw new Error('forced failure');
  });
  tx.catch(() => {});
  await inside;
  const read = backend.getAll(); // asked while the transaction is open
  const write = backend.put({ id: 'direct', pos: 2 }); // a plain write while it is open
  release();
  await assert.rejects(tx, /forced failure/);
  assert.deepEqual((await read).map((i) => i.id), [], 'the read saw only committed data');
  await write;
  assert.deepEqual((await backend.getAll()).map((i) => i.id), ['direct'], 'the direct write survived the rollback');
});

test('a transaction view cannot be used after the transaction ends', async () => {
  const backend = createMemoryBackend();
  let kept;
  await backend.transact(async (t) => { kept = t; await t.put({ id: 'a', pos: 1 }); });
  await assert.rejects(kept.put({ id: 'late', pos: 2 }), /finished/);
  await assert.rejects(kept.getAll(), /finished/);
  assert.deepEqual((await backend.getAll()).map((i) => i.id), ['a']);
});

test('a paste reads the top position once and keeps order', async () => {
  const backend = createMemoryBackend();
  let reads = 0; const orig = backend.getAll.bind(backend);
  const s = createStore(backend, { now: () => 1, newId: (() => { let n = 0; return () => `id${++n}`; })() });
  await s.add('first');
  const real = backend.transact.bind(backend);
  backend.transact = (fn) => real((tx) => fn({ ...tx, getAll: async () => { reads++; return tx.getAll(); } }));
  const out = await s.addMany(['a', '', 'b', 'c']);
  assert.equal(reads, 1);
  assert.deepEqual(out.map((i) => i.pos), [2, 3, 4]);
});

test('a store refuses a backend without transact', () => {
  assert.throws(() => createStore({ getAll() {}, get() {}, put() {}, delete() {} }), /transact/);
});
