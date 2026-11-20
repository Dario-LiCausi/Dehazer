# Modus operandi

These rules apply to every change in this repository. They apply to maintainers, contributors and automated tools.

## 1. Purpose rules
1. Dehazer is a tool, not a treatment. Never add a health claim to code, docs, issues or releases.
2. Keep the app small. v0.1 has 5 features (see docs/DESIGN.md). Do not add a sixth without a written reason in an issue.
3. Never add: account login, default push notifications, streaks, overdue counters, cloud AI by default, ads or tracking.

## 2. Privacy rules
1. Data stays on the device. There is no app backend. Static hosting may keep normal web logs; the app sends no user data. Opt-in sync or cloud AI is out of scope until a written design is approved by an issue.
2. Do not commit secrets, personal data, private addresses or real user content. CI checks for common patterns.
3. Use example data only in tests, docs and issues. Do not post real notes, exports or screenshots of your data in public issues.
4. Run a secret scan (for example gitleaks) before each release. CI will add it when app code arrives.

## 3. Change rules
1. Work in a branch. Open a pull request. Do not push to `main` directly.
2. Keep each pull request to one purpose and under about 400 changed lines.
3. Write or update a test for each change in behaviour.
4. CI must pass before merge. The maintainer turns on branch protection with required checks and review on `main`. When app code arrives, CI adds unit tests and an accessibility check (axe) before any app code merges.
5. A change to position, colour or motion follows [LAYOUT-FREEZE.md](LAYOUT-FREEZE.md).
6. One maintainer reviews every pull request. The author does not approve their own.
7. Use small commits with a plain message: what changed and why.

## 4. Accessibility rules
1. Target WCAG 2.2 AA. Use keyboard-only and a screen reader to check every new screen.
2. Contrast at least AA. No pure red. No flashing. Motion is off by default.
3. Text is plain, kind and short. Never write "You missed", "overdue" or "streak".

## 5. Automated and AI-assisted work
1. AI tools may draft code, docs or tests. A human maintainer reads and approves every line before merge.
2. Say in the pull request if a tool wrote more than about half of it.
3. Do not paste private data into any outside tool.
4. A tool may not publish, release or change repository settings. Only a maintainer does.

## 6. Release rules
1. Tag a release only when CI is green and the layout rules are met.
2. Release notes list every visible change before it ships.
3. The lead maintainer approves each public announcement.

## 7. People rules
1. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
2. Ask, do not assume. Many contributors are neurodivergent. Be clear, literal and patient.
3. Give each issue a clear title and one next step.
4. Do not tell anyone how a neurodivergent person "should" work.

## 8. Changing these rules
Open an issue with the label `process`. The lead maintainer decides. Record the change in the pull request.
