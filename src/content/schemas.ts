import { z } from 'astro/zod';

/**
 * Zod schemas for every content collection. Kept apart from
 * `src/content.config.ts` (which needs the `astro:content` virtual module)
 * so tests can validate the JSON data with exactly the same rules.
 *
 * Digits in all data are ASCII (ADR-0002); the FaNum font draws them Persian.
 */

/** A Course. The Masterclass is the one `featured` entry and carries `badge`. */
export const course = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  priceMillionToman: z.number().positive(),
  /** Enrollment/details page; absent → Support (see `courseLink`). */
  url: z.url().optional(),
  featured: z.boolean(),
  badge: z.string().optional(),
});

export const schemas = {
  courses: course,
};
