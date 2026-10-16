# 07 — Motion islands with `motion`, reduced-motion safe

Status: ready-for-agent
Spec: ../spec.md (Motion)
Blocked by: 05

## Task

- `src/components/motion/Reveal.tsx` (React, `motion/react`): wraps children; `initial {opacity:0, y:8}` → `whileInView {opacity:1, y:0}`, `viewport {once:true, margin:'-10%'}`, 400ms ease-out, optional `delay`. `StaggerGroup.tsx` applies 60ms stagger to children via variants.
- Hero load sequence: badge → h1 → tagline → lead → photo → buttons → stats, 60ms apart.
- Wrap each section's content and rail items; hydrate `client:visible`. Astro components stay the markup owners — islands only add motion, no copy moves into TSX.
- Hover lift on cards/links: CSS `transition: transform 180ms, box-shadow 180ms; translateY(-2px)` (no JS).
- `useReducedMotion()` → animations render final state immediately; CSS dot and hover lift disabled under `prefers-reduced-motion: reduce`.

## Acceptance

- Landing JS ≤ ~45 KB gzipped total (React + motion + islands); nothing scroll-linked.
- With reduced motion enabled, no element moves and content is visible on load.
