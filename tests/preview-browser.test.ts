import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The HTML Editor's Preview and console strip (/editor) in a real (headless)
 * Chrome. Its facts are read through the parent: its `srcdoc`, and what the
 * visitor's JS logs to the console strip. Skipped where no Chrome is installed (set CHROME_PATH).
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
  const pane = () =>
    document.querySelector('[role="tabpanel"] textarea, [role="tabpanel"] [contenteditable="true"]');
  const frame = () => document.querySelector('iframe[data-preview]');
  /** Replaces one file's text, as if typed into its Code Pane. */
  const write = async (label, text) => {
    const tab = tabs().find((t) => t.textContent.trim() === label);
    tab.click();
    await waitFor(() => tab.getAttribute('aria-selected') === 'true');
    pane().focus();
    document.execCommand('selectAll');
    document.execCommand(text ? 'insertText' : 'delete', false, text);
  };
  const setFiles = async ({ html = '', css = '', js = '' }) => {
    await write('HTML', html);
    await write('CSS', css);
    await write('JS', js);
  };
  /** The console strip's entries, oldest first, as "level text". */
  const entries = () =>
    [...document.querySelectorAll('[data-console] li')].map((li) => li.dataset.level + ' ' + li.textContent);
  const button = (label) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
`;

/** Opens /editor and waits for the client-only island to render. */
async function openEditor(origin: string, reducedMotion = true): Promise<BrowserPage> {
  const tab = await openPage(`${origin}/editor/`, { width: 1280, height: 900, reducedMotion });
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => tabs().length > 0 && !!pane());
  })()`);
  if (!ready) throw new Error('the editor island never rendered');
  return tab;
}

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('Preview in the browser', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  it('is a frame titled «پیش‌نمایش», not sandboxed, as in the original tool (ADR-0004)', async () => {
    const frame = await tab.evaluate<{ sandbox: string | null; title: string } | null>(`(() => {
      ${lib}
      const f = frame();
      return f && { sandbox: f.getAttribute('sandbox'), title: f.title };
    })()`);
    expect(frame).toEqual({ sandbox: null, title: 'پیش‌نمایش' });
  });

  it('renders what is typed in the HTML tab, rebuilt shortly after typing stops', async () => {
    const shown = await tab.evaluate<boolean>(`(async () => {
      ${lib}
      await setFiles({ html: '<h1>سلام</h1>' });
      return waitFor(() => frame().srcdoc.includes('<body><h1>سلام</h1>'), 1500);
    })()`);
    expect(shown).toBe(true);
  });

  /** The visitor's JS: logs the heading's direction, font stack and font load status. */
  const reportHeading = `
    const h1 = document.querySelector('h1');
    document.fonts.load('700 32px IRANYekanXFaNum', h1.textContent).then((faces) => {
      const style = getComputedStyle(h1);
      console.log(style.direction, style.fontFamily, faces.map((face) => face.status).join());
    });`;

  it('renders <h1>سلام</h1> right to left in Yekan, without the visitor writing dir', async () => {
    const report = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await setFiles({ html: '<h1>سلام</h1>', js: ${JSON.stringify(reportHeading)} });
      await waitFor(() => entries().length > 0);
      return entries();
    })()`);
    expect(report).toEqual(['log rtl IRANYekanXFaNum, system-ui loaded']);
  });

  it('turns left to right with html { direction: ltr } in the CSS tab', async () => {
    const report = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await setFiles({ html: '<h1>سلام</h1>', css: 'html { direction: ltr }', js: ${JSON.stringify(reportHeading)} });
      await waitFor(() => entries().some((e) => e.includes('ltr')));
      return entries();
    })()`);
    expect(report).toEqual(['log ltr IRANYekanXFaNum, system-ui loaded']);
  });

  it('starts each build with an empty console', async () => {
    const report = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await setFiles({ js: "console.log('one')" });
      await waitFor(() => entries().includes('log one'));
      await write('JS', "console.log('two')");
      await waitFor(() => entries().includes('log two'));
      await sleep(100);
      return entries();
    })()`);
    expect(report).toEqual(['log two']);
  });

  it('«اجرای کد» reruns the page at once, edits included, without waiting for the pause', async () => {
    const runs = await tab.evaluate<{ rerun: boolean; log: string[]; edited: boolean }>(`(async () => {
      ${lib}
      // Something in the HTML tab: with none, «اجرای کد» asks for it instead.
      await setFiles({ html: '<p>سلام</p>', js: "console.log('ran')" });
      await waitFor(() => entries().includes('log ran'));
      const before = frame();
      button('اجرای کد').click();
      const rerun = await waitFor(() => frame() !== before && entries().includes('log ran'), 1000);
      const log = entries();
      await write('JS', "console.log('edited')");
      button('اجرای کد').click();
      await sleep(50);
      return { rerun, log, edited: frame().srcdoc.includes("console.log('edited')") };
    })()`);
    expect(runs).toEqual({ rerun: true, log: ['log ran'], edited: true });
  });
});

describe.skipIf(!chromePath)('console strip in the browser', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  it("lists the Preview's console output and uncaught errors, newest last", async () => {
    const js = `
      console.log('x');
      console.info('سلام', 42, true, null, undefined);
      console.warn({ a: { b: { c: { d: 1 } } }, list: [1, 'دو'] });
      console.error(new TypeError('bad input'), document.querySelector('h1'));
      Promise.reject(new Error('rejected'));
      notDefined();`;
    const listed = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await setFiles({ html: '<h1 id="title">سلام</h1>', js: ${JSON.stringify(js)} });
      await waitFor(() => entries().length >= 6);
      await sleep(200);
      return entries();
    })()`);
    expect(listed).toEqual([
      'log x',
      'info سلام 42 true null undefined',
      'warn {"a":{"b":{"c":"{…}"}},"list":[1,"دو"]}',
      'error TypeError: bad input <h1 id="title">…</h1>',
      'error Uncaught ReferenceError: notDefined is not defined',
      'error Uncaught (in promise) Error: rejected',
    ]);
  });

  it("lists what the HTML tab's own scripts log and throw while the page loads", async () => {
    const html = `<script>console.log('from html')</script>
      <h1>سلام</h1>
      <script>throw new Error('on load')</script>`;
    const listed = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await setFiles({ html: ${JSON.stringify(html)}, js: "console.log('from js')" });
      await waitFor(() => entries().includes('log from js'));
      await sleep(200);
      return entries();
    })()`);
    expect(listed).toEqual(['log from html', 'error Uncaught Error: on load', 'log from js']);
  });

  it('runs JS and CSS holding «</script>» and «</style>» whole', async () => {
    const listed = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await setFiles({
        html: '<p>سلام</p>',
        css: 'body::after { content: "</style>" }',
        js: "console.log('</script>', getComputedStyle(document.body, '::after').content)",
      });
      await waitFor(() => entries().some((entry) => entry.includes('</script>')));
      await sleep(200);
      return entries();
    })()`);
    expect(listed).toEqual(['log </script> "</style>"']);
  });

  it('ignores messages from the editor page itself, from other frames, and untagged ones', async () => {
    const listed = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      const forged = (text) => ({ source: 'rabanian-editor', level: 'error', text });
      postMessage(forged('from the editor page'), '*');
      const other = document.createElement('iframe');
      other.setAttribute('sandbox', 'allow-scripts');
      other.srcdoc = '<script>parent.postMessage(' + JSON.stringify(forged('from another frame')) + ", '*')<" + '/script>';
      const loaded = new Promise((resolve) => (other.onload = resolve));
      document.body.append(other);
      await loaded;
      await setFiles({
        js: "parent.postMessage({ level: 'error', text: 'untagged' }, '*'); console.log('from the Preview');",
      });
      await waitFor(() => entries().length > 0);
      await sleep(300);
      postMessage(forged('from the editor page, later'), '*');
      await sleep(200);
      other.remove();
      return entries();
    })()`);
    expect(listed).toEqual(['log from the Preview']);
  });

  it('keeps the newest 500 entries when the Preview logs more', async () => {
    const kept = await tab.evaluate<{ count: number; first: string; last: string }>(`(async () => {
      ${lib}
      await setFiles({ js: 'for (let i = 1; i <= 600; i++) console.log(i)' });
      await waitFor(() => entries().at(-1) === 'log 600');
      const list = entries();
      return { count: list.length, first: list[0], last: list.at(-1) };
    })()`);
    expect(kept).toEqual({ count: 500, first: 'log 101', last: 'log 600' });
  });

  it('empties with «پاک کردن» once opened', async () => {
    const steps = await tab.evaluate<string[][]>(`(async () => {
      ${lib}
      await setFiles({ js: "console.log('a'); console.log('b')" });
      await waitFor(() => entries().length === 2);
      const steps = [entries()];
      document.querySelector('[data-console] button[aria-expanded]').click();
      await waitFor(() => !!button('پاک کردن'));
      button('پاک کردن').click();
      await sleep(50);
      steps.push(entries());
      return steps;
    })()`);
    expect(steps).toEqual([['log a', 'log b'], []]);
  });

  it('counts its entries beside «کنسول», in Persian digits, while collapsed too', async () => {
    /** The toggle as seen and as read out: its label, the count and its font and visibility, its name. */
    const toggle = async () => {
      const shown = await tab.evaluate<{
        expanded: string;
        label: string;
        count: string | null;
        font: string | null;
        visible: boolean;
      }>(`(() => {
        const toggle = document.querySelector('[data-console] button[aria-expanded]');
        const walker = document.createTreeWalker(toggle, NodeFilter.SHOW_TEXT);
        let count = null;
        for (let node; (node = walker.nextNode()); ) if (/\\d/.test(node.data)) count = node.parentElement;
        return {
          expanded: toggle.getAttribute('aria-expanded'),
          label: toggle.textContent.replace(/\\d+/, '').trim(),
          count: count && count.textContent,
          font: count && getComputedStyle(count).fontFamily.split(',')[0].replace(/["']/g, ''),
          visible: !!count?.checkVisibility(),
        };
      })()`);
      const { root } = await tab.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await tab.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '[data-console] button[aria-expanded]',
      });
      const { nodes } = await tab.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
      return { ...shown, name: nodes[0].name.value };
    };
    await tab.send('DOM.enable');
    await tab.send('Accessibility.enable');
    await tab.evaluate(`(async () => {
      ${lib}
      const toggle = document.querySelector('[data-console] button[aria-expanded]');
      if (toggle.getAttribute('aria-expanded') === 'true') toggle.click();
      await setFiles({ js: "console.log('a'); console.warn('b'); console.error('c')" });
      await waitFor(() => entries().join() === 'log a,warn b,error c');
    })()`);
    // ASCII in the DOM; IRANYekanXFaNum draws it as «۳» (ADR-0002).
    expect(await toggle()).toEqual({
      expanded: 'false',
      label: 'کنسول',
      count: '3',
      font: 'IRANYekanXFaNum',
      visible: true,
      name: 'کنسول، 3 پیام',
    });
    await tab.evaluate(`(async () => {
      ${lib}
      document.querySelector('[data-console] button[aria-expanded]').click();
      await waitFor(() => !!button('پاک کردن'));
      button('پاک کردن').click();
      await sleep(50);
    })()`);
    expect(await toggle()).toEqual({
      expanded: 'true',
      label: 'کنسول',
      count: null,
      font: null,
      visible: false,
      name: 'کنسول',
    });
  });

  it('colors each level, warnings and errors in tones that pass AA on the strip', async () => {
    const colors = await tab.evaluate<
      Record<string, { color: string; onLog: number; onSurface: number }>
    >(`(async () => {
      ${lib}
      await setFiles({ js: "console.log('l'); console.info('i'); console.warn('w'); console.error('e')" });
      await waitFor(() => entries().length === 4);
      const toggle = document.querySelector('[data-console] button[aria-expanded]');
      if (toggle.getAttribute('aria-expanded') === 'false') toggle.click();
      await sleep(50);
      const rgb = (css) => css.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number);
      const luminance = (css) => {
        const [r, g, b] = rgb(css).map((v) => v / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const contrast = (a, b) => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
      };
      const background = (el) => {
        for (; el; el = el.parentElement) {
          const bg = getComputedStyle(el).backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)') return bg;
        }
        return 'rgb(255, 255, 255)';
      };
      const surface = 'rgb(241, 245, 249)';
      return Object.fromEntries(
        [...document.querySelectorAll('[data-console] li')].map((li) => {
          const color = getComputedStyle(li).color;
          return [li.dataset.level, { color, onLog: contrast(color, background(li)), onSurface: contrast(color, surface) }];
        }),
      );
    })()`);
    const ink = 'rgb(15, 23, 42)';
    expect(colors.log.color).toBe(ink);
    expect(colors.info.color).toBe(ink);
    const [r, g, b] = colors.error.color.match(/\d+/g)!.map(Number);
    expect(r).toBeGreaterThan(2 * Math.max(g, b)); // a red
    expect(colors.warn.color).not.toBe(ink);
    expect(colors.warn.color).not.toBe(colors.error.color);
    for (const level of ['warn', 'error']) {
      expect(colors[level].onLog).toBeGreaterThanOrEqual(4.5);
      expect(colors[level].onSurface).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/** Toggles the console strip twice, sampling its body's height as it goes. */
const toggleTwice = `(async () => {
  ${lib}
  await setFiles({ js: "console.log('a'); console.log('b'); console.log('c')" });
  await waitFor(() => entries().length === 3);
  const toggle = document.querySelector('[data-console] button[aria-expanded]');
  const body = document.getElementById(toggle.getAttribute('aria-controls'));
  const sample = async () => {
    toggle.click();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const [animation] = body.getAnimations();
    const during = {
      animated: !!animation,
      duration: animation ? Math.round(animation.effect.getComputedTiming().duration) : 0,
      height: body.getBoundingClientRect().height,
    };
    await sleep(400);
    return { during, after: { shown: body.checkVisibility(), height: body.getBoundingClientRect().height, animated: body.getAnimations().length > 0 } };
  };
  const opening = await sample();
  const closing = await sample();
  return { opening, closing };
})()`;
type Toggle = {
  during: { animated: boolean; duration: number; height: number };
  after: { shown: boolean; height: number; animated: boolean };
};

describe.skipIf(!chromePath)('console strip motion', () => {
  it('springs open and closed in about 200ms', async () => {
    const tab = await openEditor(site.origin, false);
    try {
      const { opening, closing } = await tab.evaluate<{ opening: Toggle; closing: Toggle }>(toggleTwice);
      const full = opening.after.height;
      expect(full).toBeGreaterThan(90);
      expect(opening.during.animated).toBe(true);
      expect(opening.during.duration).toBe(200);
      expect(opening.during.height).toBeGreaterThan(0);
      expect(opening.during.height).toBeLessThan(full);
      expect(opening.after).toEqual({ shown: true, height: full, animated: false });
      expect(closing.during.animated).toBe(true);
      expect(closing.during.duration).toBe(200);
      expect(closing.during.height).toBeGreaterThan(0);
      expect(closing.during.height).toBeLessThan(full);
      expect(closing.after).toEqual({ shown: false, height: 0, animated: false });
    } finally {
      await tab.close();
    }
  });

  it('opens and closes at once under reduced motion', async () => {
    const tab = await openEditor(site.origin, true);
    try {
      const { opening, closing } = await tab.evaluate<{ opening: Toggle; closing: Toggle }>(toggleTwice);
      const full = opening.after.height;
      expect(full).toBeGreaterThan(90);
      expect(opening.during).toEqual({ animated: false, duration: 0, height: full });
      expect(opening.after).toEqual({ shown: true, height: full, animated: false });
      expect(closing.during).toEqual({ animated: false, duration: 0, height: 0 });
      expect(closing.after).toEqual({ shown: false, height: 0, animated: false });
    } finally {
      await tab.close();
    }
  });
});
