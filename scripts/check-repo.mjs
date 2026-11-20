// Checks that the required project files exist and that no banned wording is in the docs.
import { existsSync, readFileSync } from 'node:fs';
const required = ['LICENSE', 'README.md', 'MODUS_OPERANDI.md', 'LAYOUT-FREEZE.md',
  'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'docs/DESIGN.md'];
let bad = 0;
for (const f of required) {
  if (!existsSync(f)) { console.error(`MISSING: ${f}`); bad++; }
}
if (!/^MIT License/.test(readFileSync('LICENSE', 'utf8'))) { console.error('LICENSE must be MIT'); bad++; }
const claims = /\b(cures?|treats?|clinically proven|heals?)\b/i;
for (const f of ['README.md', 'docs/DESIGN.md']) {
  readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (claims.test(l) && !/not a treatment|no health claims|tool, not/i.test(l)) {
      console.error(`HEALTH CLAIM? ${f}:${i + 1}: ${l.trim()}`); bad++;
    }
  });
}
if (bad) process.exit(1);
console.log('repo check: ok');
