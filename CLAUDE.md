## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles use their default names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## This project

rabanian.ir — Amin Rabanian's Farsi, RTL, light-only personal site (Astro 7) plus the free HTML Editor at `/editor`. Read `GLOSSARY.md` and `docs/adr/` before touching code.

- Specs: `.scratch/landing-page/spec.md`, `.scratch/html-editor/spec.md`. Tickets: `issues/NN-*.md` in each, with `Blocked by:` lines — landing-page 01 → 08 first, then html-editor 01 → 05 (editor 01 needs landing 01).
- Palette reference mock: `.scratch/palettes/index.html`, column P (serve the repo root and open it; fonts are in `src/assets/fonts/`).
- Design reference (content and section order only, not its colors/fonts/animations): `موبایل-html/Mobile.dc.html`.
