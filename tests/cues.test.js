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

import { effectivePause, cuesPaused } from '../src/cues.js';
test('pause: off and unknown modes are never paused', () => {
  assert.equal(effectivePause('off', 0, D(2026, 1, 10)), 'off');
  assert.equal(effectivePause('nope', D(2026, 1, 1), D(2026, 1, 2)), 'off');
  assert.equal(cuesPaused('off', 0, D(2026, 1, 10)), false);
});
test('pause: one week is a full week from the moment it was chosen', () => {
  const since = D(2026, 1, 10, 23);
  assert.equal(effectivePause('week', since, D(2026, 1, 17, 22)), 'week'); // 6 days 23 hours later
  assert.equal(effectivePause('week', since, D(2026, 1, 17, 23)), 'off');  // exactly 7 days later
});
test('pause: one month is 30 calendar days', () => {
  const since = D(2026, 1, 10, 8);
  assert.equal(effectivePause('month', since, D(2026, 2, 9, 7)), 'month');
  assert.equal(effectivePause('month', since, D(2026, 2, 9, 8)), 'off');
});
test('pause: across a clock change the week still ends at the same clock time', () => {
  const since = new Date(2026, 2, 24, 9, 0).getTime(); // UK clocks go forward on 29 March 2026
  assert.equal(effectivePause('week', since, new Date(2026, 2, 31, 8, 59).getTime()), 'week');
  assert.equal(effectivePause('week', since, new Date(2026, 2, 31, 9, 0).getTime()), 'off');
});
test('pause: a start time more than a day in the future is wrong, so it is not paused', () => {
  const now = D(2026, 1, 10, 12);
  assert.equal(effectivePause('week', now + 30 * 86400000, now), 'off');
  assert.equal(effectivePause('week', now + 3600000, now), 'week'); // a small clock step back is fine
});
test('pause: until I turn it back on never ends', () => {
  assert.equal(effectivePause('until', 0, D(2030, 1, 1)), 'until');
  assert.equal(cuesPaused('until', 0, D(2030, 1, 1)), true);
});
test('pause: a timed pause with no start time is not paused', () => {
  assert.equal(effectivePause('week', 0, D(2026, 1, 10)), 'off');
});

import { applyPauseChoice } from '../src/cues.js';
test('choice: picking a pause starts it now; picking off clears it', () => {
  const now = D(2026, 1, 10, 12);
  assert.deepEqual(applyPauseChoice({ cuesPause: 'off', cuesPauseAt: 0 }, 'week', now), { cuesPause: 'week', cuesPauseAt: now });
  assert.deepEqual(applyPauseChoice({ cuesPause: 'week', cuesPauseAt: now - 1000 }, 'off', now), { cuesPause: 'off', cuesPauseAt: 0 });
});
test('choice: picking what is already in force keeps the start time', () => {
  const now = D(2026, 1, 10, 12), at = now - 3 * 86400000;
  assert.deepEqual(applyPauseChoice({ cuesPause: 'week', cuesPauseAt: at }, 'week', now), { cuesPause: 'week', cuesPauseAt: at });
  assert.deepEqual(applyPauseChoice({ cuesPause: 'until', cuesPauseAt: at }, 'until', now), { cuesPause: 'until', cuesPauseAt: at });
});
test('choice: a stale radio after the pause ended starts a fresh pause only when the user picks it', () => {
  const now = D(2026, 1, 20, 12), old = D(2026, 1, 1, 12);
  assert.deepEqual(applyPauseChoice({ cuesPause: 'week', cuesPauseAt: old }, 'off', now), { cuesPause: 'week', cuesPauseAt: old }); // already off in effect: nothing changes
  assert.deepEqual(applyPauseChoice({ cuesPause: 'week', cuesPauseAt: old }, 'month', now), { cuesPause: 'month', cuesPauseAt: now });
});
test('choice: a bad value means off', () => {
  assert.deepEqual(applyPauseChoice({ cuesPause: 'until', cuesPauseAt: 5 }, 'forever', D(2026, 1, 1)), { cuesPause: 'off', cuesPauseAt: 0 });
});
