# HTML Editor (ویرایشگر HTML) — the one Free Tool

Status: ready-for-human
Decided: 2026-10-16 (grilling session). Vocabulary: `GLOSSARY.md`. Engine choice: `docs/adr/0001-codemirror-for-rtl-code-editing.md`.
Depends on: `.scratch/landing-page/spec.md` (stack, palette, fonts, motion rules all apply here).

## Goal

A very minimal page at `/editor` where a Farsi-speaking beginner writes HTML, CSS and JS and sees the page render live — for practice. The UI is Farsi and RTL; the Code Pane and the Preview handle Farsi text correctly. No accounts, no server.

## Page

- Route `/editor` inside the same Astro site; linked from the Toolbox row «ویرایشگر HTML · فعال · ورود ←».
- Farsi `<title>`: «ویرایشگر HTML — rabanian.ir». No top bar: the editor is the whole page (decided 2026-10-17).
- The editor app is one React island, `client:only="react"` (CodeMirror has no SSR value). Nothing from it loads on the landing page.

## Layout

- Three **tabs** over a single Code Pane: `HTML` · `CSS` · `JS` (labels stay Latin — they are the languages' names). The editor always opens on the `HTML` tab; the open tab isn't saved.
- **Full screen**: the editor fills the viewport exactly and the page never scrolls; only the Code Pane, the Preview and the console log scroll, each inside itself. The viewport meta adds `interactive-widget=resizes-content` so an on-screen keyboard shrinks the layout and the tab bar stays above it.
- Preview beside the Code Pane on ≥ 1024px (Code Pane on the right, Preview on the left); stacked below 1024px with the **Preview on top and the Code Pane below**. Panes run edge to edge.
- **Resizable**: a separator between the two panes (`react-resizable-panels`, the library behind shadcn's Resizable, styled in the editor's plain CSS) resizes them by drag or arrow keys; each pane keeps at least 20%. The sizes are saved per arrangement (side by side / stacked) in `localStorage` (`react-resizable-panels:rabanian.editor.layout.horizontal` / `.vertical`), only when the visitor resizes. The group runs left to right with the Preview first (the library has no RTL), so the Tab order is Preview column, separator, Code Pane.
- Action bar, in this order so «اجرای کد» sits at the far left: «بازنشانی» (empty all three files and go back to the `HTML` tab, after an in-page modal dialog — «بازنشانی ویرایشگر؟», «انصراف» focused, «بازنشانی» in the error red; Escape or a click outside declines — not the browser's `confirm()`), «دانلود index.html» (download a single `index.html` with CSS inlined in `<style>` and JS in `<script>`), «تمام‌صفحه پیش‌نمایش» (the Preview over the whole screen), «اجرای کد» (run now, primary). Each has a small decorative line icon (reset arrow, download arrow, four corners, play). Nothing else — no file tree, no settings, no themes, no share.
- **Names from Amin's original tool** (decided 2026-10-17): the editor replaces his single-file «ابزار اجرای HTML», and his course videos tell Learners which buttons to press by name. So «اجرای کد», «دانلود index.html», «تمام‌صفحه پیش‌نمایش», «خروج از تمام‌صفحه» and the status messages use that tool's exact words. Don't rename them without re-recording the videos.
- Where the Preview pane is too narrow for the four buttons beside «پیش‌نمایش» (< 620px), the title is hidden visually but stays the region's name. Below 540px the buttons go two to a row, and below 372px one to a row. The two head bars then no longer line up.
- **Full screen** («تمام‌صفحه پیش‌نمایش»): the Preview pane (its bar and frame) is laid `position: fixed` over the whole editor. The frame isn't moved or reloaded, so the page keeps its state. The bar then holds only «✕ خروج از تمام‌صفحه», which takes focus. It or Escape restores the editor, and focus returns to «تمام‌صفحه پیش‌نمایش». Everything under the overlay is `inert`. This is CSS, not the browser Fullscreen API, as in the original.
- **Status message** after an action, using the original tool's words: «کد با موفقیت اجرا شد.», «فایل index.html با موفقیت دانلود شد.», and «لطفاً ابتدا کد HTML را وارد کنید.» (error red) when «اجرای کد» or «دانلود index.html» is pressed with an empty HTML tab, which then runs or downloads nothing. The message is a small card at the foot of the Preview with a check or alert icon, in a polite `role="status"` live region. It goes after 4s or as soon as the files change, and lets clicks through to the page under it.
- Console strip under the Preview, collapsible, Farsi label «کنسول»: lists `console.log/info/warn/error` output and uncaught errors from the Preview, newest last, with a clear button. Messages themselves are shown verbatim (they come from the browser).
- Palette (landing spec, Iris): the head bars (tabs; Preview title + actions) and the console strip on `surface`, panes on white, hairline `line` borders; buttons and tabs keep the 8px radius.

## Code Pane (CodeMirror 6)

- Extensions: `@codemirror/lang-html`, `lang-css`, `lang-javascript`; line numbers (Latin digits); bracket matching; auto-close tags/brackets; history; 2-space indent; line wrapping on. Search panel, lint gutter, fold gutter and command palette **disabled**.
- Direction: the Code Pane is **LTR** — code is LTR everywhere. Farsi runs inside the code are bidi-isolated (`EditorView.bidiIsolatedRanges` / `bidiIsolate` on string and text content, `perLineTextDirection`) so cursor movement and selection over `<h1>سلام دنیا</h1>` behave correctly.
- Font: JetBrains Mono (self-hosted, 400 + 700, woff2, loaded only on this route) with `IRANYekanXFaNum` as the fallback so Farsi glyphs inside code render in Yekan. Size 14px, line-height 1.7. Ligatures off: a beginner sees `=>` and `<!--` as typed, not as arrows.
- Light theme with full syntax highlighting in a GitHub-light style palette, as `--color-code-*` tokens (all AA on white, surface and the selection): keywords `#CF222E` (incl. CSS at-rules and `!important`), tag names `#116329`, attribute and property names `#0550AE`, strings and attribute values `#0A3069`, numbers/literals/units/colours/entities `#0550AE`, function names, calls and class/id selectors `#6F42C1`, new variable names `#953800`; comments, angle brackets and doctype `muted`, not italic (slanted Farsi reads poorly); plain names and operators `ink`. Selection `#EAF1FF`. No dark theme.
- Mobile: the pane is usable with the on-screen keyboard; tab bar stays above the keyboard.
- An empty file shows the original tool's hint, «کد HTML خود را اینجا قرار دهید...» (CSS and JS name their own file). It is set right to left inside the LTR line and is also the content's `aria-placeholder`.
- **A Full Page pasted into the HTML tab replaces the whole file**, wherever the caret was. The videos say to paste the page into the box, and a returning visitor's box still holds their last code. One undo brings the old file back. Any other paste lands at the caret as usual.

## Preview

- `<iframe srcdoc="…">` with **no `sandbox`**, as in the original tool (ADR-0004, decided 2026-10-17). Pasted pages need storage, forms, `alert()`, popups and embedded videos, and a sandbox blocks them. Rebuilt on a ~300ms debounce after typing and immediately on «اجرای کد». The rebuild delay (250ms) must stay below the autosave delay (500ms), so an edit that freezes the tab with an endless loop is never saved.
- The document is assembled as `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><style>{preloaded IRANYekanXFaNum @font-face + body{font-family}}</style><style>{CSS}</style><script>{console bridge}</script></head><body>{HTML}<script>{JS}</script></body></html>`. The bridge sits in `<head>` so it also hears `<script>`s typed in the HTML tab and errors thrown while the page loads; the downloaded `index.html` has no bridge. Any `</style` in the CSS and `</script` in the JS (any case) is written `<\/style` / `<\/script`, so a string holding it can't end the element early.
- **Full Page**: when the HTML tab opens (after any comments) with `<!DOCTYPE …>` or `<html>`, it is a whole page, which is what an AI or a tutorial hands over. It runs as it is, as in the original tool: none of our wrapper, base style or fonts, and **not the CSS and JS tabs** (what is left in them was written for other HTML). Only the console bridge goes in, right after `<head>` (else after `<html>`, else after the doctype). «دانلود index.html» saves it byte for byte.
- **RTL and Farsi by default**: a learner's first `<h1>سلام</h1>` looks right without knowing about `dir`. The learner edits body content only (the `<html>`/`<head>` wrapper is ours) and can override direction with `dir="ltr"` on their own elements or `html { direction: ltr }` in CSS. This default is deliberate.
- Console bridge: the iframe patches `console.*` and `window.onerror`/`unhandledrejection` and posts messages to the parent via `postMessage`; the parent validates `event.source === iframe.contentWindow` before rendering.

## Empty start

The editor opens with all three files empty, as Amin's original tool did, and shows each empty file's hint in the Code Pane. «بازنشانی» returns to that state. (Decided 2026-10-17. This replaces the Starter Template, a short commented Farsi example page, which was removed.)

## Persistence

- The three files autosave to `localStorage` (key `rabanian.editor.v1`, debounced), restored on reload. Reset empties them and forgets the save. The save holds only the three files (`{ html, css, js }`); earlier saves also held the open tab, which is now ignored. The pane sizes are saved too (see Layout → Resizable).
- No accounts, no server, no shareable links (compressed-hash sharing is an explicit v2 candidate, not built now).

## Farsi support — the definition

1. All chrome in Farsi, `dir="rtl"`, IRANYekanXFaNum, Persian digits in UI text.
2. Code Pane LTR with correct bidi behavior for Farsi inside code (cursor, selection, rendering).
3. Preview defaults to `lang="fa" dir="rtl"` with IRANYekan available.
4. Latin digits in line numbers; Persian digits in UI counts.
5. Farsi-labelled console.

## Motion

Tab switch: 150ms crossfade of pane content. Console strip expand/collapse: height spring (`motion`), 200ms. Reset dialog: 160ms fade and scale from 0.96 in, backdrop fade. Status message: 150ms fade, rising 6px in. Full screen: none, at once. Nothing else; all off under reduced motion.

## Out of scope

Monaco · dark theme · multiple files/projects · sharing · login · linting/autocomplete beyond tag auto-close · external library imports (CDN scripts are allowed if the learner types them — `allow-scripts` permits it) · mobile-specific layout beyond stacking.

## Acceptance

- Typing `<h1>سلام دنیا</h1>` in HTML renders an RTL Farsi heading in the Preview within 300ms; cursor and selection across the Farsi run behave correctly in the Code Pane.
- `console.log` and a thrown error both appear in the console strip; the parent ignores messages from other windows.
- A first visit opens empty on the `HTML` tab. Reload restores the three files, on the `HTML` tab. «بازنشانی» empties them; «دانلود index.html» yields a single working `index.html`.
- A Full Page pasted into the HTML tab replaces whatever was in it, renders with its own direction and styles, and downloads unchanged. Its `localStorage` and form handlers work in the Preview.
- «تمام‌صفحه پیش‌نمایش» covers the screen without reloading the page; «خروج از تمام‌صفحه» or Escape returns, focus following. Each action's status message appears in the original tool's words.
- The landing page bundle contains none of CodeMirror or JetBrains Mono.
- Lighthouse Accessibility 100 on `/editor`; all controls reachable by keyboard; tab bar uses proper `role="tablist"`.
