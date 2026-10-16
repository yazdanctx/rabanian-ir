/*
 * The console bridge (spec: Preview): a script that runs inside the Preview
 * before the visitor's JS and posts its console output and uncaught errors to
 * the editor, where the console strip lists them.
 */

/** Tags every message the bridge posts, so the editor can tell them apart. */
export const BRIDGE_SOURCE = 'rabanian-editor';

export const CONSOLE_LEVELS = ['log', 'info', 'warn', 'error'] as const;
export type ConsoleLevel = (typeof CONSOLE_LEVELS)[number];

/** One line of the console strip. */
export interface ConsoleEntry {
  level: ConsoleLevel;
  text: string;
}

/**
 * The entry a bridge message carries, or null when `data` isn't one. Says
 * nothing about who sent it: check the message's `source` window too.
 */
export function consoleEntry(data: unknown): ConsoleEntry | null {
  if (typeof data !== 'object' || data === null) return null;
  const { source, level, text } = data as Record<string, unknown>;
  if (source !== BRIDGE_SOURCE || typeof text !== 'string') return null;
  if (!CONSOLE_LEVELS.includes(level as ConsoleLevel)) return null;
  return { level: level as ConsoleLevel, text };
}

/**
 * The bridge's source, as it goes into the Preview's `<script>`. It wraps
 * `console.log/info/warn/error` (still calling the originals) and listens for
 * uncaught errors and unhandled rejections, then posts
 * `{ source, level, text }` to the parent. Arguments become text the way the
 * browser console would show them: strings as they are, errors as
 * `Name: message`, elements as their tag, anything else as JSON, three levels
 * deep at most and cut at 10,000 characters.
 */
export const CONSOLE_BRIDGE = `(() => {
  const send = (level, text) => {
    try {
      parent.postMessage({ source: ${JSON.stringify(BRIDGE_SOURCE)}, level, text: text.slice(0, 10000) }, '*');
    } catch {}
  };
  const plain = (value, depth, seen) => {
    if (value instanceof Error) return value.name + ': ' + value.message;
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
    if (typeof value === 'bigint') return value + 'n';
    if (typeof value === 'function') return 'ƒ ' + (value.name || '') + '()';
    if (typeof value === 'undefined' || typeof value === 'symbol') return String(value);
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Element) {
      const tag = value.cloneNode(false).outerHTML;
      return value.childNodes.length ? tag.replace('><', '>…<') : tag;
    }
    if (value instanceof Node) return value.nodeName;
    if (seen.includes(value)) return '[Circular]';
    if (depth >= 3) return Array.isArray(value) ? '[…]' : '{…}';
    const inside = seen.concat([value]);
    if (Array.isArray(value)) return value.map((item) => plain(item, depth + 1, inside));
    const copy = {};
    for (const key of Object.keys(value)) copy[key] = plain(value[key], depth + 1, inside);
    return copy;
  };
  const show = (value) => {
    if (typeof value === 'string') return value;
    try {
      const shown = plain(value, 0, []);
      return typeof shown === 'string' ? shown : JSON.stringify(shown);
    } catch {
      try {
        return String(value);
      } catch {
        return Object.prototype.toString.call(value);
      }
    }
  };
  for (const level of ['log', 'info', 'warn', 'error']) {
    const original = console[level];
    console[level] = (...args) => {
      original.apply(console, args);
      send(level, args.map(show).join(' '));
    };
  }
  addEventListener('error', (event) => send('error', event.message || show(event.error)));
  addEventListener('unhandledrejection', (event) =>
    send('error', 'Uncaught (in promise) ' + show(event.reason)),
  );
})();`;
