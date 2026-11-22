import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextDue, pickCue, CUE_DAYS } from '../src/cues.js';

const D = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const day = (ms) => { const x = new Date(ms); return [x.getFullYear(), x.getMonth() + 1, x.getDate()]; };

test('schedule days are 1, 3, 7, 14, 30', () => { assert.deepEqual(CUE_DAYS, [1, 3, 7, 14, 30]); });
test('nextDue counts local days from the save day (save day = day 1)', () => {
  const c = D(2026, 1, 10, 23);
  assert.deepEqual(day(nextDue(c, 0)), [2026, 1, 10]); // first show: save day
  assert.deepEqual(day(nextDue(c, 1)), [2026, 1, 12]); // day 3
  assert.deepEqual(day(nextDue(c, 2)), [2026, 1, 16]); // day 7
  assert.deepEqual(day(nextDue(c, 3)), [2026, 1, 23]); // day 14
  assert.deepEqual(day(nextDue(c, 4)), [2026, 2, 8]);  // day 30
});
test('after day 30 it comes back every 30 days', () => {
  const c = D(2026, 1, 10);
  assert.deepEqual(day(nextDue(c, 5)), [2026, 3, 10]);
  assert.deepEqual(day(nextDue(c, 6)), [2026, 4, 9]);
});
test('nextDue is the start of a local day', () => {
  const x = new Date(nextDue(D(2026, 5, 3, 17), 2)); assert.equal(x.getHours(), 0);
});

const cue = (id, pos, o = {}) => ({ id, pos, kind: 'cue', state: 'active', due: 0, shown: 0, ...o });
test('a cue shown today stays all day', () => {
  const now = D(2026, 1, 10, 20);
  const a = cue('a', 1, { due: D(2026, 1, 10, 0), shown: D(2026, 1, 10, 8) });
  const b = cue('b', 2, { due: 0 });
  assert.equal(pickCue([b, a], now).id, 'a');
});
test('else the earliest due cue wins; ties go by pos', () => {
  const now = D(2026, 1, 10);
  assert.equal(pickCue([cue('a', 1, { due: 500 }), cue('b', 2, { due: 100 })], now).id, 'b');
  assert.equal(pickCue([cue('a', 2, { due: 100 }), cue('b', 1, { due: 100 })], now).id, 'b');
});
test('a dropped cue, a task and a cue not yet due are never picked', () => {
  const now = D(2026, 1, 10);
  assert.equal(pickCue([cue('a', 1, { state: 'done' }), { id: 't', pos: 2, state: 'active' }, cue('c', 3, { due: now + 1 })], now), null);
});
test('none when there are no cues', () => { assert.equal(pickCue([], Date.now()), null); });
test('a cue shown yesterday is not kept today', () => {
  const now = D(2026, 1, 11, 9);
  const a = cue('a', 1, { shown: D(2026, 1, 10, 9), due: D(2026, 1, 12, 0) });
  assert.equal(pickCue([a], now), null);
});
