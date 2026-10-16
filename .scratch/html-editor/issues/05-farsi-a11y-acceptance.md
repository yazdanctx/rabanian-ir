# 05 — Farsi, accessibility and acceptance verification

Status: ready-for-agent
Spec: ../spec.md (Farsi support — the definition, Acceptance)
Blocked by: 04

## Task

Walk the spec's acceptance list and the five-point Farsi definition on desktop Chrome/Safari and a 390px mobile viewport; record results under `## Comments` here and fix what fails:

1. Chrome strings all Farsi, `dir="rtl"` on page, Persian digits in UI counts, Latin digits in gutter.
2. Bidi behavior in the Code Pane for mixed Farsi/Latin lines (cursor, selection, delete).
3. Preview default direction and font.
4. Keyboard: tabs via arrows, all buttons reachable, focus visible on palette P.
5. Mobile: on-screen keyboard does not hide the tab bar; stacked layout usable.
6. Lighthouse Accessibility 100 on `/editor`; the landing page's JS graph contains no CodeMirror/JetBrains Mono.

## Acceptance

- Every item above passes and is recorded with browser/version.
