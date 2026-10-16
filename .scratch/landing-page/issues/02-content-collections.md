# 02 — Content collections with the design's data

Status: ready-for-agent
Spec: ../spec.md (Sections 2, 4, 5, 6, 7, 8; "Content as data")
Blocked by: 01

## Task

Define Astro content collections (`src/content.config.ts`, Zod) and JSON data files holding every piece of copy that is a list, verbatim from the spec:

- `courses` — `{ id, title, category, description, priceMillionToman: number, url?: string, featured: boolean }`; the Masterclass is `featured: true` and gets `badge: "دوره پرچم‌دار"`. 8 entries, prices as ASCII numbers.
- `tools` — `{ id, title, locked: boolean, href?: string, note }`; «ویرایشگر HTML» unlocked with `href: "/editor"` and note «فعال · ورود ←»; 7 locked with note «ویژه دانش‌پذیران مسترکلاس».
- `testimonials` — `{ name, role, quote }`, 4 entries, emoji preserved.
- `experiences` — `{ role, employer, period, summary }`, 4 entries; `education` — `{ degree, school }`, 3 entries.
- `brands` — 5 names. `stats` — 3 `{ value: "10" | "8" | "+2000", label }`.
- A `site.ts` constant module for singletons: name, tagline, lead, badge text, Support URL `https://t.me/codaminsupport`, channel `https://t.me/aminrabanian`, LinkedIn, footer bio.

Export a helper `courseLink(course)` returning `course.url ?? SUPPORT_URL`.

## Acceptance

- `astro check` passes; every string from the spec's section list exists in data, none in components.
- Digits in data are ASCII (ADR-0002).
