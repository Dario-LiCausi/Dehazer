import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MSG } from '../src/messages.js';

test('no shaming words in any message', () => {
  const banned = /\b(missed|overdue|streak|behind|failed|should have)\b/i;
  for (const [k, v] of Object.entries(MSG)) assert.ok(!banned.test(v), `${k}: ${v}`);
});
