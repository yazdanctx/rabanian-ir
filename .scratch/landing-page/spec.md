# rabanian.ir — landing page

Status: resolved
Decided: 2026-10-16 (grilling session, three rounds)
Design reference: `موبایل-html/Mobile.dc.html` — **content and section order only**; its colors, fonts and ambient animations are not used.
Vocabulary: `GLOSSARY.md`. Decisions with lock-in: `docs/adr/`.

## Goal

A Farsi, RTL, light-mode-only personal site for Amin Rabanian (AI educator / product manager) that sells Courses and links to the HTML Editor (spec: `.scratch/html-editor/spec.md`). Minimal, fast, every image aggressively optimized, motion subtle and smooth.

## Stack

- Astro 7, `output: 'static'`, TypeScript, npm. No adapter; hosting is a personal VPS, decided later — nothing here may depend on a platform.
- Tailwind 4 (CSS-first `@theme`), palette tokens below as CSS variables.
- No React on the landing page: animation via `motion` v12's vanilla API (`animate`, `inView`, `stagger`) in one bundled Astro `<script>` (ADR-0003). `@astrojs/react` is installed only for the HTML Editor island.
- Content in Astro content collections (`src/content/*.json`, Zod schemas). Components never hard-code copy, prices or links.
- `<html lang="fa" dir="rtl">`. Light mode only: no dark theme, no `prefers-color-scheme` handling, no toggle.

## Palette (P — "Paasta", no gradient hero)

| token | value | use |
|---|---|---|
| `--ink` | `#050816` | headings, body text, dark CTA block background |
| `--muted` | `#536078` | descriptions, labels, captions |
| `--primary` | `#1769FF` | filled buttons, logo mark, pulsing dot, hover `#0D5BE0` |
| `--primary-text` | `#0D5BE0` | text links, hero tagline, section eyebrows (≥ 5.8:1 on white) |
| `--primary-soft` | `#EAF1FF` | tool icon tiles |
| `--surface` | `#F5F7FA` | cards, stat tiles, editor chrome, Masterclass banner slot |
| `--line` | `#DCE3EE` | all borders; 1px section dividers |
| `--bg` | `#FFFFFF` | page |
| on dark block | text `#FFFFFF`, eyebrow `#56A6FF`, button `#1769FF`/white text | CTA section only |

Shape: buttons 8px radius; cards 12px with 1px `--line` border and shadow `0 0 10px 1px #27272a08, 0 4px 5px -4px #27272a14, 0 1px 5px -2px #27272a1a, 0 0 0 1px #27272a0f`. Sections are full-width bands, paasta.cloud-style (2026-10-17), separated by curves instead of rules, each meeting its own shape (curves 32px tall, 64px from md:; bands pad their bottom by that so no curve covers content): the Hero's white bulges down into About, which tucks under it; About's gray fades to white over its last 10rem so Courses meets it with no curve; Courses' white bulges down into the Toolbox the same way; Toolbox meets Testimonials edge to edge, and Testimonials the (white) Résumé; the dark footer rises into the Résumé with a dome (a half-ellipse): white (`--bg`) and gray (`--surface`) bands alternate from a white Hero — Hero white · About (with the Brands) gray · Courses white · Toolbox gray · Testimonials white · Résumé white — and cards follow their band (gray on white, white on gray). No side borders (a framed page with vertical guides was tried and dropped). The footer — the CTA and the links together — is the one dark block, the same at the end of every content page (not the full-screen HTML Editor, decided 2026-10-17). **No gradients anywhere** — two exceptions, both asked for on 2026-10-17: About's gray-to-white fade at its foot (the only CSS gradient; a test pins it), and the Masterclass banner *placeholder* image, a subtle gray diagonal gradient with a gray «</>» (Amin's real banner replaces it). **No background artwork.** No second accent (paasta's violet is not used).

Reference mock: `.scratch/palettes/index.html`, column P.

## Typography

- IRANYekanXFaNum (Farsi, Persian-digit outlines) — the whole site is Farsi so this is the only family loaded on the landing page. Files already in `src/assets/fonts/fa/` (400/500/600/700). The plain `IRANYekanX` in `src/assets/fonts/en/` is reserved for any future English page; it must not be loaded here.
- Weights: 700 headings, 600 sub-heads/buttons/prices, 500 labels/eyebrows, 400 body. `font-display: swap`; preload Regular only.
- Digits are stored as ASCII in content (`15`, `2000`, `2025`); the FaNum face renders them Persian. No digit-conversion code (ADR-0002).
- The design's Estedad/Vazirmatn are not used.

## Layout

- Mobile-first, faithful to the 390–430px artboard.
- Desktop: **single centered column, max-width ~680px**; Rails become 2–3-column grids at ≥ 768px; hero stays stacked and centered. No bespoke two-column desktop hero.
- Headings: Hero `h1` 44px (56px from md:), section `h2` 24px (32px from md:); sections pad 48px block (64px from md:).
- Rail (mobile): horizontal scroll-snap row, hidden scrollbar, with the design's «← برای دیدن بیشتر بکشید» hint under the Courses rail.

## Sections (order fixed, content from the design)

1. **Top bar** — logo (Amin's profile photo in a 30px circle — same source file as the Hero photo — + «آکادمی ربانیان») linking `#top`; Telegram icon button → `https://t.me/codaminsupport` (`aria-label="پشتیبانی تلگرام"`).
2. **Hero** `#top` — white, centered text — status badge (pulsing dot + «متخصص هوش مصنوعی · مدیریت محصول»); `h1` «امین ربانیان»; tagline «با من هوش مصنوعی رو اصولی یاد بگیر!» in `--primary-text`; lead paragraph; profile photo (round, 150–180px, two **static** concentric dashed rings, pill «هوش مصنوعی کاربردی ✦» as a static label); two buttons «دوره‌ها» (`#courses`, filled) and «ابزارها» (`#tools`, outlined); three stat tiles: 10 سال تجربه · 8 دوره تخصصی · +2000 دانش‌پذیر.
3. **About** `#about` — one gray band holding the Brands too (2026-10-17): eyebrow «من کی هستم؟», `h2` «یک مسیر؛ از مهندسی تا محصول»; then the **Gallery**, a full-window-width strip of five photos of Amin at work (`src/content/gallery.json` for order and Farsi alts, images `src/assets/gallery/<id>.*`), 200px tall (280px from md:) at their own aspect ratios, scrolling itself (see Motion); then the paragraph with the four highlighted Brand names; then the Brands as one still list card (white, chosen 2026-10-17 from five options): the caption as its gray header row with a short primary bar, then one row per Brand — logo (38px tile) and name — divided by hairlines. The card reveals as one block.
4. **Brands** — no section of their own any more: the list card at the end of About (3). Caption «برندهایی که افتخار همکاری با آن‌ها را داشته‌ام»; Brands in order: اسنپ · مستربلیط · گروه صنعتی انتخاب · سی‌آر‌ام دیدار · ویسِند انگلیس, each with its logo (`src/assets/logos/<brand id>.*`, shared with the résumé).
5. **Courses** `#courses` — eyebrow «آموزش», `h2` «دوره‌های من». Masterclass card first (banner image slot, badge «دوره پرچم‌دار», title, description, «ثبت‌نام» button, price `15` میلیون تومان). Then the Rail of 7 Course cards (category label, title, one-line description, «جزئیات ←» link, price): AI Coding/مینی‌دوره برنامه‌نویسی با AI/5 · طراحی/آموزش فیگما از صفر/2 · سه‌بعدی/طراحی سایت‌های سه‌بعدی/4 · بازاریابی/تگ منیجر برای مبتدیان/2 · آنالیز/آموزش پست‌هاگ (PostHog)/1 · آنالیز/مایکروسافت کلریتی/1 · ایجنتیک/آموزش کرسر (Cursor)/3.
   - Each Course has an optional `url`. «ثبت‌نام» and «جزئیات» use it; when absent they fall back to Support `https://t.me/codaminsupport`. All ship without `url`.
6. **Toolbox** `#tools` — eyebrow «جعبه‌ابزار», `h2` «ابزارها», note «ویرایشگر HTML برای همه آزاد است؛ باقی ابزارها ویژهٔ دانش‌پذیران دورهٔ مسترکلاس فعال می‌شوند.» Under the note, a still picture of the HTML Editor (decorative, `aria-hidden`): a window with the file tabs, the Starter Template's markup (comments left out) in the Code Pane's colors, and what it renders — taken from the real Starter Template. List: **Free Tool** «ویرایشگر HTML» — «فعال · ورود ←» → `/editor`, highlighted border. **Locked Tools** (presentational only: lock icon, «ویژه دانش‌پذیران مسترکلاس», not clickable, no auth, no "coming soon"): دیکشنری اصطلاحات · مگاپرامپت‌ها · کتاب‌های مرجع · ویدئوها · نمونه قراردادها · نمونه کد وبسایت‌ها · دانلود نرم‌افزارها.
7. **Testimonials** — eyebrow «تجربه دانش‌پذیران», `h2` «نظرات», Rail of 4 quote cards with initial-letter avatar, name, role «دانش‌پذیر مسترکلاس» (زهرا قاضی‌زاهدی · سارا اسفندیاری · میثم بدرقه · فرناز کاشی — texts verbatim from the design, emoji included).
8. **Résumé** `#resume` — eyebrow «مسیر من», `h2` «خلاصه‌ای از سوابق». `h3` «تجربهٔ حرفه‌ای»: 4 Experiences (ویسِند انگلستان تیر 1404–اکنون · مستربلیط مرداد 1403–تیر 1404 · سی‌آر‌ام دیدار آذر 1402–تیر 1403 · اسنپ خرداد 1402–آذر 1402), dated in the Persian (Solar Hijri) calendar, as a vertical timeline, each entry marked by the employer's logo in a 36px tile (`src/assets/logos/<experience id>.*`: Mr Bilit from [Persian Labs icons](https://icons.persian-labs.ir/), Snapp's «!» mark from its app CDN, Didar from didar.me, Wesend supplied). `h3` «تحصیلات»: 3 entries.
9. **CTA** — the top of the dark footer (10), the Telegram glyph in a tile on top: eyebrow, `h2` «سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟», line «همین حالا در تلگرام به پشتیبانی پیام بده؛ سریع راهنمایی می‌شی.», button «پیام در تلگرام» → Support. (Replaces the design's light CTA card.)
10. **Footer** — one full-width dark `--ink` block, shared by every content page but not `/editor` (`Footer.astro`, right after `<main>`), over a barely-there grid of 64px squares (an SVG pattern of 3.5%-white hairlines, no shaded squares — calm, so it doesn't distract): the CTA (9), then — with no rule between them — logo, one-line bio, links «پشتیبانی و مشاوره» (t.me/codaminsupport) · «کانال تلگرام» (t.me/aminrabanian) · «لینکدین» (linkedin.com/in/amin-rabanian/), line «ساخته شده با ♥ توسط آکادمی ربانیان» with a small inline heart SVG.

Anchor links scroll smoothly (`scroll-behavior: smooth`, disabled under reduced motion).

## Images

- Slots: profile photo (hero and logo), the About Gallery's five photos, Masterclass banner, OG image, Brand / résumé employer and university logos. Nothing else is raster; course cards use category labels.
- Source files live in `src/assets/` (never `public/`) and render through Astro `<Picture>`: AVIF + WebP + fallback, `srcset`/`sizes` per breakpoint, explicit `width`/`height`, `loading="lazy"` + `decoding="async"` below the fold, `fetchpriority="high"` on the profile photo. No LQIP/blur placeholders.
- Until Amin supplies the photo and banner, neutral placeholders sit in the exact slots with the pipeline already wired; dropping the files in is the only step.
- Budget: Lighthouse mobile Performance ≥ 95.

## Motion (`motion` v12, vanilla script — ADR-0003)

- Hero: soft load stagger (badge → h1 → tagline → lead → photo → buttons → stats), 60ms apart, fade + 8px rise, ~400ms ease-out.
- Sections: fade + 8px rise once on entering the viewport (`inView`, once); list/rail items staggered 60ms.
- Cards and links: subtle hover lift (2px) / color transition.
- Pulsing status dot: CSS keyframe (3s opacity).
- About Gallery, every width: scrolls itself in an endless loop (CSS keyframe, ~30–45px/s, moving right — forward in RTL), paused while hovered, touched or focused. The motion script appends an inert, aria-hidden copy of the photos to close the loop. Under reduced motion or without JS it is a plain swipeable row. These two are the only ambient animations; the Brands wall is still.
- **Removed from the design**: spinning orbit (rings are static), floating pill (static label).
- `prefers-reduced-motion: reduce` → no transforms, instant appearance, dot static.
- Nothing scroll-linked, no parallax, no cursor effects.

## SEO & meta

Farsi `<title>` and description per page; `<link rel="canonical">` on `https://rabanian.ir`; `@astrojs/sitemap`; `robots.txt`; static OG image 1200×630 (name + tagline on the P palette) generated at build; favicon/SVG icon from the design's star mark; Open Graph + Twitter card tags.

## Out of scope

Dark mode · auth or any gating of Locked Tools · course detail pages · payments · CMS · analytics · English version · deployment config (VPS, later).

## Acceptance

- All 10 sections render with the copy above, RTL, in IRANYekanXFaNum, on palette P, with no gradient and no violet.
- Every Course link resolves (`url` or Support fallback); the HTML Editor row opens `/editor`; Locked Tools are inert.
- Images are served as AVIF/WebP with dimensions; no layout shift; Lighthouse mobile ≥ 95 Performance, 100 Accessibility.
- Motion runs as specified and is fully disabled under reduced motion.
- `npm run build` produces a static `dist/` with no adapter.
