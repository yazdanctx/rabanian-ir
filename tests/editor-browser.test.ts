import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STARTER_TEMPLATE } from '../src/components/editor/starterTemplate';
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
  const code = () => panel().querySelector('.cm-content');
  const codeText = () => [...code().querySelectorAll('.cm-line')].map((l) => l.textContent).join('\\n');
`;

/** Opens /editor and waits for the client-only island to render. */
async function openEditor(origin: string, width = 1280, height = 900): Promise<BrowserPage> {
  const tab = await openPage(`${origin}/editor/`, { width, height, reducedMotion: true });
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => tabs().length > 0 && code());
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
      const pick = (label: string) =>
        tab.evaluate<string>(`(async () => {
          ${lib}
          tabs().find((t) => t.textContent.trim() === ${JSON.stringify(label)}).click();
          await waitFor(() => selected().textContent.trim() === ${JSON.stringify(label)});
          return selected().textContent.trim() + ':' + codeText();
        })()`);
      /** Replaces the shown file's text by typing over all of it. */
      const type = (text: string) =>
        tab.evaluate(`(() => {
          ${lib}
          code().focus();
          document.execCommand('selectAll');
          document.execCommand('insertText', false, ${JSON.stringify(text)});
        })()`);
      await type('<h1>سلام دنیا</h1>');
      const seen = [await pick('CSS')];
      await type('h1 { color: red }');
      seen.push(await pick('JS'), await pick('HTML'), await pick('CSS'));
      expect(seen).toEqual([
        `CSS:${STARTER_TEMPLATE.css}`,
        `JS:${STARTER_TEMPLATE.js}`,
        'HTML:<h1>سلام دنیا</h1>',
        'CSS:h1 { color: red }',
      ]);
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

  describe('Farsi chrome', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin);
      // Open the console strip, so «پاک کردن» is on the page too.
      await tab.evaluate(`document.querySelector('[data-console] button[aria-expanded]').click()`);
    });
    afterAll(() => tab?.close());

    /**
     * Every piece of the page's own text, shown (with the font it is set in)
     * or spoken (accessible names, no font). Code, the Preview and console
     * messages are the visitor's, not chrome.
     */
    const chrome = () =>
      tab.evaluate<{ text: string; font: string | null }[]>(`(() => {
        const visitors = '.cm-editor, iframe, [data-console] li';
        const font = (el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '');
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let node; (node = walker.nextNode()); ) {
          const el = node.parentElement;
          if (!node.data.trim() || el.closest(visitors) || el.closest('script, style, [hidden]')) continue;
          out.push({ text: node.data.trim(), font: font(el) });
        }
        for (const el of document.querySelectorAll('[aria-label], [title], [alt]')) {
          for (const name of ['aria-label', 'title', 'alt']) {
            const text = el.getAttribute(name)?.trim();
            if (text) out.push({ text, font: null });
          }
        }
        return out;
      })()`);

    it("is a right-to-left Farsi page whose every string is Farsi, the languages' names aside", async () => {
      expect(await tab.evaluate(`document.documentElement.lang + ' ' + document.documentElement.dir`)).toBe('fa rtl');
      const strings = (await chrome()).map(({ text }) => text);
      expect(strings).toContain('پاک کردن');
      // Tab labels stay Latin: they are the languages' names (spec: Layout).
      expect(strings.filter((text) => !/[؀-ۿ]/.test(text))).toEqual(['HTML', 'CSS', 'JS']);
    });

    it('sets all of it in IRANYekanXFaNum, so any number in it reads in Persian digits', async () => {
      const shown = (await chrome()).filter(({ font }) => font);
      expect([...new Set(shown.map(({ font }) => font))]).toEqual(['IRANYekanXFaNum']);
    });
  });

  describe('action bar, Preview and console strip', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin);
    });
    afterAll(() => tab?.close());

    it('has the three actions, «بازنشانی» «دانلود» «اجرا», as plain buttons, each with a decorative icon', async () => {
      const actions = await tab.evaluate<string[]>(`(() => [
        ...document.querySelectorAll('[data-actions] button'),
      ].map((b) => [b.type, b.textContent.trim(), b.querySelector('svg')?.getAttribute('aria-hidden')].join(':')))()`);
      expect(actions).toEqual(['button:بازنشانی:true', 'button:دانلود:true', 'button:اجرا:true']);
    });

    it('links home from the bar: a house icon named «صفحهٔ اصلی», just right of the actions', async () => {
      const home = await tab.evaluate<{ label: string; title: string; icon: string; rightOfReset: boolean } | null>(`(() => {
        const link = document.querySelector('[data-actions] a[href="/"]');
        if (!link) return null;
        const reset = [...document.querySelectorAll('[data-actions] button')].find((b) => b.textContent.trim() === 'بازنشانی');
        return {
          label: link.getAttribute('aria-label'),
          title: link.getAttribute('title'),
          icon: link.querySelector('svg')?.getAttribute('aria-hidden'),
          rightOfReset: link.getBoundingClientRect().left >= reset.getBoundingClientRect().right,
        };
      })()`);
      expect(home).toEqual({ label: 'صفحهٔ اصلی', title: 'صفحهٔ اصلی', icon: 'true', rightOfReset: true });
    });

    it('puts «اجرا» at the far left of the bar', async () => {
      const lefts = await tab.evaluate<Record<string, number>>(`(() => Object.fromEntries(
        [...document.querySelectorAll('[data-actions] button')].map((b) => [b.textContent.trim(), b.getBoundingClientRect().left]),
      ))()`);
      expect(lefts['اجرا']).toBeLessThan(lefts['دانلود']);
      expect(lefts['دانلود']).toBeLessThan(lefts['بازنشانی']);
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

    it('heads the Code Pane and the Preview with palette P bars: surface, a line beneath', async () => {
      const bars = await tab.evaluate<string[]>(`(() =>
        [document.querySelector('[role="tablist"]'), document.querySelector('[data-actions]').parentElement].map((bar) => {
          const s = getComputedStyle(bar);
          return [s.backgroundColor, s.borderBottomWidth, s.borderBottomStyle, s.borderBottomColor].join(' ');
        }))()`);
      const bar = 'rgb(245, 247, 250) 1px solid rgb(220, 227, 238)';
      expect(bars).toEqual([bar, bar]);
    });

    it('sets code left-to-right in the code font stack, every character as typed (no ligatures)', async () => {
      const style = await tab.evaluate<{ direction: string; fontFamily: string; ligatures: string }>(`(() => {
        const s = getComputedStyle(document.querySelector('[role="tabpanel"] .cm-content'));
        return { direction: s.direction, fontFamily: s.fontFamily, ligatures: s.fontVariantLigatures };
      })()`);
      expect(style.direction).toBe('ltr');
      // JetBrains Mono would draw `=>` as an arrow and `<!--` as one glyph.
      expect(style.ligatures).toBe('none');
      expect(style.fontFamily.replace(/["']/g, '')).toBe(
        'JetBrains Mono, IRANYekanXFaNum, ui-monospace, monospace',
      );
    });
  });

  describe.each([
    { width: 1280, height: 900, columns: true },
    { width: 1024, height: 768, columns: true },
    { width: 1023, height: 768, columns: false },
    { width: 390, height: 844, columns: false },
  ])('layout at $width×$height px', ({ width, height, columns }) => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin, width, height);
    });
    afterAll(() => tab?.close());

    /** The editor's box against the viewport's, and how far the page itself scrolls. */
    const fit = `(() => {
      const { top, left, bottom, right } = document.querySelector('[data-editor]').getBoundingClientRect();
      scrollTo(0, 10_000);
      const scrolled = scrollY;
      scrollTo(0, 0);
      return {
        editor: [top, left, bottom, right],
        screen: [0, 0, innerHeight, innerWidth],
        overflow: document.documentElement.scrollHeight - innerHeight,
        scrolled,
      };
    })()`;
    type Fit = { editor: number[]; screen: number[]; overflow: number; scrolled: number };

    it('fills the screen exactly, and the page itself never scrolls', async () => {
      const { editor, screen, overflow, scrolled } = await tab.evaluate<Fit>(fit);
      expect(editor).toEqual(screen);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(scrolled).toBe(0);
    });

    it('scrolls a long file and a long console inside themselves, not the page', async () => {
      const inner = await tab.evaluate<{ code: boolean; log: boolean }>(`(async () => {
        ${lib}
        tabs()[2].click();
        await waitFor(() => selected() === tabs()[2]);
        code().focus();
        document.execCommand('selectAll');
        const lines = Array.from({ length: 300 }, (_, i) => '// ' + i).join('\\n');
        document.execCommand('insertText', false, 'for (let i = 0; i < 100; i++) console.log(i);\\n' + lines);
        const toggle = document.querySelector('[data-console] button[aria-expanded]');
        if (toggle.getAttribute('aria-expanded') === 'false') toggle.click();
        await waitFor(() => document.querySelectorAll('[data-console] li').length === 100);
        await new Promise((r) => setTimeout(r, 300));
        const scrolls = (el) => el.scrollHeight > el.clientHeight + 1;
        return {
          code: scrolls(panel().querySelector('.cm-scroller')),
          log: scrolls(document.querySelector('[data-console] ol, [data-console] ul')),
        };
      })()`);
      expect(inner).toEqual({ code: true, log: true });
      const { editor, screen, overflow, scrolled } = await tab.evaluate<Fit>(fit);
      expect(editor).toEqual(screen);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(scrolled).toBe(0);
    });

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
        : 'stacks the Code Pane below the Preview',
      async () => {
        const { code, preview, overflow } = await tab.evaluate<{
          code: Box;
          preview: Box;
          overflow: number;
        }>(boxes);
        expect(overflow).toBeLessThanOrEqual(0);
        // Edge to edge: the panes meet at a hairline.
        if (columns) {
          expect(code.left).toBeGreaterThanOrEqual(preview.right);
          expect(code.top).toBe(preview.top);
        } else {
          expect(code.top).toBeGreaterThanOrEqual(preview.bottom);
          expect(preview.left).toBe(code.left);
          expect(preview.right).toBe(code.right);
        }
      },
    );
  });

  describe.each([
    { width: 1280, height: 900, axis: 'horizontal', key: 'rabanian.editor.layout.horizontal' },
    { width: 390, height: 844, axis: 'vertical', key: 'rabanian.editor.layout.vertical' },
  ])('resizable panes at $width px', ({ width, height, axis, key }) => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openEditor(site.origin, width, height);
    });
    afterAll(() => tab?.close());

    const horizontal = axis === 'horizontal';
    /** The Code Pane's size along the axis the separator moves on. */
    const codeSize = () =>
      tab.evaluate<number>(`(() => {
        const box = document.querySelector('[data-code]').getBoundingClientRect();
        return Math.round(${horizontal ? 'box.width' : 'box.height'});
      })()`);
    const separator = () =>
      tab.evaluate<{ x: number; y: number; label: string; orientation: string; tabIndex: number }>(`(() => {
        const el = document.querySelector('[role="separator"]');
        const box = el.getBoundingClientRect();
        return {
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
          label: el.getAttribute('aria-label'),
          orientation: el.getAttribute('aria-orientation'),
          tabIndex: el.tabIndex,
        };
      })()`);

    it('has a named, focusable separator between the Preview and the Code Pane', async () => {
      const { label, orientation, tabIndex } = await separator();
      expect({ label, orientation, tabIndex }).toEqual({
        label: 'اندازهٔ پیش‌نمایش و کد',
        orientation: horizontal ? 'vertical' : 'horizontal',
        tabIndex: 0,
      });
    });

    it('turns black (ink) while hovered', async () => {
      const { x, y } = await separator();
      const color = () =>
        tab.evaluate<string>(`getComputedStyle(document.querySelector('[role="separator"]')).backgroundColor`);
      expect(await color()).toBe('rgb(220, 227, 238)'); // line
      await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await tab.evaluate(`new Promise((r) => setTimeout(r, 250))`); // past the 150ms colour change
      expect(await color()).toBe('rgb(5, 8, 22)');
      await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 200, y: y + 200 });
    });

    it('resizes the panes by dragging the separator, and remembers it after a reload', async () => {
      const before = await codeSize();
      const { x, y } = await separator();
      // Toward the Preview, over its frame: the Code Pane grows by what the separator moved.
      const [dx, dy] = horizontal ? [-150, 0] : [0, -120];
      await tab.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await tab.evaluate(`new Promise((r) => requestAnimationFrame(r))`); // a hand pauses between press and move
      for (let step = 1; step <= 5; step++) {
        await tab.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: x + (dx * step) / 5,
          y: y + (dy * step) / 5,
          button: 'left',
          buttons: 1,
        });
      }
      await tab.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + dx, y: y + dy, button: 'left', clickCount: 1 });
      const after = await codeSize();
      expect(after - before).toBeGreaterThan(Math.abs(dx || dy) - 10);
      expect(after - before).toBeLessThan(Math.abs(dx || dy) + 10);

      await tab.evaluate(`new Promise((r) => setTimeout(r, 300))`);
      expect(await tab.evaluate(`localStorage.getItem('react-resizable-panels:${key}') !== null`)).toBe(true);
      await tab.reload();
      await tab.evaluate(`(async () => { ${lib} await waitFor(() => tabs().length > 0 && code()); })()`);
      expect(Math.abs((await codeSize()) - after)).toBeLessThanOrEqual(2);
    });

    it('resizes from the keyboard too: arrow keys move a focused separator', async () => {
      const before = await codeSize();
      await tab.evaluate(`document.querySelector('[role="separator"]').focus()`);
      // Toward the Preview, as above: left, or up.
      for (let i = 0; i < 3; i++) await tab.press(horizontal ? 'ArrowLeft' : 'ArrowUp');
      expect(await codeSize()).toBeGreaterThan(before);
    });
  });

  it('goes back to the home page from the home link', async () => {
    const tab = await openEditor(site.origin);
    try {
      const { x, y } = await tab.evaluate<{ x: number; y: number }>(`(() => {
        const box = document.querySelector('[data-actions] a[href="/"]').getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      })()`);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await tab.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
      // Asked from here, not the page: the page goes away when it navigates.
      let path = '';
      for (let i = 0; i < 50 && path !== '/'; i++) {
        await new Promise((r) => setTimeout(r, 100));
        path = await tab.evaluate<string>('location.pathname').catch(() => '');
      }
      expect(path).toBe('/');
    } finally {
      await tab.close();
    }
  });

  it('turns side by side into stacked when the window narrows, keeping the files', async () => {
    const tab = await openEditor(site.origin, 1280, 900);
    try {
      await tab.evaluate(`(async () => {
        ${lib}
        code().focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, '<p>هنوز اینجاست</p>');
      })()`);
      await tab.send('Emulation.setDeviceMetricsOverride', { width: 800, height: 900, deviceScaleFactor: 1, mobile: false });
      const after = await tab.evaluate<{ stacked: boolean; text: string }>(`(async () => {
        ${lib}
        await new Promise((r) => setTimeout(r, 300));
        const box = (hook) => document.querySelector(hook).closest('section').getBoundingClientRect();
        return { stacked: box('[data-code]').top >= box('[data-preview]').bottom, text: codeText() };
      })()`);
      expect(after).toEqual({ stacked: true, text: '<p>هنوز اینجاست</p>' });
    } finally {
      await tab.close();
    }
  });

  describe('on a phone, typing with the on-screen keyboard', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/editor/`, { width: 390, height: 844, mobile: true, reducedMotion: true });
      await tab.evaluate(`(async () => { ${lib} await waitFor(() => tabs().length > 0 && code()); })()`);
    });
    afterAll(() => tab?.close());

    /** Where things are on screen, top and bottom. */
    const boxes = () =>
      tab.evaluate<Record<'viewport' | 'tabs' | 'pane' | 'caret', { top: number; bottom: number }>>(`(async () => {
        ${lib}
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const box = (el) => { const { top, bottom } = el.getBoundingClientRect(); return { top, bottom }; };
        return {
          viewport: { top: 0, bottom: visualViewport.height },
          tabs: box(document.querySelector('[role="tablist"]')),
          pane: box(panel().querySelector('.cm-scroller')),
          caret: box(panel().querySelector('.cm-cursor-primary')),
        };
      })()`);
    const within = (inner: { top: number; bottom: number }, outer: { top: number; bottom: number }) =>
      inner.top >= outer.top && inner.bottom <= outer.bottom;

    it('keeps the tab bar and the caret in view when the keyboard shrinks the page', async () => {
      // A tap on the lowest line the pane shows.
      const line = await tab.evaluate<{ x: number; y: number }>(`(() => {
        ${lib}
        const pane = panel().querySelector('.cm-scroller').getBoundingClientRect();
        const shown = [...code().querySelectorAll('.cm-line')].filter((l) => l.getBoundingClientRect().bottom <= pane.bottom);
        const box = shown.at(-1).getBoundingClientRect();
        return { x: box.left + 8, y: box.top + box.height / 2 };
      })()`);
      await tab.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [line] });
      await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect(await tab.evaluate(`(async () => { ${lib} return waitFor(() => code().contains(document.activeElement)); })()`)).toBe(true);

      // The keyboard, as browsers that resize the page for it do (Chrome with
      // interactive-widget=resizes-content, and Firefox): 336px less page.
      await tab.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844 - 336, deviceScaleFactor: 1, mobile: true });
      await tab.evaluate(`new Promise((r) => setTimeout(r, 200))`);
      const { viewport, tabs, pane, caret } = await boxes();
      expect(within(tabs, viewport)).toBe(true);
      expect(within(caret, pane)).toBe(true);
      expect(within(caret, viewport)).toBe(true);
    });
  });
});
