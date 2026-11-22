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

## What we do not know yet
- No autistic or ADHD adult has tested this build. M4 in [DESIGN.md](DESIGN.md) will.
- We have not tested with a screen reader on every system.

Found a barrier? Open an issue with the label `nd-review`.
