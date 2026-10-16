# 03 — Top bar, Hero, About, Brands

Status: resolved
Spec: ../spec.md (Sections 1–4, Layout, Palette)
Blocked by: 02

## Task

Static Astro components (no React yet — motion is wrapped in ticket 07):

- `TopBar.astro`: logo (star mark SVG from the design in a 30px `primary` tile + `rabanian.ir`, `.ir` muted, `direction: ltr`) → `#top`; Telegram icon button (36px, surface, line border) → Support, `aria-label="پشتیبانی تلگرام"`.
- `Hero.astro`: badge with pulsing dot (CSS keyframe, 3s opacity, static under reduced motion); `h1`; tagline in `primary-text`; lead in `muted`; `ProfilePhoto` slot (round, two **static** dashed rings, static pill label «هوش مصنوعی کاربردی ✦»); buttons «دوره‌ها» filled / «ابزارها» outlined (8px radius); 3 stat tiles on `surface`.
- `About.astro`: eyebrow, `h2`, paragraph with the four Brand names emphasised (600 weight, ink).
- `Brands.astro`: caption + `Rail` of text chips.
- `Rail.astro`: shared horizontal scroll-snap row (hidden scrollbar, `scroll-snap-type: x mandatory`, edge padding) that becomes a grid at `md:` via a `cols` prop.
- `Section.astro`: wrapper giving max-width ~680px, section padding and the 1px `line` bottom rule.

## Acceptance

- Matches the design's content and order; renders correctly RTL at 390px and in the single column at 1280px.
- Stat digits render Persian via the font with ASCII in markup.
- No animation besides the dot.

## Comments

- 2026-10-16: resolved — merged into integration branch `landing-page` (744aff5).
