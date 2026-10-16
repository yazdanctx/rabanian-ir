# 04 — Courses and Toolbox sections

Status: ready-for-agent
Spec: ../spec.md (Sections 5–6, Palette shape rules)
Blocked by: 02, 03

## Task

- `CourseCard.astro` (card: surface, 12px radius, line border, card shadow): category label, title, description, «جزئیات ←» link (`primary-text`) and price (`N` + «میلیون» / «میلیون تومان»).
- `MasterclassCard.astro`: banner slot (`primary-soft` bg, placeholder until ticket 06), badge «دوره پرچم‌دار», title, description, «ثبت‌نام» filled button + price «15 میلیون تومان».
- `Courses.astro`: eyebrow «آموزش», `h2` «دوره‌های من», Masterclass card, swipe hint «← برای دیدن بیشتر بکشید» (mobile only), `Rail` of the 7 non-featured courses (grid of 2 at `md:`).
- `Toolbox.astro`: eyebrow «جعبه‌ابزار», `h2` «ابزارها», the note paragraph, list of `ToolRow` items: icon tile (`primary-soft` bg, primary glyph), title, note. Free Tool is an `<a href="/editor">` with a `primary` border; Locked Tools are `<div>`s with a lock icon, `aria-disabled`, no hover/focus affordance.

All links use `courseLink()` (Support fallback).

## Acceptance

- 8 courses and 8 tools render from data; every course link resolves to Telegram today.
- Locked rows are not focusable and not announced as links; the HTML Editor row is.
