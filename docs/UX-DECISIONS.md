# UX decisions (m3-ui-ux)

One page. What is built, what waits, and why. Date: 2026-11-22. Sources: [RESEARCH.md](RESEARCH.md), a council brief that ranked 9 features with a persona test and a sceptic, and a web-design and contrast audit.

## Built now
| Feature | Why |
|---|---|
| Now card with Done and Not now | One item at a time lowers choice load. The card always shows item 1 of your own order. The app never picks. |
| Edit in place (Enter saves, Esc cancels) | Fix a typo with no new screen. |
| Undo for Done, Not now and Delete (30 s) | Undo beats a confirm box. The council found no source for 10 s, so we use 30 s. |
| Later list with a quiet count, "Back to list" | Moves an item out of sight without blame. The count stops it from hiding. |
| Move up and Move down | You choose the order. Only you change it. Buttons sit under "More" to keep rows calm. |
| Paste a list, get one item per line | Brain dump in one step. Nothing is added until you press Save. Over 100 lines or 2000 characters: nothing is saved and your text stays. |
| Settings: colours, text size, font, backup reminder | You control the look. The app never adapts by itself. |
| What changed, shown once after an update | The "never surprises you" promise. A new user never sees it. |
| Offline copy and install | Needs https or localhost. On plain http it does nothing and the app still works. |

## Where we did not follow the council
- **Move up and down, paste and What changed:** the council said wait. We built them because each is small, tested and under a calm control. Watch them in the tests with real users (M4).
- **Fixed slots for Done rows:** the council wanted a grey "Done" row to stay in place so nothing shifts. We did not build that. The Now card stays in one place and its text changes. An autistic tester must judge this first. It is the biggest open question.
- **Easy-read font:** the one study we found (12 children) showed no gain. We call it a preference, never a fix. Default is the device font.

## Backup reminder
Off by default (opt-in). A reminder can feel like nagging. Export stays one tap away at the bottom.

## Waits (see [BACKLOG.md](../BACKLOG.md))
Paste preview ("Add 12 items?"), axe check in CI, keep-the-old-layout switch, translations, soft time signals.

## Known limits from review
- Data is saved in IndexedDB without one transaction per move. Two tabs at once can clash. One tab is the normal use.
- The preview runs on plain http inside a private VPN. A public copy must use https.
- Export has no size limit but import stops at 20000 items.

## Checks run
- `npm test` (64 tests, including contrast for both themes).
- Browser at 390, 820 and 1280 px, light and dark: no sideways scroll, no console errors.
- Keyboard only: Tab order is Settings, capture, Save, Now card, views, rows.
