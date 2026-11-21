# Dehazer

A free, open-source, local-first web app that helps ADHD and autistic adults **capture** a thought, **remember** it and **act** on it.

**Status: early. Design only. No app yet.** See [docs/DESIGN.md](docs/DESIGN.md).

## Three promises
1. No account, no app backend, no tracking. Your data stays on your device.
2. Nothing moves, flashes or shames. The layout is the same every day.
3. Your data is yours. One tap exports plain Markdown.

## What it is not
- Not a treatment. It makes no health claims.
- Not a cloud service.
- Not a place for streaks, overdue counters or guilt.

## How the project works
- Rules for everyone: [MODUS_OPERANDI.md](MODUS_OPERANDI.md)
- How to help (code and non-code): [CONTRIBUTING.md](CONTRIBUTING.md)
- Layout and motion rules: [LAYOUT-FREEZE.md](LAYOUT-FREEZE.md)
- Research behind the design: [docs/RESEARCH.md](docs/RESEARCH.md)

## Licence
MIT. See [LICENSE](LICENSE).

## Export and import format
Export writes plain Markdown, one item per line:

    - [ ] buy bread <!-- id -->
    - [ ] call back <!-- id later -->
    - [x] book dentist <!-- id -->

The first lines hold `<!-- dehazer-export v1 -->`. Import reads ids only from files that carry it, so importing the same backup twice adds nothing. Any other Markdown checklist imports as new items. Line breaks in an item become spaces.
