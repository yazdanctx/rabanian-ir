# 06 — Image pipeline, placeholders, OG image, favicon

Status: ready-for-agent
Spec: ../spec.md (Images, SEO & meta)
Blocked by: 03, 04

## Task

- Put placeholder sources in `src/assets/images/profile.jpg` (square, ≥ 800px, neutral) and `masterclass-banner.jpg` (16:9, ≥ 1600px). Render both with Astro `<Picture formats={['avif','webp']} />`, explicit `width`/`height`, `sizes` matching the column (`(min-width: 768px) 680px, 100vw` for the banner; fixed px for the photo), `loading="eager" fetchpriority="high"` on the photo, `loading="lazy" decoding="async"` on the banner, `alt` in Farsi.
- Make swapping files the only step: components import by fixed path; document this in a comment.
- `public/favicon.svg` from the design's star mark on a `primary` tile; `public/og.png` 1200×630 — name + tagline on palette P, generated at build (e.g. `satori` + `sharp` in a small build script, or a committed PNG if that proves heavier than it's worth — note which).
- Wire `og:image`, `twitter:card=summary_large_image` in `Base.astro`.

## Acceptance

- `dist/` contains AVIF and WebP variants with srcsets; no CLS in Lighthouse; image bytes above the fold < 80 KB on a 390px viewport.
- Favicon and OG tags validate.
