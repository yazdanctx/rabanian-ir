# 07 — Motion script with vanilla `motion`, reduced-motion safe

Status: ready-for-agent
Spec: ../spec.md (Motion)
Blocked by: 05
Decision: ADR-0003 (no React on the landing page — React + motion island measured ~97.5 KB gz vs ~26 KB vanilla)

## Task

- `src/scripts/motion.ts` (bundled via a `<script>` in `Base.astro` or `index.astro`, using `motion`'s `animate`, `inView`, `stagger`): elements marked `data-reveal` fade + rise 8px → 0 once when ~10% into the viewport, 400ms ease-out, optional `data-delay`; containers marked `data-stagger` stagger their `data-reveal` children 60ms.
- Hero load sequence: badge → h1 → tagline → lead → photo → buttons → stats, 60ms apart, on load (not on scroll).
- Mark each section's content and rail items with the data attributes. Astro components stay the markup owners — no `.tsx`, no `client:*` on the landing page.
- Content is visible without JS: hide-before-reveal only happens from the script (e.g. adding a class on `<html>` when the script runs and reduced motion is off), so no-JS and reduced-motion visitors get the final state with no flash.
- Hover lift on cards/links: CSS `transition: transform 180ms, box-shadow 180ms; translateY(-2px)` (no JS).
- `prefers-reduced-motion: reduce` → script does nothing (final state immediately); CSS dot and hover lift disabled.

## Acceptance

- Landing JS ≤ ~45 KB gzipped total; no React runtime in `dist/` for `index.html`; nothing scroll-linked.
- With reduced motion enabled (or JS disabled), no element moves and content is visible on load.
