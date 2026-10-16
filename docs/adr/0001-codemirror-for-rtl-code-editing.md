# CodeMirror 6 as the Code Pane engine, not Monaco

The HTML Editor must handle Farsi text inside code correctly for a Farsi-speaking audience, and load only on `/editor`. We chose CodeMirror 6 over Monaco (VS Code's editor) because Monaco has no bidirectional-text support — Farsi runs inside markup render and select incorrectly, and the Monaco team has declined to add RTL — while CodeMirror 6 ships bidi isolation and per-line direction, and is roughly a tenth of Monaco's size. A plain `<textarea>` was rejected because it cannot highlight syntax or auto-close tags, which beginners rely on.

## Consequences

- Any editor feature we add (autocomplete, lint) comes from the CodeMirror ecosystem; Monaco-only features (its full VS Code language services) are off the table.
- Swapping engines later would mean rewriting the Code Pane, its theme and its bidi handling — do not revisit without a Farsi-rendering test suite in hand.
