// Checks required files, the MIT licence text and banned health-claim wording in all Markdown files.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const required = ['LICENSE', 'README.md', 'MODUS_OPERANDI.md', 'LAYOUT-FREEZE.md',
  'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'docs/DESIGN.md'];
let bad = 0;
for (const f of required) {
  if (!existsSync(f)) { console.error(`MISSING: ${f}`); bad++; }
}
if (existsSync('LICENSE')) {
  const t = readFileSync('LICENSE', 'utf8');
  if (!/^MIT License/.test(t) || !t.includes('THE SOFTWARE IS PROVIDED "AS IS"')) {
    console.error('LICENSE is not the full MIT text'); bad++;
  }
}
function md(dir) {
  return readdirSync(dir).flatMap((n) => {
    if (n === '.git' || n === 'node_modules') return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? md(p) : p.endsWith('.md') ? [p] : [];
  });
}
const claims = /\b(cures?|treats?|clinically proven|heals?)\b/i;
const allow = /not a treatment|no health claims|tool, not|never add a health claim|promise cures/i;
for (const f of md('.')) {
  readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (claims.test(l) && !allow.test(l)) { console.error(`HEALTH CLAIM? ${f}:${i + 1}`); bad++; }
  });
}
if (bad) process.exit(1);
console.log('repo check: ok');
