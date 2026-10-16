import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { gzipSync } from 'node:zlib';
import { distDir } from './dist';

/**
 * Every JS file a built page loads: its `<script src>`s and, transitively,
 * the chunks those statically import. Paths are site-absolute ("/_astro/…").
 */
export function pageScripts(doc: Document): string[] {
  const seen = new Set<string>();
  const visit = (path: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    const code = readFileSync(join(distDir, path), 'utf8');
    for (const [, spec] of code.matchAll(/\bimport\s*(?:[^'"()]*?\bfrom\s*)?["']([^"']+)["']/g)) {
      if (spec.startsWith('.') || spec.startsWith('/')) {
        visit(spec.startsWith('/') ? spec : posix.join(posix.dirname(path), spec));
      }
    }
  };
  for (const script of doc.querySelectorAll('script[src]')) visit(script.getAttribute('src')!);
  return [...seen];
}

/** Total gzip -9 size in bytes of the given site-absolute files. */
export function gzippedBytes(paths: string[]): number {
  return paths.reduce(
    (sum, path) => sum + gzipSync(readFileSync(join(distDir, path)), { level: 9 }).length,
    0,
  );
}
