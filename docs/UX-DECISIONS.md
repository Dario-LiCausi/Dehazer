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

## Tools shelf (v0.3.0)
- Every tool is off until the user turns it on in Settings. With all tools off, no button, box or link moves; a real-browser check at 390, 820 and 1280 px showed the same boxes as v0.2.0.
- A Tools button appears only when a tool is on. It sits just before Settings, so Settings keeps its place.
- First tool: Show this. A typed message in very large type, for a day when speech is hard. It is never saved: it lives in memory and is cleared when the panel closes. "Their turn" opens an empty box so the other person can type back.
- One tool per release. No sound, no motion, no network.

## Call panel (v0.4.0)
- Second tool on the shelf, off by default. Five visible-label boxes (who, why, my name, my number for a call back, best time) become a short script in large type, plus a list for the end of the call: say the next step back, ask for it in writing, ask for a name.
- "Ask them to go slowly" is a tick box, off by default. Nothing is assumed about the user. "Ask for it in writing" is on by default because a written copy is the point of the tool.
- Nothing is saved. The boxes live on the page and are cleared when the panel closes. No speech output, no sound, no network.

## Doctor sheet (v0.5.0)
- Third tool on the shelf, off by default. Four boxes (why I am here, the main thing, what helps me in the room, up to 5 questions) become a one-page sheet. Empty boxes leave no heading. A tick box, on by default, adds "Tell me the next step in writing before I leave."
- The sheet gives no advice and makes no health claim. It only repeats what the user typed.
- Print uses the browser's own print, so the text stays selectable. The print view shows the sheet only.
- Nothing is saved. Boxes are cleared when the sheet closes. Nothing is sent anywhere.

## Waits (see [BACKLOG.md](../BACKLOG.md))
Paste preview ("Add 12 items?"), axe check in CI, keep-the-old-layout switch, translations, soft time signals.

## Known limits from review
- Every change that reads and then writes (add, edit, move, restore, paste, import) runs inside one IndexedDB transaction. Two tabs at once cannot pick the same position, and a failed paste or import keeps nothing. Checked in a real browser with two connections: 30 of 30 and 40 of 40 positions were unique (the old code gave 15 of 30). A text with line breaks and a plain file import without ids can still produce a duplicate if you import the same file twice.
- The preview runs on plain http inside a private VPN. A public copy must use https.
- Export has no size limit but import stops at 20000 items.

## Checks run
- `npm test` (90 tests, including contrast for both themes).
- Browser at 390, 820 and 1280 px, light and dark: no sideways scroll, no console errors.
- Keyboard only: Tab order is Settings, capture, Save, Now card, views, rows.
