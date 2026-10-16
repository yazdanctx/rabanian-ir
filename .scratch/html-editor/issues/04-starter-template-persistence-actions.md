# 04 — Starter Template, autosave, reset, download

Status: resolved
Spec: ../spec.md (Starter Template, Persistence, Layout → Action bar)
Blocked by: 02, 03

## Task

- `starterTemplate.ts` with the three files per spec: HTML (heading «سلام دنیا», paragraph, `<button id="greet">`, Farsi comments including the RTL-by-default note), CSS (palette-P body/button styles, comment naming the selector), JS (click handler changing the heading + `console.log('سلام از جاوااسکریپت')`, comments).
- Persistence: load from `localStorage['rabanian.editor.v1']` on mount (fallback to template; guard JSON parse), save debounced 500ms on change; also persist `activeTab`.
- «بازنشانی»: confirm dialog (Farsi, native `confirm` is acceptable) → restore template, clear storage.
- «دانلود»: build the same document as the Preview *without* the console bridge, `Blob` → `index.html` download.
- «اجرا»: force Preview rebuild now.

## Acceptance

- First visit shows the template; edits survive reload; reset restores and clears; download opens as a working RTL page in a browser with no console bridge script inside.

## Comments

- 2026-10-17: resolved — merged into integration branch `html-editor` (c45ef2e); code-review fixes in d824aed.
