// Static accessibility checks on index.html. No dependencies. This is not a full axe run;
// it guards the basics: language, names, labels, unique ids, dialogs, headings, tab order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const tags = (name) => [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, 'gi'))]
  .map((m) => ({ attrs: m[1], inner: m[2].replace(/<[^>]+>/g, '').trim() }));
const attr = (attrs, n) => (attrs.match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1];
const hasAttr = (attrs, n) => new RegExp(`\\b${n}\\b`).test(attrs);

test('page has a language and a title', () => {
  assert.match(html, /<html[^>]*\blang="[a-z]{2}/);
  assert.match(html, /<title>[^<]+<\/title>/);
});

test('page can zoom (no user-scalable=no, no maximum-scale)', () => {
  const vp = html.match(/<meta name="viewport"[^>]*>/)[0];
  assert.doesNotMatch(vp, /user-scalable\s*=\s*no|maximum-scale/);
});

test('ids are unique', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  assert.deepEqual(dup, []);
});

test('every button has a name (text, aria-label or filled in by script)', () => {
  for (const b of tags('button')) {
    const named = b.inner || attr(b.attrs, 'aria-label') || hasAttr(b.attrs, 'data-icon');
    assert.ok(named, `unnamed button: ${b.attrs}`);
  }
});

test('every text box, text area and checkbox has a label', () => {
  const labelFor = new Set([...html.matchAll(/<label[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]));
  const wrapped = [...html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].map((m) => m[1]);
  for (const m of html.matchAll(/<(input|textarea)\b([^>]*)>/g)) {
    const a = m[2];
    if (/type="(hidden|submit|button)"/.test(a)) continue;
    const id = attr(a, 'id');
    const ok = attr(a, 'aria-label') || attr(a, 'aria-labelledby') || (id && labelFor.has(id))
      || wrapped.some((w) => w.includes(m[0]));
    assert.ok(ok, `no label: ${m[0]}`);
  }
});

test('every dialog has an accessible name', () => {
  for (const m of html.matchAll(/<dialog\b([^>]*)>/g)) {
    const lab = attr(m[1], 'aria-labelledby');
    assert.ok(lab || attr(m[1], 'aria-label'), `unnamed dialog: ${m[1]}`);
    if (lab) assert.ok(html.includes(`id="${lab}"`), `aria-labelledby target missing: ${lab}`);
  }
});

test('aria references point at real ids', () => {
  for (const m of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of m[1].split(/\s+/)) assert.ok(html.includes(`id="${id}"`), `missing id: ${id}`);
  }
});

test('there is exactly one h1 and no heading level is skipped inside main', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  let last = 1;
  for (const m of main.matchAll(/<h([1-6])\b/g)) {
    const n = Number(m[1]);
    assert.ok(n <= last + 1, `heading jumps from h${last} to h${n}`);
    last = n;
  }
});

test('no positive tabindex, no click handlers on plain div or span', () => {
  assert.doesNotMatch(html, /tabindex="[1-9]/);
  assert.doesNotMatch(html, /<(div|span)\b[^>]*\bonclick=/);
});

test('live regions exist for status messages', () => {
  assert.match(html, /id="status"[^>]*aria-live="polite"|role="status"/);
});

test('images have alt text', () => {
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) assert.ok(/\balt=/.test(m[1]), `img without alt: ${m[1]}`);
});
