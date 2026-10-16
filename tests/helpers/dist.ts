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

/** Contents of every inline `<style>` in a built page. */
function inlineStyles(doc: Document): string[] {
  return [...doc.querySelectorAll('style')].map((style) => style.textContent ?? '');
}

/**
 * Concatenated contents of every built stylesheet, including the small ones
 * Astro inlines as `<style>` into a page instead of emitting a file.
 */
export function builtCss(): string {
  const files = distFiles();
  return [
    ...files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(distDir, f), 'utf8')),
    ...files.filter((f) => f.endsWith('.html')).flatMap((f) => inlineStyles(page(f))),
  ].join('\n');
}

/** The CSS one built page loads: its linked stylesheets and inline `<style>`s. */
export function pageCss(doc: Document): string {
  return [
    ...[...doc.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
      readFileSync(join(distDir, link.getAttribute('href')!), 'utf8'),
    ),
    ...inlineStyles(doc),
  ].join('\n');
}
