# 05 — Testimonials, Résumé, dark CTA block, Footer

Status: ready-for-agent
Spec: ../spec.md (Sections 7–10)
Blocked by: 02, 03

## Task

- `Testimonials.astro`: eyebrow, `h2` «نظرات», `Rail` of `<figure>` cards — `<blockquote>` + `<figcaption>` with initial-letter avatar (surface circle, 600), name, role.
- `Resume.astro`: eyebrow «مسیر من», `h2`; `h3` «تجربهٔ حرفه‌ای» with a vertical timeline (line + dot in `primary`) of 4 Experiences (role 600, employer · period muted, summary); `h3` «تحصیلات» with 3 entries.
- `Cta.astro`: `ink` block, 18px radius, white text; eyebrow in `#56A6FF`; `h2` «سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟»; line; button «پیام در تلگرام» (`primary` bg, white text) → Support.
- `Footer.astro`: logo, bio line, three links, «ساخته شده با ♥ توسط آکادمی ربانیان» with an inline heart SVG (`primary`), no gradient.
- Assemble all sections in `index.astro` in spec order with ids `top about courses tools resume`.

## Acceptance

- Full page renders end-to-end with all copy; anchors from Hero/TopBar land on the right sections.
- CTA block is the only dark surface on the page.
