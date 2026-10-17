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
| `--primary-soft` | `#EAF1FF` | tool icon tiles, Masterclass banner placeholder bg |
| `--surface` | `#F5F7FA` | cards, stat tiles, editor chrome |
| `--line` | `#DCE3EE` | all borders; 1px section dividers |
| `--bg` | `#FFFFFF` | page |
| on dark block | text `#FFFFFF`, eyebrow `#56A6FF`, button `#1769FF`/white text | CTA section only |

Shape: buttons 8px radius; cards 12px with 1px `--line` border and shadow `0 0 10px 1px #27272a08, 0 4px 5px -4px #27272a14, 0 1px 5px -2px #27272a1a, 0 0 0 1px #27272a0f`; dark CTA block 18px. Sections separated by a 1px `--line` rule. **No gradients anywhere. No background artwork.** No second accent (paasta's violet is not used).

Reference mock: `.scratch/palettes/index.html`, column P.

## Typography

- IRANYekanXFaNum (Farsi, Persian-digit outlines) — the whole site is Farsi so this is the only family loaded on the landing page. Files already in `src/assets/fonts/fa/` (400/500/600/700). The plain `IRANYekanX` in `src/assets/fonts/en/` is reserved for any future English page; it must not be loaded here.
- Weights: 700 headings, 600 sub-heads/buttons/prices, 500 labels/eyebrows, 400 body. `font-display: swap`; preload Regular only.
- Digits are stored as ASCII in content (`15`, `2000`, `2025`); the FaNum face renders them Persian. No digit-conversion code (ADR-0002).
- The design's Estedad/Vazirmatn are not used.

## Layout

- Mobile-first, faithful to the 390–430px artboard.
- Desktop: **single centered column, max-width ~680px**; Rails become 2–3-column grids at ≥ 768px; hero stays stacked. No bespoke two-column desktop hero.
- Rail (mobile): horizontal scroll-snap row, hidden scrollbar, with the design's «← برای دیدن بیشتر بکشید» hint under the Courses rail.

## Sections (order fixed, content from the design)

1. **Top bar** — logo (Amin's profile photo in a 30px circle — same source file as the Hero photo — + «آکادمی ربانیان») linking `#top`; Telegram icon button → `https://t.me/codaminsupport` (`aria-label="پشتیبانی تلگرام"`).
2. **Hero** `#top` — status badge (pulsing dot + «متخصص هوش مصنوعی · مدیریت محصول»); `h1` «امین ربانیان»; tagline «با من هوش مصنوعی رو اصولی یاد بگیر!» in `--primary-text`; lead paragraph; profile photo (round, 150–180px, two **static** concentric dashed rings, pill «هوش مصنوعی کاربردی ✦» as a static label); two buttons «دوره‌ها» (`#courses`, filled) and «ابزارها» (`#tools`, outlined); three stat tiles: 10 سال تجربه · 8 دوره تخصصی · +2000 دانش‌پذیر.
3. **About** `#about` — eyebrow «من کی هستم؟», `h2` «یک مسیر؛ از مهندسی تا محصول», paragraph with the four highlighted Brand names.
4. **Brands** — caption «برندهایی که افتخار همکاری با آن‌ها را داشته‌ام», Rail of text chips: اسنپ · مستربلیط · گروه صنعتی انتخاب · سی‌آر‌ام دیدار · ویسِند انگلیس. Each chip: the company's logo (40px tile, `src/assets/logos/<brand id>.*`, shared with the résumé) above its name.
5. **Courses** `#courses` — eyebrow «آموزش», `h2` «دوره‌های من». Masterclass card first (banner image slot, badge «دوره پرچم‌دار», title, description, «ثبت‌نام» button, price `15` میلیون تومان). Then the Rail of 7 Course cards (category label, title, one-line description, «جزئیات ←» link, price): AI Coding/مینی‌دوره برنامه‌نویسی با AI/5 · طراحی/آموزش فیگما از صفر/2 · سه‌بعدی/طراحی سایت‌های سه‌بعدی/4 · بازاریابی/تگ منیجر برای مبتدیان/2 · آنالیز/آموزش پست‌هاگ (PostHog)/1 · آنالیز/مایکروسافت کلریتی/1 · ایجنتیک/آموزش کرسر (Cursor)/3.
   - Each Course has an optional `url`. «ثبت‌نام» and «جزئیات» use it; when absent they fall back to Support `https://t.me/codaminsupport`. All ship without `url`.
6. **Toolbox** `#tools` — eyebrow «جعبه‌ابزار», `h2` «ابزارها», note «ویرایشگر HTML برای همه آزاد است؛ باقی ابزارها ویژهٔ دانش‌پذیران دورهٔ مسترکلاس فعال می‌شوند.» List: **Free Tool** «ویرایشگر HTML» — «فعال · ورود ←» → `/editor`, highlighted border. **Locked Tools** (presentational only: lock icon, «ویژه دانش‌پذیران مسترکلاس», not clickable, no auth, no "coming soon"): دیکشنری اصطلاحات · مگاپرامپت‌ها · کتاب‌های مرجع · ویدئوها · نمونه قراردادها · نمونه کد وبسایت‌ها · دانلود نرم‌افزارها.
7. **Testimonials** — eyebrow «تجربه دانش‌پذیران», `h2` «نظرات», Rail of 4 quote cards with initial-letter avatar, name, role «دانش‌پذیر مسترکلاس» (زهرا قاضی‌زاهدی · سارا اسفندیاری · میثم بدرقه · فرناز کاشی — texts verbatim from the design, emoji included).
8. **Résumé** `#resume` — eyebrow «مسیر من», `h2` «خلاصه‌ای از سوابق». `h3` «تجربهٔ حرفه‌ای»: 4 Experiences (ویسِند انگلستان تیر 1404–اکنون · مستربلیط مرداد 1403–تیر 1404 · سی‌آر‌ام دیدار آذر 1402–تیر 1403 · اسنپ خرداد 1402–آذر 1402), dated in the Persian (Solar Hijri) calendar, as a vertical timeline, each entry marked by the employer's logo in a 36px tile (`src/assets/logos/<experience id>.*`: Mr Bilit from [Persian Labs icons](https://icons.persian-labs.ir/), Snapp's «!» mark from its app CDN, Didar from didar.me, Wesend supplied). `h3` «تحصیلات»: 3 entries.
9. **CTA** — dark `--ink` block, 18px radius: eyebrow, `h2` «سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟», line «همین حالا در تلگرام به پشتیبانی پیام بده؛ سریع راهنمایی می‌شی.», button «پیام در تلگرام» → Support. (Replaces the design's light CTA card.)
10. **Footer** — logo, one-line bio, links «پشتیبانی و مشاوره» (t.me/codaminsupport) · «کانال تلگرام» (t.me/aminrabanian) · «لینکدین» (linkedin.com/in/amin-rabanian/), line «ساخته شده با ♥ توسط آکادمی ربانیان» with a small inline heart SVG.

Anchor links scroll smoothly (`scroll-behavior: smooth`, disabled under reduced motion).

## Images

- Slots: profile photo (hero and logo), Masterclass banner, OG image, résumé employer logos. Nothing else is raster. Brands are text; course cards use category labels.
- Source files live in `src/assets/` (never `public/`) and render through Astro `<Picture>`: AVIF + WebP + fallback, `srcset`/`sizes` per breakpoint, explicit `width`/`height`, `loading="lazy"` + `decoding="async"` below the fold, `fetchpriority="high"` on the profile photo. No LQIP/blur placeholders.
- Until Amin supplies the photo and banner, neutral placeholders sit in the exact slots with the pipeline already wired; dropping the files in is the only step.
- Budget: Lighthouse mobile Performance ≥ 95.

## Motion (`motion` v12, vanilla script — ADR-0003)

- Hero: soft load stagger (badge → h1 → tagline → lead → photo → buttons → stats), 60ms apart, fade + 8px rise, ~400ms ease-out.
- Sections: fade + 8px rise once on entering the viewport (`inView`, once); list/rail items staggered 60ms.
- Cards and links: subtle hover lift (2px) / color transition.
- Pulsing status dot: CSS keyframe (3s opacity), the one ambient animation kept.
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
