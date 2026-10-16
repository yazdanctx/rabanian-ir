import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The HTML Editor's Preview and console strip (/editor) in a real (headless)
 * Chrome. The sandboxed Preview is out of process, so its facts are read
 * through the parent: its `srcdoc`, and what the learner's JS logs to the
 * console strip. Skipped where no Chrome is installed (set CHROME_PATH).
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

  it('is a frame titled «پیش‌نمایش», sandboxed to scripts only', async () => {
    const frame = await tab.evaluate<{ sandbox: string | null; title: string } | null>(`(() => {
      ${lib}
      const f = frame();
      return f && { sandbox: f.getAttribute('sandbox'), title: f.title };
    })()`);
    expect(frame).toEqual({ sandbox: 'allow-scripts', title: 'پیش‌نمایش' });
  });

  it('renders what is typed in the HTML tab, rebuilt shortly after typing stops', async () => {
    const shown = await tab.evaluate<boolean>(`(async () => {
      ${lib}
      await setFiles({ html: '<h1>سلام</h1>' });
      return waitFor(() => frame().srcdoc.includes('<body><h1>سلام</h1>'), 1500);
    })()`);
    expect(shown).toBe(true);
  });

  /** The learner's JS: logs the heading's direction, font stack and font load status. */
  const reportHeading = `
    const h1 = document.querySelector('h1');
    document.fonts.load('700 32px IRANYekanXFaNum', h1.textContent).then((faces) => {
      const style = getComputedStyle(h1);
      console.log(style.direction, style.fontFamily, faces.map((face) => face.status).join());
    });`;

  it('renders <h1>سلام</h1> right to left in Yekan, without the learner writing dir', async () => {
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
});
