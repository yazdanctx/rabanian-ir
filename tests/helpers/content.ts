import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'astro/zod';
import { schemas } from '../../src/content/schemas';

type Collections = typeof schemas;

/**
 * A collection's entries, in file order, parsed through the same schema
 * `src/content.config.ts` gives Astro's `file()` loader — i.e. the `data` of
 * what `getCollection(name)` hands components.
 */
export function collection<K extends keyof Collections>(name: K): z.infer<Collections[K]>[] {
  const raw: unknown[] = JSON.parse(
    readFileSync(join(process.cwd(), 'src/content', `${name}.json`), 'utf8'),
  );
  return raw.map((item) => schemas[name].parse(item) as z.infer<Collections[K]>);
}
