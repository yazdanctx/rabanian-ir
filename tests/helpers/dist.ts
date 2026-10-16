import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';

export const distDir = join(process.cwd(), 'dist');

/** Parse a built page, e.g. `page('index.html')`, into a DOM `document`. */
export function page(path: string): Document {
  const html = readFileSync(join(distDir, path), 'utf8');
  return parseHTML(html).document as unknown as Document;
}

/** Every file under dist/, as paths relative to dist/. */
export function distFiles(dir = distDir, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? distFiles(join(dir, entry.name), rel) : [rel];
  });
}

/** Concatenated contents of every built stylesheet. */
export function builtCss(): string {
  return distFiles()
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(distDir, f), 'utf8'))
    .join('\n');
}
