import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { schemas } from './content/schemas';

/*
 * One collection per JSON file in `src/content/`. `getCollection()` returns
 * entries in file order (the `file()` loader inserts them in sequence), and
 * that order is the display order.
 */
export const collections = {
  courses: defineCollection({ loader: file('src/content/courses.json'), schema: schemas.courses }),
};
