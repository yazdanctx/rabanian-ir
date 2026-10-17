# Handoff — 2026-10-16

State of `main` after merging the landing page. Read `CLAUDE.md`, `GLOSSARY.md` and `docs/adr/` first; this file only adds what they don't say.

## Where things stand

- **Landing page: done.** Spec `.scratch/landing-page/spec.md` and tickets 01–08 are `Status: resolved` (each ticket's `## Comments` names its merge commit). The spec has been updated for everything decided after it was written; it is the source of truth.
- **HTML Editor: not started.** `.scratch/html-editor/spec.md`, tickets 01–05 all `ready-for-agent`. Editor 01 was blocked by landing 01, which is done; 02 and 03 can run in parallel after 01, then 04, then 05.
- Lighthouse mobile (median of 3): **99 / 100 / 100 / 100**. Recipe and per-run table in `.scratch/landing-page/issues/08-seo-sitemap-lighthouse.md` → Comments. Landing JS ≈ 4 KB gzipped.

## Commands

```bash
npm install
npm run dev          # Astro 7 dev server; it detaches — stop with `npx astro dev stop`
npm run build        # static dist/, no adapter
npm test             # vitest: builds once, then asserts on dist/ (HTML, CSS, images)
npx astro check      # 0 errors / 0 warnings expected (the ~93 hints come from the vendored design folder)
```

Browser tests (`tests/*-browser.test.ts`) drive the system Chrome at `/Applications/Google Chrome.app`; they skip if it's missing (`CHROME_PATH` overrides).

## Decisions made after the spec was written

- **No React on the landing page** — ADR-0003. Motion is one bundled script (`src/scripts/motion.ts`, `motion` + `motion/mini`) driven by `data-reveal` / `data-stagger` attributes. `@astrojs/react` stays for the editor island only. Content is visible with JS off or under reduced motion (hiding only happens under `html.motion`, set by `Motion.astro`).
- **Logo** = the academy's mark, a white «>_» prompt on a 30px ink tile (`src/logo-mark.ts`, drawn inline), + «آکادمی ربانیان», in the top bar and footer. The same mark is the favicon and sits on the OG image. Amin's photo is only in the Hero.
- **Company logos** on the Brands rail and résumé timeline: `src/assets/logos/<id>.*`, rendered by `CompanyLogo.astro`; ids are shared by `brands.json` and `experiences.json`. Sources and caveats in `src/assets/logos/README.md`. One file per id — the build fails on zero or two.
- **Résumé dates** are in the Persian calendar (each Gregorian month → the Persian month covering most of it). Digits stay ASCII (ADR-0002).
- Masterclass banner is 16:9; locked tools aren't faded (contrast); swipe hint sits above the course rail.
- Tailwind's default colours are removed — only palette P tokens exist (`src/styles/global.css`, mirrored in `src/palette.ts`, a test keeps them equal).
- OG image and favicon are generated at build (`src/pages/og.png.ts`, `src/pages/favicon.svg.ts`), not committed files.

## Conventions worth knowing

- All copy lives in `src/site.ts` (`SITE`, `COPY`, `LINKS`) or `src/content/*.json`; components never hard-code copy, prices or links.
- Read collections with `getOrderedCollection()` (`src/content/ordered.ts`) — plain `getCollection()` sorts by id, not file order.
- Shared building blocks: `Section.astro`, `Rail.astro` (`label`, `cols`, `itemWidth` required), `Eyebrow.astro`, `Icon.astro`, `Price.astro`, `CompanyLogo.astro`.
- Tests assert on built output via `tests/helpers/dist.ts` (`page('index.html')`), not on component internals.

## Waiting on Amin

- Masterclass banner → replace `src/assets/images/masterclass-banner.jpg` (16:9, ≥ 1600px).
- Course `url`s in `src/content/courses.json` — until set, every course link goes to Telegram Support.
- Confirm the CTA eyebrow «پشتیبانی» (invented; the design had none).
- Official Entekhab logo — the current one is a 122px crop from a job-board profile.
- Exact start months if any résumé date should be the later Persian month.

## Next step

Start the editor: `/mattpocock-skills:implement-spec .scratch/html-editor/spec.md` (from `main`, or from a worktree if you're also changing the landing page — editor 01 reuses `Base.astro` and `TopBar.astro`).
