import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The HTML Editor shell (/editor) in a real (headless) Chrome: tabs, keyboard,
 * layout. Skipped where no Chrome is installed (set CHROME_PATH).
 */

/** Page-side helpers, prepended to evaluated expressions. */
const lib = `
  const waitFor = async (test, ms = 5000) => {
    const end = performance.now() + ms;
    while (!test()) {
      if (performance.now() > end) return false;
      await new Promise((r) => setTimeout(r, 25));
    }
    return true;
  };
  const tabs = () => [...document.querySelectorAll('[role="tablist"] [role="tab"]')];
  const selected = () => tabs().find((t) => t.getAttribute('aria-selected') === 'true');
  const panel = () => document.querySelector('[role="tabpanel"]');
  const code = () => panel().querySelector('textarea');
`;

/** Opens /editor and waits for the client-only island to render. */
async function openEditor(origin: string, width = 1280): Promise<BrowserPage> {
  const tab = await openPage(`${origin}/editor/`, { width, height: 900, reducedMotion: true });
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => tabs().length > 0);
  })()`);
  if (!ready) throw new Error('the editor island never rendered');
  return tab;
}

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('HTML Editor shell in the browser', () => {
  describe('tabs', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin);
    });
    afterAll(() => tab?.close());

    it('offers HTML, CSS and JS in a tablist, HTML selected, one tab in the Tab order', async () => {
      const state = await tab.evaluate<{
        labels: string[];
        selected: string[];
        tabIndex: number[];
        controls: boolean;
        labelledBy: boolean;
      }>(`(() => {
        ${lib}
        return {
          labels: tabs().map((t) => t.textContent.trim()),
          selected: tabs().map((t) => t.getAttribute('aria-selected')),
          tabIndex: tabs().map((t) => t.tabIndex),
          controls: tabs().every((t) => t.getAttribute('aria-controls') === panel().id),
          labelledBy: panel().getAttribute('aria-labelledby') === selected().id,
        };
      })()`);
      expect(state).toEqual({
        labels: ['HTML', 'CSS', 'JS'],
        selected: ['true', 'false', 'false'],
        tabIndex: [0, -1, -1],
        controls: true,
        labelledBy: true,
      });
    });

    it('switches the Code Pane to the clicked file, keeping what was typed in each', async () => {
      const seen = await tab.evaluate<string[]>(`(async () => {
        ${lib}
        const type = (text) => {
          code().focus();
          document.execCommand('insertText', false, text);
        };
        const pick = async (label) => {
          tabs().find((t) => t.textContent.trim() === label).click();
          await waitFor(() => selected().textContent.trim() === label);
          return selected().textContent.trim() + ':' + code().value;
        };
        type('<h1>سلام دنیا</h1>');
        const seen = [await pick('CSS')];
        type('h1 { color: red }');
        seen.push(await pick('JS'), await pick('HTML'), await pick('CSS'));
        return seen;
      })()`);
      expect(seen).toEqual(['CSS:', 'JS:', 'HTML:<h1>سلام دنیا</h1>', 'CSS:h1 { color: red }']);
    });
  });
});
