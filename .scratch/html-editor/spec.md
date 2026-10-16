# HTML Editor (ویرایشگر HTML) — the one Free Tool

Status: ready-for-agent
Decided: 2026-10-16 (grilling session). Vocabulary: `GLOSSARY.md`. Engine choice: `docs/adr/0001-codemirror-for-rtl-code-editing.md`.
Depends on: `.scratch/landing-page/spec.md` (stack, palette, fonts, motion rules all apply here).

## Goal

A very minimal page at `/editor` where a Farsi-speaking beginner writes HTML, CSS and JS and sees the page render live — for practice. The UI is Farsi and RTL; the Code Pane and the Preview handle Farsi text correctly. No accounts, no server.

## Page

- Route `/editor` inside the same Astro site; linked from the Toolbox row «ویرایشگر HTML · فعال · ورود ←».
- Farsi `<title>`: «ویرایشگر HTML — rabanian.ir». Same top bar as the landing page (logo home link, Telegram icon).
- The editor app is one React island, `client:only="react"` (CodeMirror has no SSR value). Nothing from it loads on the landing page.

## Layout

- Three **tabs** over a single Code Pane: `HTML` · `CSS` · `JS` (labels stay Latin — they are the languages' names). Active tab remembered within the session.
- Preview beside the Code Pane on ≥ 1024px (two columns, Code Pane on the right since the page is RTL, draggable divider not required); stacked below it on narrower screens.
- Action bar: «اجرا» (run now), «بازنشانی» (reset to Starter Template, with confirm), «دانلود» (download a single `index.html` with CSS inlined in `<style>` and JS in `<script>`). Nothing else — no file tree, no settings, no themes, no share.
- Console strip under the Preview, collapsible, Farsi label «کنسول»: lists `console.log/info/warn/error` output and uncaught errors from the Preview, newest last, with a clear button. Messages themselves are shown verbatim (they come from the browser).
- Palette P, surface chrome, 12px radius, hairline borders — same tokens as the landing page.

## Code Pane (CodeMirror 6)

- Extensions: `@codemirror/lang-html`, `lang-css`, `lang-javascript`; line numbers (Latin digits); bracket matching; auto-close tags/brackets; history; 2-space indent; line wrapping on. Search panel, lint gutter, fold gutter and command palette **disabled**.
- Direction: the Code Pane is **LTR** — code is LTR everywhere. Farsi runs inside the code are bidi-isolated (`EditorView.bidiIsolatedRanges` / `bidiIsolate` on string and text content, `perLineTextDirection`) so cursor movement and selection over `<h1>سلام دنیا</h1>` behave correctly.
- Font: JetBrains Mono (self-hosted, 400 + 700, woff2, loaded only on this route) with `IRANYekanXFaNum` as the fallback so Farsi glyphs inside code render in Yekan. Size 14px, line-height 1.7.
- Light theme built from palette P tokens (tags `#0D5BE0`, attributes `#536078`, strings `#1237C8`, comments `#536078` italic, selection `#EAF1FF`). No dark theme.
- Mobile: the pane is usable with the on-screen keyboard; tab bar stays above the keyboard.

## Preview

- Sandboxed `<iframe sandbox="allow-scripts" srcdoc="…">` — no `allow-same-origin`, no network access needed. Rebuilt on a ~300ms debounce after typing and immediately on «اجرا».
- The document is assembled as `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><style>{preloaded IRANYekanXFaNum @font-face + body{font-family}}</style><style>{CSS}</style><script>{console bridge}</script></head><body>{HTML}<script>{JS}</script></body></html>`. The bridge sits in `<head>` so it also hears `<script>`s typed in the HTML tab and errors thrown while the page loads; the downloaded `index.html` has no bridge. Any `</style` in the CSS and `</script` in the JS (any case) is written `<\/style` / `<\/script`, so a string holding it can't end the element early.
- **RTL and Farsi by default**: a learner's first `<h1>سلام</h1>` looks right without knowing about `dir`. The learner edits body content only (the `<html>`/`<head>` wrapper is ours) and can override direction with `dir="ltr"` on their own elements or `html { direction: ltr }` in CSS. This default is deliberate and documented in the Starter Template comments.
- Console bridge: the iframe patches `console.*` and `window.onerror`/`unhandledrejection` and posts messages to the parent via `postMessage`; the parent validates `event.source === iframe.contentWindow` before rendering.

## Starter Template (قالب شروع)

Three short files with Farsi comments explaining each:
- `HTML`: a heading «سلام دنیا», a paragraph, a button with `id`, comments on where to write and that the page is RTL by default.
- `CSS`: body spacing/colors on palette P, the button style, a comment naming the selector.
- `JS`: a click handler on the button that changes the heading text and a `console.log('سلام از جاوااسکریپت')`, with comments.

The Template is what the editor opens with on first visit and what «بازنشانی» restores.

## Persistence

- The three files autosave to `localStorage` (key `rabanian.editor.v1`, debounced), restored on reload. Reset clears to the Starter Template.
- No accounts, no server, no shareable links (compressed-hash sharing is an explicit v2 candidate, not built now).

## Farsi support — the definition

1. All chrome in Farsi, `dir="rtl"`, IRANYekanXFaNum, Persian digits in UI text.
2. Code Pane LTR with correct bidi behavior for Farsi inside code (cursor, selection, rendering).
3. Preview defaults to `lang="fa" dir="rtl"` with IRANYekan available.
4. Latin digits in line numbers; Persian digits in UI counts.
5. Farsi Starter Template and Farsi-labelled console.

## Motion

Tab switch: 150ms crossfade of pane content. Console strip expand/collapse: height spring (`motion`), 200ms. Nothing else; all off under reduced motion.

## Out of scope

Monaco · dark theme · multiple files/projects · sharing · login · linting/autocomplete beyond tag auto-close · external library imports (CDN scripts are allowed if the learner types them — `allow-scripts` permits it) · mobile-specific layout beyond stacking.

## Acceptance

- Typing `<h1>سلام دنیا</h1>` in HTML renders an RTL Farsi heading in the Preview within 300ms; cursor and selection across the Farsi run behave correctly in the Code Pane.
- `console.log` and a thrown error both appear in the console strip; the parent ignores messages from other windows.
- Reload restores the three files; «بازنشانی» restores the Starter Template; «دانلود» yields a single working `index.html`.
- The landing page bundle contains none of CodeMirror or JetBrains Mono.
- Lighthouse Accessibility 100 on `/editor`; all controls reachable by keyboard; tab bar uses proper `role="tablist"`.
