# 03 — Sandboxed Preview and Farsi console strip

Status: ready-for-agent
Spec: ../spec.md (Preview, Layout → Console strip)
Blocked by: 01

## Task

- `buildDocument({html, css, js})` → string: `<!doctype html><html lang="fa" dir="rtl">`, charset, a `<style>` with `@font-face` for IRANYekanXFaNum Regular/Bold (absolute `/…` URLs to the built font assets — the iframe has an opaque origin, so load via `src` URLs, not relative paths) and `body { font-family: IRANYekanXFaNum, system-ui; margin: 16px }`, then the user CSS, body = user HTML, the console bridge script, then user JS.
- `Preview.tsx`: `<iframe sandbox="allow-scripts" srcDoc=…>`, title «پیش‌نمایش», rebuilt on a 300ms debounce of any file change and immediately on «اجرا» (bump a key to force reload).
- Console bridge (inside the iframe): wrap `console.log/info/warn/error`, `window.onerror`, `unhandledrejection`; serialize args safely (strings, numbers, JSON of objects with a depth cap, `Error.message`) and `parent.postMessage({ source: 'rabanian-editor', level, text }, '*')`.
- `ConsoleStrip.tsx`: listens to `message`, accepts only `event.source === iframeRef.current?.contentWindow` and the `source` tag; shows entries newest last with level color (error in a red that passes AA on surface), clear button «پاک کردن», collapsible with a `motion` height transition (200ms; none under reduced motion). Entries reset on each rebuild.

## Acceptance

- `<h1>سلام</h1>` renders RTL in Yekan without the learner writing `dir`; `html{direction:ltr}` in the CSS tab flips it.
- `console.log('x')`, `console.error`, a thrown `ReferenceError` and a rejected promise all appear; a `postMessage` from the parent page itself or another frame is ignored.
