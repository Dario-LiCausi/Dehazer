# Access notes

Plain words. What Dehazer does today, and how we check it.

## What you get
- **No motion.** Nothing slides, fades or flashes. This is always on. It is not a setting.
- **Same places every day.** Capture box on top, then the Now card, then Up next, then your list, then Export and Import.
- **Your order.** The app never sorts. Only you move an item, with Move up and Move down.
- **Big buttons.** Every button is at least 44 by 44 CSS pixels.
- **Visible focus.** A thick blue ring shows where the keyboard is.
- **Colours.** Light and dark. "Same as my device" is the default. You can force either.
- **Text size.** Normal, Large and Larger (115% and 130%).
- **Easy-read font.** Atkinson Hyperlegible, saved inside the app. No font is loaded from the internet.
- **Keyboard only works.** Tab moves forward. Enter saves. Esc cancels an edit. Shift+Enter makes a new line in the capture box.
- **Screen readers.** Status messages ("Saved.", "Moved to later.") are read out. The Undo button is inside that message.
- **No blame words.** A test fails the build if a message holds "missed", "overdue", "streak", "behind" or "failed".

## How we check
- `npm test` runs a contrast test with the WCAG formula. Text needs 4.5 to 1. Borders, focus ring and accent need 3 to 1. Both themes.
- We test by hand at 390, 820 and 1280 px wide, and with the keyboard only.
- No automated axe run yet. It is on the [backlog](../BACKLOG.md).

## Tools shelf
- Tool panels are native dialogs: Esc closes, focus moves into the panel and returns to the Tools button.
- Show this uses a visible label, large type that wraps (no sideways scroll at 390 px, Larger text size, dark mode) and no motion.
- Call panel: every box has a visible label; focus goes to the script when it appears and returns to the Tools button on close.
- Doctor sheet: visible labels on every box, focus moves to the sheet and back to the Tools button, selectable text, plain print view.
- Tools are off by default, so people who do not want them never see them.

## What we do not know yet
- No autistic or ADHD adult has tested this build. M4 in [DESIGN.md](DESIGN.md) will.
- We have not tested with a screen reader on every system.

Found a barrier? Open an issue with the label `nd-review`.

## v0.6 additions
- The Task / Cue switch is a group labelled "Kind". Each button uses `aria-pressed`. The Save button text follows the choice ("Save task", "Save cue").
- The Cue card is a section with the heading "Remember". Its Drop button has a visible label. The undo link sits in the status line, which is a polite live region.
- Icons and the mascot are `aria-hidden` and sit beside text. Colour is never the only signal: each coloured card has its own heading.
- Contrast: every card tint holds 4.5:1 for text and muted text, and 3:1 for the left edge, in light, dark and Plain (tests/contrast.test.js).
- The Plain look hides all icons and the mascot.
- Header wraps at Larger text size on a 390 px screen. No sideways scroll.
