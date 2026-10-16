import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STARTER_TEMPLATE } from '../src/components/editor/starterTemplate';
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
  const frame = () => document.querySelector('iframe[data-preview]');
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
  const frame = targetInfos.find((t: { type: string; url: string }) => t.type === 'iframe' && t.url === 'about:srcdoc');
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
    const shown = await tab.evaluate<{ tab: string; files: object }>(`(async () => {
      ${lib}
      return { tab: selected().textContent.trim(), files: await shownFiles() };
    })()`);
    expect(shown).toEqual({ tab: 'HTML', files: STARTER_TEMPLATE });
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
