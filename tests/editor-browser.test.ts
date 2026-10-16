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

    it('moves selection and focus with the arrow keys in RTL reading order, wrapping, plus Home/End', async () => {
      const path = await tab.evaluate<string[]>(`(async () => {
        ${lib}
        tabs()[0].click();
        await waitFor(() => selected() === tabs()[0]);
        tabs()[0].focus();
        const press = async (key) => {
          document.activeElement.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
          );
          await new Promise((r) => setTimeout(r, 50));
          const label = selected().textContent.trim();
          const focused = document.activeElement === selected();
          const shows = panel().getAttribute('aria-labelledby') === selected().id;
          return label + (focused ? '' : ' (not focused)') + (shows ? '' : ' (panel not shown)');
        };
        const path = [];
        // The page is RTL: HTML sits rightmost, so ArrowLeft moves forward.
        for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'End', 'Home']) {
          path.push(await press(key));
        }
        return path;
      })()`);
      expect(path).toEqual(['CSS', 'JS', 'HTML', 'JS', 'JS', 'HTML']);
    });
  });

  describe('action bar, Preview and console strip', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin);
    });
    afterAll(() => tab?.close());

    it('has the three actions, «اجرا» «بازنشانی» «دانلود», as plain buttons', async () => {
      const actions = await tab.evaluate<string[]>(`(() => [
        ...document.querySelectorAll('[data-actions] button'),
      ].map((b) => b.type + ':' + b.textContent.trim()))()`);
      expect(actions).toEqual(['button:اجرا', 'button:بازنشانی', 'button:دانلود']);
    });

    it('has a Preview region named «پیش‌نمایش»', async () => {
      const name = await tab.evaluate<string | null>(`(() => {
        const region = document.querySelector('[data-preview]')?.closest('section');
        const label = region?.getAttribute('aria-labelledby');
        return label ? document.getElementById(label).textContent.trim() : null;
      })()`);
      expect(name).toBe('پیش‌نمایش');
    });

    it('starts the console strip collapsed under «کنسول», and toggles it', async () => {
      const states = await tab.evaluate<string[]>(`(async () => {
        const toggle = document.querySelector('[data-console] button[aria-expanded]');
        const body = document.getElementById(toggle.getAttribute('aria-controls'));
        const state = () =>
          toggle.textContent.trim() + ':' + toggle.getAttribute('aria-expanded') + ':' +
          (body.checkVisibility() ? 'shown' : 'hidden');
        const states = [state()];
        toggle.click();
        await new Promise((r) => setTimeout(r, 50));
        states.push(state());
        toggle.click();
        await new Promise((r) => setTimeout(r, 50));
        states.push(state());
        return states;
      })()`);
      expect(states).toEqual(['کنسول:false:hidden', 'کنسول:true:shown', 'کنسول:false:hidden']);
    });

    it('dresses the Code Pane and Preview cards in palette P: surface, 12px radius, line border', async () => {
      const cards = await tab.evaluate<string[]>(`(() =>
        ['[data-code]', '[data-preview]'].map((hook) => {
          const s = getComputedStyle(document.querySelector(hook).closest('section'));
          return [s.backgroundColor, s.borderRadius, s.borderTopWidth, s.borderTopColor].join(' ');
        }))()`);
      const card = 'rgb(245, 247, 250) 12px 1px rgb(220, 227, 238)';
      expect(cards).toEqual([card, card]);
    });

    it('sets code left-to-right in the code font stack', async () => {
      const style = await tab.evaluate<{ direction: string; fontFamily: string }>(`(() => {
        const s = getComputedStyle(document.querySelector('[role="tabpanel"] textarea'));
        return { direction: s.direction, fontFamily: s.fontFamily };
      })()`);
      expect(style.direction).toBe('ltr');
      expect(style.fontFamily.replace(/["']/g, '')).toBe(
        'JetBrains Mono, IRANYekanXFaNum, ui-monospace, monospace',
      );
    });
  });

  describe.each([
    { width: 1280, columns: true },
    { width: 1024, columns: true },
    { width: 1023, columns: false },
    { width: 390, columns: false },
  ])('layout at $width px', ({ width, columns }) => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin, width);
    });
    afterAll(() => tab?.close());

    const boxes = `(() => {
      const box = (hook) => document.querySelector(hook).closest('section').getBoundingClientRect();
      const code = box('[data-code]');
      const preview = box('[data-preview]');
      return {
        code: { left: code.left, right: code.right, top: code.top, bottom: code.bottom },
        preview: { left: preview.left, right: preview.right, top: preview.top, bottom: preview.bottom },
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    })()`;
    type Box = { left: number; right: number; top: number; bottom: number };

    it(
      columns
        ? 'puts the Code Pane and the Preview side by side, Code Pane on the right'
        : 'stacks the Preview below the Code Pane',
      async () => {
        const { code, preview, overflow } = await tab.evaluate<{
          code: Box;
          preview: Box;
          overflow: number;
        }>(boxes);
        expect(overflow).toBeLessThanOrEqual(0);
        if (columns) {
          expect(code.left).toBeGreaterThan(preview.right);
          expect(code.top).toBe(preview.top);
        } else {
          expect(preview.top).toBeGreaterThan(code.bottom);
          expect(preview.left).toBe(code.left);
          expect(preview.right).toBe(code.right);
        }
      },
    );
  });
});
