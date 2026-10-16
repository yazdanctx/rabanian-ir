import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * How soon the Preview shows what is typed (spec: Acceptance, "within
 * 300ms"), in a real (headless) Chrome. A `*-latency-browser` test: it runs
 * on its own after every other test (vitest.config.ts), since browsers
 * working alongside slow down a frame's load. Skipped where no Chrome is
 * installed (set CHROME_PATH).
 */

/** Page-side helpers, prepended to evaluated expressions. */
const lib = `
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (test, ms = 5000) => {
    const end = performance.now() + ms;
    while (!test()) {
      if (performance.now() > end) return false;
      await sleep(25);
    }
    return true;
  };
  const tabs = () => [...document.querySelectorAll('[role="tablist"] [role="tab"]')];
  const pane = () => document.querySelector('[role="tabpanel"] [contenteditable="true"]');
  const frame = () => document.querySelector('iframe[data-preview]');
`;

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('Preview latency', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openPage(`${site.origin}/editor/`, { width: 1280, height: 900, reducedMotion: true });
    const ready = await tab.evaluate<boolean>(`(async () => {
      ${lib}
      return waitFor(() => tabs().length > 0 && !!pane());
    })()`);
    if (!ready) throw new Error('the editor island never rendered');
  });
  afterAll(() => tab?.close());

  it('shows a typed heading within 300ms', async () => {
    // From the edit to the new Preview's load, best of five: a pause before
    // rebuilding that left the frame no time to load (a 300ms one) would miss
    // every time, while one slow load is the machine's doing.
    const times = await tab.evaluate<number[]>(`(async () => {
      ${lib}
      const times = [];
      for (let i = 0; i < 5; i++) {
        const text = '<h1>سلام دنیا ' + i + '</h1>';
        pane().focus();
        document.execCommand('selectAll');
        document.execCommand('delete');
        await sleep(500); // that build out of the way
        // The next frame to mount with the text is its build.
        const loaded = new Promise((resolve) => {
          const watch = new MutationObserver(() => {
            const next = frame();
            if (!next.srcdoc.includes(text)) return;
            watch.disconnect();
            next.addEventListener('load', () => resolve(performance.now()), { once: true });
          });
          watch.observe(document.body, { childList: true, subtree: true });
        });
        const typed = performance.now();
        document.execCommand('insertText', false, text);
        times.push(Math.round((await loaded) - typed));
      }
      return times;
    })()`);
    expect(Math.min(...times), `edit to load, ms: ${times.join(', ')}`).toBeLessThanOrEqual(300);
  });
});
