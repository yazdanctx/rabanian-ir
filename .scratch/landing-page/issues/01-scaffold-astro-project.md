# 01 — Scaffold the Astro project, theme tokens, base layout

Status: resolved
Spec: ../spec.md (Stack, Palette, Typography)
Blocked by: —

## Task

Create the Astro 7 project at the repo root (npm, TypeScript strict, `output: 'static'`, no adapter) with `@astrojs/react`, `@astrojs/sitemap`, Tailwind 4 via `@tailwindcss/vite`, and `motion`.

- `src/styles/fonts.css`: `@font-face` for IRANYekanXFaNum 400/500/600/700 from `src/assets/fonts/fa/` (`font-display: swap`). Do **not** declare the `en/` variant yet (ADR-0002 explains when it would be).
- `src/styles/global.css`: Tailwind `@theme` exposing palette P exactly as the spec table (`--color-ink`, `--color-muted`, `--color-primary`, `--color-primary-text`, `--color-primary-soft`, `--color-surface`, `--color-line`), radii (`--radius-btn: 8px`, `--radius-card: 12px`, `--radius-cta: 18px`) and the card shadow token. Base: white bg, ink text, `font-family: IRANYekanXFaNum`, `scroll-behavior: smooth` (off under reduced motion).
- `src/layouts/Base.astro`: `<html lang="fa" dir="rtl">`, charset/viewport, preload of the Regular woff2, `<title>`/description/canonical props, OG/Twitter tags (OG image wired in ticket 06), `<slot />`.
- `src/pages/index.astro` rendering the layout with a placeholder `<main>`.
- `astro.config.mjs` with `site: 'https://rabanian.ir'`.

## Acceptance

- `npm run dev` serves an RTL page in IRANYekanXFaNum; `npm run build` succeeds with no adapter.
- Theme tokens resolve as Tailwind utilities (`bg-surface`, `text-primary-text`, `rounded-card`…).
- No gradient, no dark-mode CSS, no English font loaded.

## Comments

- 2026-10-16: resolved — merged into integration branch `landing-page` (fdde774).
