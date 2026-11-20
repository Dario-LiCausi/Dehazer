# Dehazer: design (v0.1 draft)
Status: draft. Nothing is built yet.


## 1. What Dehazer is
A free, open-source, local-first web app (PWA) for ADHD and autistic adults. It helps them **capture** a thought, **remember** it and **act** on it.
Three promises:
1. No account, no server, no tracking. Data stays on the device.
2. Nothing moves, flashes or shames. The layout is the same every day.
3. Your data is always yours: one tap exports plain Markdown.
Dehazer is a tool, not a treatment. It makes no health claims.

## 2. Who it is for
- **Sam (ADHD):** forgets what is out of sight. Needs the app to come to them. Likes novelty. Drops apps that make them feel guilty.
- **Alex (autistic):** needs a stable layout and a fixed order. Leaves if a button moves, if motion or colour appears, or if an account is forced.
- Both: hit overwhelm and decision fatigue when a list is long or setup is heavy.
The two groups clash on novelty. Answer: **Stable mode is the default. Fresh mode changes only colours and icons, never positions** (section 6).

## 3. Goals and non-goals
Goals:
- Capture in 1 step. First useful screen in under 30 seconds, no setup.
- Show at most 5 things at once.
- Work offline. Survive browser storage loss with visible export.
- Be easy for strangers to join: small code, clear rules, non-code ways to help (ND review, translation, docs).
Non-goals (never): account login, default push notifications, streaks or overdue counters, cloud AI by default, ads, tracking, medical claims.

## 4. MVP (5 features, no more)
| # | Feature | Rule |
|---|---|---|
| 1 | Quick capture box | One text box, always on top. Enter saves. No required fields. |
| 2 | Fixed-order list | Items sit in the order added. The app never re-sorts. |
| 3 | "Next 5" view | Max 5 items. One is marked "now". Others fade without blame. |
| 4 | Offline local save | IndexedDB, service worker, installable. |
| 5 | Markdown export and import | Plain `.md`. Visible on the main screen. Weekly "back up now" note. |
Later (not in v0.1): opt-in quiet reminders (also as `.ics` file), keyboard command bar, Fresh themes, sync between own devices, time-left bar, body doubling (research first).

## 5. Screens (max 3 actions each)
1. **Home:** capture box, "Next 5", a small "Export" link.
2. **List:** all items in fixed order. Actions: mark done, move to later, delete (undo for 10 s).
3. **Settings:** Stable/Fresh, theme (light/dark/system), dyslexia font, motion (off default), back-up reminder.
One column. Same place for everything. No hidden menus. No badges. No counts of unfinished items.

## 6. Look and feel
- **Colour:** low saturation, no pure red, contrast WCAG AA at least. Light and dark follow the system.
- **Type:** system font, line height 1.6, base 18 px, optional dyslexia-friendly font. Text scales with the browser setting.
- **Motion:** off by default; follows `prefers-reduced-motion`. No animation that moves layout.
- **Stable mode (default):** colours fixed. **Fresh mode:** colour theme and icon set rotate weekly. Layout code is identical in both modes (one code path).
- **Tone:** plain, kind, short. Examples: "Saved." "Moved to later." Never "You missed", "overdue", "streak".
- **Notifications:** none in v0.1.
- Design tokens live in one CSS file so contributors change colours without touching logic.

## 7. Architecture
- Plain HTML, CSS and JS (ES modules). No framework in v0.1.
- Storage: IndexedDB through one small module (`store.js`). Ask for persistent storage (`navigator.storage.persist()`) (not all browsers grant it).
- Service worker caches the app shell. Web manifest for install.
- Static hosting only (GitHub Pages). Anyone can fork and host.
- Markdown format: one item per line, `- [ ] text` and `- [x] text`, optional `<!-- id -->`. Import must round-trip export.
- Tauri desktop later.
Repo layout:
```
dehazer/
  index.html  manifest.webmanifest  sw.js
  src/ store.js  ui.js  markdown.js  themes.css  app.css
  tests/ store.test.js  markdown.test.js  a11y.test.js
  docs/ DESIGN.md  ACCESSIBILITY.md  LAYOUT-FREEZE.md
  LICENSE (MIT)  README.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md
  .github/ ISSUE_TEMPLATE/  workflows/ci.yml
```

## 8. Data model
`Item { id, text, state: "active" | "later" | "done", created, updated }`. Order = creation order, stored as an integer `pos` that only the user changes. "Now" = a single flag on one active item. No due dates in v0.1.

## 9. Accessibility
Target WCAG 2.2 AA. Full keyboard use. Visible focus. Labels for screen readers. Automatic check with axe in CI. ND volunteers test each release (label `nd-review`).

## 10. Open-source plan
- Licence MIT. README in plain words with a "What it is not" box: not a treatment, not a cloud service.
- `LAYOUT-FREEZE.md`: no change to positions, colours or motion without release notes shown before the change and an `nd-review` pass.
- Labels: `good first issue`, `nd-review`, `design`, `docs`, `translation`.
- CI from day one: lint, unit tests, axe check.
- Governance: the project lead leads design and ND review. **Find one co-maintainer who codes before inviting many contributors**.
- Channels after v0.1 works: Show HN, ND communities (listen first, no spam), GitHub topics, awesome lists.

## 11. Milestones (part-time, all effort figures are guesses)
| Step | Output | Gate |
|---|---|---|
| M0 | Name check, repo scaffold, licence, CI | Lead OK before first push |
| M1 | Capture + list + local save | Tests pass |
| M2 | Next 5 + Markdown export/import | Round-trip test |
| M3 | Stable/Fresh + a11y pass | axe clean |
| M4 | Prototype test: 5 ND adults (2+ autistic), 14 days | Count who still opens it on day 14 |
| M5 | Public v0.1 + announce | Lead OK |

