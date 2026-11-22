# Layout freeze

Many users need the app to stay the same. This file protects that.

## Frozen (do not change without the steps below)
- The position of every button, box and link.
- The default colours and the default theme.
- The default motion setting (off).
- The order of items in a list. The app never re-sorts.
- The text of the main buttons.
- The "What changed" screen: it must appear before any visible change ships.

## Steps for a frozen change
1. Open an issue with the label `nd-review`. Say what moves and why.
2. Publish the change in the release notes **before** it ships.
3. Get at least 1 `nd-review` pass from a neurodivergent reviewer.
4. Offer a setting to keep the old layout for one release.
5. Exception: an urgent accessibility fix may ship at once. Publish the notes the same day and run `nd-review` after. Do not keep an inaccessible layout.

`nd-review` is voluntary. Reviewers need not share a diagnosis. Say only what you saw.

## Not frozen
Bug fixes that change no position, colour or motion. Fresh mode is opt-in. It may change colours and icons, never positions. Its changes also need release notes.

## Baseline
The layout in the v0.2 screenshots (`docs/screens/`) is the frozen baseline: capture box, Now card, Up next, All items, backup row. Settings live in a dialog opened from the top right.
