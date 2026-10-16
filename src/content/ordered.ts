import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';

/** The raw JSON of every collection, keyed by file path, for its entry order. */
const files = import.meta.glob<{ id: string }[]>('./*.json', { eager: true, import: 'default' });

/**
 * `getCollection(name)` in the order the entries appear in
 * `src/content/<name>.json` — the display order. Use this instead of plain
 * `getCollection`: Astro's data store hands entries back sorted by `id`.
 */
export async function getOrderedCollection<C extends CollectionKey>(
  name: C,
): Promise<CollectionEntry<C>[]> {
  const order = (files[`./${name}.json`] ?? []).map((entry) => entry.id);
  const entries = (await getCollection(name)) as CollectionEntry<C>[];
  return entries.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}
