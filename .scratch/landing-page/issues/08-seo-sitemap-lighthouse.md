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

## Comments

**Lighthouse, 2026-10-16** — mobile (default preset: 412px emulation, simulated throttling), Lighthouse 13.5.0, HeadlessChrome 154, macOS. Built at commit c026a8d (branch `landing-08`).

```bash
npm run build && npx -y serve dist -l 4878        # serve gzips by default
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npx -y lighthouse@13 http://localhost:4878/ --quiet --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./lh-N.json
```

| run | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 99 | 100 | 100 | 100 | 1.5 s | 1.7 s | 0 ms | 0 | 1.5 s |
| 2 | 99 | 100 | 100 | 100 | 1.5 s | 1.7 s | 0 ms | 0 | 1.5 s |
| 3 | 99 | 100 | 100 | 100 | 1.5 s | 1.7 s | 0 ms | 0 | 1.5 s |
| **median** | **99** | **100** | **100** | **100** | 1.5 s | 1.7 s | 0 ms | 0 | 1.5 s |

All four thresholds met; nothing needed fixing. The LCP element is the hero profile photo (AVIF, `fetchpriority=high`, discoverable in the initial HTML). Its LCP breakdown is almost all *element render delay* (~690 ms simulated), which is the Hero load sequence fading it in after the motion script runs (ticket 07). It costs only about 0.2 s over FCP and the LCP audit still scores 0.99, so the fade stays as is. The only weighted audits below 1 were FCP (0.96) and LCP (0.99).

`dist/robots.txt` (from `public/robots.txt`), `dist/sitemap-index.xml` and `dist/sitemap-0.xml` are present. `tests/seo-files.test.ts` checks them along with a self-canonical on every built page, and `tests/home-page.test.ts` checks the exact title.
