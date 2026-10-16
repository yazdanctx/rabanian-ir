# 01 — `/editor` route, layout, tabs and action bar

Status: resolved
Spec: ../spec.md (Page, Layout)
Blocked by: landing-page/01 (theme + Base layout)

## Task

- `src/pages/editor.astro`: `Base` layout, Farsi title «ویرایشگر HTML — rabanian.ir», `TopBar`, and the island `<EditorApp client:only="react" />`.
- `src/components/editor/EditorApp.tsx`: state for `{ html, css, js, activeTab }`; `TabBar` (`role="tablist"`, Latin labels `HTML` `CSS` `JS`, arrow-key navigation); `ActionBar` with «اجرا» «بازنشانی» «دانلود» (handlers stubbed, wired in ticket 04); `CodePane` placeholder (`<textarea>` for now); `Preview` placeholder; `ConsoleStrip` placeholder (collapsed, label «کنسول»).
- Layout: two columns at ≥ 1024px (Code Pane on the right — page is RTL), stacked below; chrome on `surface`, 12px radius, `line` borders, palette P.
- Install JetBrains Mono 400/700 woff2 into `src/assets/fonts/mono/`, `@font-face` scoped to this route's CSS; code font stack `'JetBrains Mono', 'IRANYekanXFaNum', ui-monospace, monospace`.

## Acceptance

- Route renders, tabs switch the active pane with keyboard and mouse, layout reflows at 1024px.
- Landing page bundle unchanged (no editor code or mono font in `index.html`'s graph).

## Comments

- 2026-10-17: resolved — merged into integration branch `html-editor` (bf443f6); code-review fixes in d824aed.
