# 08 — SEO files and Lighthouse verification

Status: ready-for-agent
Spec: ../spec.md (SEO & meta, Acceptance)
Blocked by: 06, 07

## Task

- `@astrojs/sitemap` output, `public/robots.txt` pointing at it, canonical on every page, Farsi `<title>` «امین ربانیان — با من هوش مصنوعی رو اصولی یاد بگیر!» and description.
- Run Lighthouse (mobile, `npm run build && npx serve dist` or `astro preview`) and record scores in this file under `## Comments`.
- Fix anything below: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100.

## Acceptance

- Scores recorded; all four thresholds met; `dist/sitemap-index.xml` and `robots.txt` present.
