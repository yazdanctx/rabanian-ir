import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * What the HTML Editor took over from Amin's original HTML tool, whose videos
 * name its buttons: «تمام‌صفحه پیش‌نمایش» and «خروج از تمام‌صفحه», the status
 * messages after «اجرای کد» and «دانلود index.html», a Full Page pasted and
 * run as it is, an unsandboxed Preview, and the empty box's hint. In a real
 * (headless) Chrome; skipped where none is installed (set CHROME_PATH).
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
  const selected = () => tabs().find((t) => t.getAttribute('aria-selected') === 'true');
  const content = () => document.querySelector('[role="tabpanel"] .cm-content');
  const codeText = () => [...content().querySelectorAll('.cm-line')].map((l) => l.textContent).join('\\n');
  const pick = async (label) => {
    tabs().find((t) => t.textContent.trim() === label).click();
    await waitFor(() => selected().textContent.trim() === label);
  };
  const write = async (label, text) => {
    await pick(label);
    content().focus();
    document.execCommand('selectAll');
    document.execCommand(text ? 'insertText' : 'delete', false, text);
  };
  /** Pastes \`text\` into the Code Pane at the caret, as Ctrl+V would. */
  const paste = (text) => {
    const data = new DataTransfer();
    data.setData('text/plain', text);
    content().dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  };
  const frame = () => document.querySelector('iframe[data-preview]');
  const button = (label) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
  const status = () => document.querySelector('[data-status]');
  /** The status message while one is up, else null. */
  const message = () => (status().hasAttribute('data-shown') ? status().textContent.trim() : null);
  const entries = () =>
    [...document.querySelectorAll('[data-console] li')].map((li) => li.dataset.level + ' ' + li.textContent);
`;

async function openEditor(origin: string, width = 1280, height = 900): Promise<BrowserPage> {
  const tab = await openPage(`${origin}/editor/`, { width, height, reducedMotion: true, mobile: width < 600 });
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => tabs().length > 0 && !!content());
  })()`);
  if (!ready) throw new Error('the editor island never rendered');
  return tab;
}

/** A page as an AI hands it over: English, left to right, its own style and script. */
const fullPage = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="UTF-8">',
  '  <title>My page</title>',
  '  <style>body { margin: 0 } h1 { padding: 24px }</style>',
  '</head>',
  '<body>',
  '  <h1>Hello</h1>',
  "  <script>console.log('mine')</script>",
  '</body>',
  '</html>',
].join('\n');

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('«تمام‌صفحه پیش‌نمایش»', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  /** The Preview pane's box, the bar's buttons, where focus is, and what is out of reach. */
  const state = () =>
    tab.evaluate<Record<string, unknown>>(`(() => {
      const pane = document.querySelector('[data-preview]').closest('section');
      const box = pane.getBoundingClientRect();
      return {
        box: [box.left, box.top, box.width, box.height].join(' '),
        buttons: [...pane.querySelectorAll('[data-actions] button')].map((b) => b.textContent.trim()),
        focus: document.activeElement.textContent.trim(),
        inert: ['[data-code]', '[role="separator"]', '[data-console]'].map((s) => !!document.querySelector(s).closest('[inert]')),
      };
    })()`);

  it('lays the Preview over the whole screen, frame and page kept, «خروج از تمام‌صفحه» focused', async () => {
    const kept = await tab.evaluate<boolean>(`(async () => {
      ${lib}
      const before = frame();
      frame().contentDocument.body.dataset.mark = 'kept';
      button('تمام‌صفحه پیش‌نمایش').click();
      await sleep(100);
      return frame() === before && frame().contentDocument.body.dataset.mark === 'kept';
    })()`);
    expect(kept).toBe(true);
    expect(await state()).toEqual({
      box: '0 0 1280 900',
      buttons: ['خروج از تمام‌صفحه'],
      focus: 'خروج از تمام‌صفحه',
      inert: [true, true, true],
    });
  });

  it('comes back with «خروج از تمام‌صفحه», focus on «تمام‌صفحه پیش‌نمایش»', async () => {
    await tab.evaluate(`(async () => {
      ${lib}
      button('خروج از تمام‌صفحه').click();
      await sleep(100);
    })()`);
    const back = await state();
    expect(back.box).not.toBe('0 0 1280 900');
    expect(back).toMatchObject({ focus: 'تمام‌صفحه پیش‌نمایش', inert: [false, false, false] });
    expect(back.buttons).toHaveLength(4);
  });

  it('comes back with Escape too', async () => {
    await tab.evaluate(`(async () => {
      ${lib}
      button('تمام‌صفحه پیش‌نمایش').click();
      await sleep(100);
    })()`);
    await tab.press('Escape');
    await tab.evaluate(`new Promise((r) => setTimeout(r, 100))`);
    expect(await state()).toMatchObject({ focus: 'تمام‌صفحه پیش‌نمایش', inert: [false, false, false] });
  });
});

describe.skipIf(!chromePath)('status messages', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
    await tab.send('Browser.setDownloadBehavior', { behavior: 'deny' });
  });
  afterAll(() => tab?.close());

  it('says «کد با موفقیت اجرا شد.» after «اجرای کد», in a polite live region', async () => {
    const said = await tab.evaluate<{ role: string | null; text: string | null }>(`(async () => {
      ${lib}
      button('اجرای کد').click();
      await waitFor(() => message());
      return { role: status().getAttribute('role'), text: message() };
    })()`);
    expect(said).toEqual({ role: 'status', text: 'کد با موفقیت اجرا شد.' });
  });

  it('says «فایل index.html با موفقیت دانلود شد.» after «دانلود index.html»', async () => {
    const said = await tab.evaluate<string | null>(`(async () => {
      ${lib}
      button('دانلود index.html').click();
      await waitFor(() => message()?.includes('دانلود'));
      return message();
    })()`);
    expect(said).toBe('فایل index.html با موفقیت دانلود شد.');
  });

  it('goes once the files change, and by itself after a few seconds', async () => {
    const gone = await tab.evaluate<{ onEdit: string | null; later: string | null }>(`(async () => {
      ${lib}
      button('اجرای کد').click();
      await waitFor(() => message());
      await write('JS', "console.log('edited')");
      await sleep(50);
      const onEdit = message();
      button('اجرای کد').click();
      await waitFor(() => message());
      await sleep(4300);
      return { onEdit, later: message() };
    })()`);
    expect(gone).toEqual({ onEdit: null, later: null });
  }, 15_000);

  it('asks for HTML first, in the error red, when the HTML tab is empty: nothing runs or downloads', async () => {
    const asked = await tab.evaluate<Record<string, unknown>>(`(async () => {
      ${lib}
      await write('HTML', '');
      await sleep(400);
      const before = frame();
      button('اجرای کد').click();
      await waitFor(() => message());
      const run = message();
      const color = getComputedStyle(status().querySelector('[data-tone]')).color;
      await sleep(50);
      const rerun = frame() !== before;
      button('دانلود index.html').click();
      await sleep(50);
      return { run, color, rerun, download: message() };
    })()`);
    expect(asked).toEqual({
      run: 'لطفاً ابتدا کد HTML را وارد کنید.',
      color: 'rgb(180, 35, 24)',
      rerun: false,
      download: 'لطفاً ابتدا کد HTML را وارد کنید.',
    });
  });
});

describe.skipIf(!chromePath)('a Full Page pasted into the HTML tab', () => {
  let tab: BrowserPage;
  let downloads: string;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
    downloads = mkdtempSync(join(tmpdir(), 'rabanian-download-'));
    await tab.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
  });
  afterAll(async () => {
    await tab?.close();
    rmSync(downloads, { recursive: true, force: true });
  });

  it('takes the whole file, Starter Template and all, and one undo brings it back', async () => {
    const pasted = await tab.evaluate<string>(`(async () => {
      ${lib}
      await pick('HTML');
      content().focus();
      paste(${JSON.stringify(fullPage)});
      await sleep(50);
      return codeText();
    })()`);
    // The platform's command modifier, as CodeMirror reads it: Meta on macOS, else Ctrl.
    await tab.press('z', (await tab.evaluate<boolean>(`/Mac/.test(navigator.platform)`)) ? 4 : 2);
    const undone = await tab.evaluate<string>(`(async () => {
      ${lib}
      await sleep(50);
      const text = codeText();
      paste(${JSON.stringify(fullPage)});
      return text;
    })()`);
    expect(pasted).toBe(fullPage);
    expect(undone).toContain('<h1>سلام دنیا</h1>');
  });

  it('runs as it is: its own direction and style, none of ours, its script heard by the console', async () => {
    const shown = await tab.evaluate<Record<string, unknown>>(`(async () => {
      ${lib}
      await waitFor(() => frame().srcdoc.startsWith('<!DOCTYPE html>'));
      await waitFor(() => entries().length > 0);
      const doc = frame().contentDocument;
      const h1 = doc.querySelector('h1');
      return {
        direction: frame().contentWindow.getComputedStyle(h1).direction,
        margin: frame().contentWindow.getComputedStyle(doc.body).margin,
        title: doc.title,
        entries: entries(),
      };
    })()`);
    expect(shown).toEqual({ direction: 'ltr', margin: '0px', title: 'My page', entries: ['log mine'] });
  });

  it('is saved by «دانلود index.html» exactly as pasted', async () => {
    await tab.evaluate(`(() => { ${lib}; button('دانلود index.html').click(); })()`);
    const file = join(downloads, 'index.html');
    for (let i = 0; i < 100 && !existsSync(file); i++) await new Promise((r) => setTimeout(r, 50));
    expect(readFileSync(file, 'utf8')).toBe(fullPage);
  });

  it('lands where the caret is when it is not a Full Page', async () => {
    const text = await tab.evaluate<string>(`(async () => {
      ${lib}
      await write('HTML', '<p>یک</p>');
      paste('<p>دو</p>');
      await sleep(50);
      return codeText();
    })()`);
    expect(text).toBe('<p>یک</p><p>دو</p>');
  });
});

describe.skipIf(!chromePath)('the Preview, unsandboxed like the original tool (ADR-0004)', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  it("lets the visitor's page use storage and handle its own form", async () => {
    const logged = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await write('HTML', '<form id="f"><button>ارسال</button></form>');
      await write(
        'JS',
        "localStorage.setItem('k', 'v'); console.log(localStorage.getItem('k'));" +
          "document.getElementById('f').addEventListener('submit', (e) => { e.preventDefault(); console.log('sent'); });",
      );
      await waitFor(() => entries().includes('log v'));
      frame().contentDocument.querySelector('#f button').click();
      await waitFor(() => entries().includes('log sent'));
      return entries();
    })()`);
    expect(logged).toEqual(['log v', 'log sent']);
  });
});

describe.skipIf(!chromePath)('an empty Code Pane', () => {
  it("shows the original tool's hint, right to left, for each file", async () => {
    const tab = await openEditor(site.origin);
    try {
      const hints = await tab.evaluate<string[][]>(`(async () => {
        ${lib}
        const out = [];
        for (const label of ['HTML', 'CSS', 'JS']) {
          await write(label, '');
          await sleep(50);
          const hint = content().querySelector('.cm-placeholder');
          out.push([hint.textContent, getComputedStyle(hint).direction, content().getAttribute('aria-placeholder')]);
        }
        return out;
      })()`);
      expect(hints).toEqual([
        ['کد HTML خود را اینجا قرار دهید...', 'rtl', 'کد HTML خود را اینجا قرار دهید...'],
        ['کد CSS خود را اینجا قرار دهید...', 'rtl', 'کد CSS خود را اینجا قرار دهید...'],
        ['کد JS خود را اینجا قرار دهید...', 'rtl', 'کد JS خود را اینجا قرار دهید...'],
      ]);
    } finally {
      await tab.close();
    }
  });
});

describe.skipIf(!chromePath)('the action bar', () => {
  describe.each([
    { width: 1440, height: 900, title: true },
    { width: 1024, height: 768, title: false },
    { width: 390, height: 844, title: false },
  ])('at $width px', ({ width, height, title }) => {
    it('shows all four buttons whole, inside the bar, the title only where they all fit beside it', async () => {
      const tab = await openEditor(site.origin, width, height);
      try {
        const bar = await tab.evaluate<{ inside: boolean[]; whole: boolean[]; title: boolean }>(`(() => {
          const bar = document.querySelector('[data-actions]').parentElement.getBoundingClientRect();
          const buttons = [...document.querySelectorAll('[data-actions] button')];
          const titleBox = document.querySelector('.editor-pane-title').getBoundingClientRect();
          return {
            inside: buttons.map((b) => {
              const r = b.getBoundingClientRect();
              return r.left >= bar.left && r.right <= bar.right && r.top >= bar.top && r.bottom <= bar.bottom;
            }),
            whole: buttons.map((b) => b.scrollWidth <= b.clientWidth),
            title: titleBox.width > 1,
          };
        })()`);
        expect(bar).toEqual({ inside: [true, true, true, true], whole: [true, true, true, true], title });
      } finally {
        await tab.close();
      }
    });
  });
});
