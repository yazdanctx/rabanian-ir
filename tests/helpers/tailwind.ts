import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { compile } from '@tailwindcss/node';

const globalCssPath = join(process.cwd(), 'src/styles/global.css');

/**
 * Compile the site's global.css through Tailwind with the given class names
 * as candidates, the way the Vite plugin does when it finds them in markup.
 */
export async function compileWith(classes: string[]): Promise<string> {
  const compiler = await compile(readFileSync(globalCssPath, 'utf8'), {
    base: dirname(globalCssPath),
    onDependency: () => {},
  });
  return compiler.build(classes);
}

/** Custom properties declared on `:root` / `:host` in compiled CSS. */
function rootVariables(css: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const block of css.matchAll(/:root,\s*:host\s*{([^}]*)}/g)) {
    for (const [, name, value] of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
      vars.set(name, value.trim());
    }
  }
  return vars;
}

/**
 * The value a utility class sets for `property`, with `var(--x)` references
 * resolved against the theme. `undefined` if the class generates no rule.
 */
export async function utilityValue(className: string, property: string) {
  const css = await compileWith([className]);
  const escaped = className.replace(/[^\w-]/g, (c) => `\\\\${c}`);
  const rule = css.match(new RegExp(`\\.${escaped}\\s*{([^}]*)}`))?.[1];
  if (!rule) return undefined;
  const value = rule.match(new RegExp(`(?:^|[\\s;])${property}:\\s*([^;]+);`))?.[1]?.trim();
  if (value === undefined) return undefined;
  const vars = rootVariables(css);
  return value.replace(/var\((--[\w-]+)\)/g, (ref, name: string) => vars.get(name) ?? ref);
}
