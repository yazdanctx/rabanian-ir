import { z } from 'astro/zod';

/**
 * Zod schemas for every content collection. Kept apart from
 * `src/content.config.ts` (which needs the `astro:content` virtual module)
 * so tests can validate the JSON data with exactly the same rules.
 *
 * Digits in all data are ASCII (ADR-0002); the FaNum font draws them Persian.
 */

/** A Course. The Masterclass is the one entry with `masterclass: true`; it carries `badge`. */
export const course = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  priceMillionToman: z.number().positive(),
  /** Enrollment/details page; absent → Support (see `courseLink`). */
  url: z.url().optional(),
  masterclass: z.boolean(),
  badge: z.string().optional(),
});

/** Glyph keys for Tool icon tiles; the SVG paths live in the component. */
export const toolIcon = z.enum([
  'code',
  'dictionary',
  'prompts',
  'books',
  'videos',
  'contracts',
  'snippets',
  'downloads',
]);

const toolBase = { id: z.string(), title: z.string(), note: z.string(), icon: toolIcon };

/**
 * A Tool: Free (`locked: false`, opens `href`) or Locked (`locked: true`,
 * presentational only — no link).
 */
export const tool = z.discriminatedUnion('locked', [
  z.object({ ...toolBase, locked: z.literal(false), href: z.string() }),
  z.object({ ...toolBase, locked: z.literal(true), href: z.undefined().optional() }),
]);

/** A Testimonial: a Learner's quote. Emoji are part of the quote. */
export const testimonial = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  quote: z.string(),
});

/** An Experience: one résumé entry. `period` is display text, e.g. «جولای 2025 – اکنون». */
export const experience = z.object({
  id: z.string(),
  role: z.string(),
  employer: z.string(),
  period: z.string(),
  summary: z.string(),
});

/** An education entry (not an Experience). */
export const education = z.object({
  id: z.string(),
  degree: z.string(),
  school: z.string(),
});

/** A Brand, shown by name only (no logo). */
export const brand = z.object({
  id: z.string(),
  name: z.string(),
});

/** A hero stat tile. `value` is display text with ASCII digits, e.g. "+2000". */
export const stat = z.object({
  id: z.string(),
  value: z.string().regex(/^\+?[0-9]+$/),
  label: z.string(),
});

export const schemas = {
  brands: brand,
  stats: stat,
  courses: course,
  tools: tool,
  testimonials: testimonial,
  experiences: experience,
  education,
};
