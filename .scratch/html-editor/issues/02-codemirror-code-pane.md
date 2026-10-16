# 02 — Code Pane on CodeMirror 6 with Farsi bidi support

Status: ready-for-agent
Spec: ../spec.md (Code Pane); ADR-0001
Blocked by: 01

## Task

- `CodePane.tsx` mounting `EditorView` once per instance; controlled value via `EditorView.updateListener` → parent state; language switched by `Compartment` (`@codemirror/lang-html`, `lang-css`, `lang-javascript`).
- Extensions: line numbers (Latin digits), bracket matching, `closeBrackets`, `autoCloseTags` for HTML, history, `indentUnit` 2, `EditorView.lineWrapping`, `keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])`. **Not** included: search keymap/panel, lint gutter, fold gutter.
- Direction: the view is LTR. Add `EditorView.perLineTextDirection.of(true)` and the `bidiIsolates` extension (`@codemirror/language`'s `bidiIsolates()`) so Farsi runs inside tags/strings are isolated; verify cursor/selection across `<h1>سلام دنیا</h1>`.
- Light theme from palette P: tags `#0D5BE0`, attribute names `#536078`, strings `#1237C8`, comments `#536078` italic, selection `#EAF1FF`, active line `#F5F7FA`, gutter `#536078` on white; font 14px / 1.7.

## Acceptance

- Typing in each tab highlights correctly; auto-close works; no search panel on Ctrl/Cmd-F (browser default allowed).
- Farsi inside markup renders in Yekan glyphs, caret moves logically through the run, selection highlights are contiguous.
