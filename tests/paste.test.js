import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitLines, MAX_PASTE } from '../src/paste.js';

test('splits lines, trims, drops blanks', () => {
  assert.deepEqual(splitLines('a\n\n  b  \r\nc'), ['a', 'b', 'c']);
});
test('strips list marks', () => {
  assert.deepEqual(splitLines('- a\n* b\n1. c\n2) d\n- [ ] e\n- [x] f'), ['a', 'b', 'c', 'd', 'e', 'f']);
});
test('one line stays one item', () => { assert.deepEqual(splitLines('buy bread'), ['buy bread']); });
test('does not cut the list (caller checks MAX_PASTE)', () => {
  const many = Array.from({ length: MAX_PASTE + 5 }, (_, i) => `i${i}`).join('\n');
  assert.equal(splitLines(many).length, MAX_PASTE + 5);
});
test('empty input gives nothing', () => { assert.deepEqual(splitLines(null), []); });
