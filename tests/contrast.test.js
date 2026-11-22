import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
function block(sel) {
  const i = css.indexOf(sel); assert.ok(i >= 0, `missing ${sel}`);
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum ratio]: 4.5 for text, 3 for UI marks.
const PAIRS = [
  ['fg', 'bg', 4.5], ['muted', 'bg', 4.5], ['fg', 'card', 4.5], ['muted', 'card', 4.5],
  ['accent-fg', 'accent', 4.5], ['accent', 'bg', 3], ['accent', 'card', 3],
  ['focus', 'bg', 3], ['focus', 'card', 3], ['border', 'bg', 3], ['border', 'card', 3],
  // v0.6 card tints: text, muted text and the left edge on each tint.
  ['fg', 'cue-bg', 4.5], ['muted', 'cue-bg', 4.5], ['cue-edge', 'cue-bg', 3],
  ['fg', 'now-bg', 4.5], ['muted', 'now-bg', 4.5], ['now-edge', 'now-bg', 3],
  ['fg', 'next-bg', 4.5], ['muted', 'next-bg', 4.5], ['next-edge', 'next-bg', 3],
  ['accent-fg', 'accent', 4.5], ['accent', 'cue-bg', 3], ['accent', 'now-bg', 3], ['accent', 'next-bg', 3],
  ['focus', 'cue-bg', 3], ['focus', 'now-bg', 3], ['focus', 'next-bg', 3],
  ['border', 'cue-bg', 3], ['border', 'now-bg', 3], ['border', 'next-bg', 3],
];
for (const [name, sel] of [['light', ':root {'], ['dark', ':root[data-theme="dark"] {'],
  ['plain light', ':root[data-look="plain"][data-theme="light"] {'], ['plain dark', ':root[data-look="plain"][data-theme="dark"] {']]) {
  const t = block(sel);
  for (const [f, b, min] of PAIRS) {
    test(`${name}: ${f} on ${b} is at least ${min}`, () => {
      assert.ok(t[f] && t[b], `token missing: ${f} or ${b}`);
      assert.ok(ratio(t[f], t[b]) >= min, `${ratio(t[f], t[b]).toFixed(2)} < ${min}`);
    });
  }
}
