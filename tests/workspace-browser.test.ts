import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONSOLE_BRIDGE } from '../src/components/editor/consoleBridge';
import { STARTER_TEMPLATE } from '../src/components/editor/starterTemplate';
import { COPY } from '../src/site';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The HTML Editor's workspace (/editor) in a real (headless) Chrome: the
 * Starter Template on a first visit, autosave across reloads, «بازنشانی» and
 * «دانلود». Every `openPage` is a fresh browser profile, so a first visit.
 * Skipped where no Chrome is installed (set CHROME_PATH).
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
  /** Each tab's file as the Code Pane shows it, then back to the tab that was open. */
  const shownFiles = async () => {
    const open = selected().textContent.trim();
    const files = {};
    for (const label of ['HTML', 'CSS', 'JS']) {
      await pick(label);
      files[label.toLowerCase()] = codeText();
    }
    await pick(open);
    return files;
  };
  /** Replaces one file's text, as if typed into its Code Pane. */
  const write = async (label, text) => {
    await pick(label);
    content().focus();
    document.execCommand('selectAll');
    document.execCommand('insertText', false, text);
  };
  const frame = () => document.querySelector('iframe[data-preview]');
  const button = (label) =>
    [...document.querySelectorAll('[data-actions] button')].find((b) => b.textContent.trim() === label);
  const entries = () =>
    [...document.querySelectorAll('[data-console] li')].map((li) => li.dataset.level + ' ' + li.textContent);
`;

/** Opens /editor and waits for the client-only island to render. */
async function openEditor(origin: string): Promise<BrowserPage> {
  const tab = await openPage(`${origin}/editor/`, { width: 1280, height: 900, reducedMotion: true });
  await waitForEditor(tab);
  return tab;
}

async function waitForEditor(tab: BrowserPage) {
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => tabs().length > 0 && !!content());
  })()`);
  if (!ready) throw new Error('the editor island never rendered');
}

/**
 * Runs `expression` inside the Preview. The sandboxed frame is out of
 * process, so it is reached as its own DevTools target.
 */
async function inPreview<T>(tab: BrowserPage, expression: string): Promise<T> {
  const { targetInfos } = await tab.send('Target.getTargets');
  const frame = targetInfos.find(
    (t: { type: string; url: string }) => t.type === 'iframe' && t.url === 'about:srcdoc',
  );
  if (!frame) throw new Error('no Preview frame');
  const { sessionId } = await tab.send('Target.attachToTarget', { targetId: frame.targetId, flatten: true });
  try {
    const { result, exceptionDetails } = await tab.send(
      'Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true },
      sessionId,
    );
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
    return result.value as T;
  } finally {
    await tab.send('Target.detachFromTarget', { sessionId });
  }
}

/** The open tab and each tab's file, as the editor shows them. */
const shown = (tab: BrowserPage) =>
  tab.evaluate<{ tab: string; files: object }>(`(async () => {
    ${lib}
    return { tab: selected().textContent.trim(), files: await shownFiles() };
  })()`);

/** Edits all three files, ending on the CSS tab. */
const edited = { html: '<h1>سلام دوباره</h1>', css: 'h1 { color: #1769FF }', js: "console.log('دوباره')" };
const edit = (tab: BrowserPage) =>
  tab.evaluate(`(async () => {
    ${lib}
    await write('HTML', ${JSON.stringify(edited.html)});
    await write('CSS', ${JSON.stringify(edited.css)});
    await write('JS', ${JSON.stringify(edited.js)});
    await pick('CSS');
  })()`);

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('first visit', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  it('opens the Starter Template on the HTML tab, each file in its tab', async () => {
    expect(await shown(tab)).toEqual({ tab: 'HTML', files: STARTER_TEMPLATE });
  });

  it('renders the template in the Preview, with an empty console until the button is clicked', async () => {
    const before = await tab.evaluate<{ rendered: boolean; console: string[] }>(`(async () => {
      ${lib}
      const rendered = await waitFor(() => frame().srcdoc.includes(${JSON.stringify(STARTER_TEMPLATE.html)}));
      await sleep(300);
      return { rendered, console: entries() };
    })()`);
    expect(before).toEqual({ rendered: true, console: [] });

    const heading = await inPreview<string>(
      tab,
      `document.getElementById('greet').click(); document.querySelector('h1').textContent`,
    );
    expect(heading).toBe('به دنیای وب خوش آمدی');
    const logged = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await waitFor(() => entries().length > 0);
      return entries();
    })()`);
    expect(logged).toEqual(['log سلام از جاوااسکریپت']);
  });
});

describe.skipIf(!chromePath)('autosave', () => {
  it('keeps the three files and the open tab across a reload', async () => {
    const tab = await openEditor(site.origin);
    try {
      await edit(tab);
      await tab.evaluate(`new Promise((r) => setTimeout(r, 800))`); // past the save delay
      await tab.reload();
      await waitForEditor(tab);
      expect(await shown(tab)).toEqual({ tab: 'CSS', files: edited });
    } finally {
      await tab.close();
    }
  });

  it('keeps an edit made just before leaving, without waiting for the save delay', async () => {
    const tab = await openEditor(site.origin);
    try {
      await edit(tab);
      await tab.reload();
      await waitForEditor(tab);
      expect(await shown(tab)).toEqual({ tab: 'CSS', files: edited });
    } finally {
      await tab.close();
    }
  });
});

describe.skipIf(!chromePath)('«بازنشانی»', () => {
  const reset = (tab: BrowserPage) => tab.evaluate(`(() => { ${lib} button('بازنشانی').click(); })()`);

  it('asks first, in Farsi, and leaves the files alone when declined', async () => {
    const tab = await openEditor(site.origin);
    try {
      await edit(tab);
      const asked: string[] = [];
      tab.answerDialogs((message) => {
        asked.push(message);
        return false;
      });
      await reset(tab);
      expect(asked).toEqual([COPY.editor.resetConfirm]);
      expect((await shown(tab)).files).toEqual(edited);
    } finally {
      await tab.close();
    }
  });

  it('once confirmed, restores the Starter Template and forgets the save', async () => {
    const tab = await openEditor(site.origin);
    try {
      await edit(tab);
      await tab.evaluate(`new Promise((r) => setTimeout(r, 800))`); // saved
      tab.answerDialogs(() => true);
      await reset(tab);
      // Checked without switching tabs, which would be an edit to save: the
      // open file in the Code Pane, all three in the Preview.
      const restored = await tab.evaluate<{ pane: string; previewed: boolean }>(`(async () => {
        ${lib}
        const template = ${JSON.stringify(STARTER_TEMPLATE)};
        const previewed = await waitFor(
          () => [template.html, template.css, template.js].every((file) => frame().srcdoc.includes(file)),
          1500,
        );
        return { pane: codeText(), previewed };
      })()`);
      expect(restored).toEqual({ pane: STARTER_TEMPLATE.css, previewed: true });
      await tab.evaluate(`new Promise((r) => setTimeout(r, 800))`); // nothing to save
      await tab.reload();
      await waitForEditor(tab);
      expect(await shown(tab)).toEqual({ tab: 'HTML', files: STARTER_TEMPLATE });
    } finally {
      await tab.close();
    }
  });
});

describe.skipIf(!chromePath)('«دانلود»', () => {
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

  const mine = '<p id="mine">نوشتهٔ من</p>';
  let saved: string;

  it('saves the Preview page as one index.html, without the console bridge', async () => {
    const previewed = await tab.evaluate<string>(`(async () => {
      ${lib}
      await write('HTML', ${JSON.stringify(STARTER_TEMPLATE.html + mine)});
      await waitFor(() => frame().srcdoc.includes(${JSON.stringify(mine)}));
      button('دانلود').click();
      return frame().srcdoc;
    })()`);
    const file = join(downloads, 'index.html');
    for (let i = 0; i < 100 && !existsSync(file); i++) await new Promise((r) => setTimeout(r, 50));
    saved = readFileSync(file, 'utf8');
    expect(previewed).toContain(`<script>${CONSOLE_BRIDGE}</script>`);
    expect(saved).toBe(previewed.replace(`<script>${CONSOLE_BRIDGE}</script>`, ''));
    expect(saved).not.toMatch(/postMessage|rabanian-editor/);
  });

  it('opens on its own as a working right-to-left Farsi page', async () => {
    const page = await openPage(pathToFileURL(join(downloads, 'index.html')).href, { width: 1280, height: 900 });
    try {
      const opened = await page.evaluate<Record<string, unknown>>(`(async () => {
        const h1 = document.querySelector('h1');
        const faces = await document.fonts.load('700 32px IRANYekanXFaNum', h1.textContent);
        const before = {
          lang: document.documentElement.lang,
          direction: getComputedStyle(h1).direction,
          font: faces.map((face) => face.status).join(),
          mine: document.getElementById('mine')?.textContent,
          heading: h1.textContent,
        };
        document.getElementById('greet').click();
        return { ...before, clicked: h1.textContent };
      })()`);
      expect(opened).toEqual({
        lang: 'fa',
        direction: 'rtl',
        font: 'loaded',
        mine: 'نوشتهٔ من',
        heading: 'سلام دنیا',
        clicked: 'به دنیای وب خوش آمدی',
      });
    } finally {
      await page.close();
    }
  });
});
