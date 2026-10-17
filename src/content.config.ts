import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { schemas } from './content/schemas';

/*
 * One collection per JSON file in `src/content/`. File order is the display
 * order, but `getCollection()` returns entries sorted by `id` (Astro's data
 * store), so components read collections through `getOrderedCollection()`
 * from `src/content/ordered.ts`.
 */
export const collections = {
  stats: defineCollection({ loader: file('src/content/stats.json'), schema: schemas.stats }),
  brands: defineCollection({ loader: file('src/content/brands.json'), schema: schemas.brands }),
  courses: defineCollection({ loader: file('src/content/courses.json'), schema: schemas.courses }),
  tools: defineCollection({ loader: file('src/content/tools.json'), schema: schemas.tools }),
  testimonials: defineCollection({
    loader: file('src/content/testimonials.json'),
    schema: schemas.testimonials,
  }),
  experiences: defineCollection({
    loader: file('src/content/experiences.json'),
    schema: schemas.experiences,
  }),
  education: defineCollection({
    loader: file('src/content/education.json'),
    schema: schemas.education,
  }),
  gallery: defineCollection({ loader: file('src/content/gallery.json'), schema: schemas.gallery }),
};
