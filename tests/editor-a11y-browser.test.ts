import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The HTML Editor (/editor) used from the keyboard, in a real (headless)
 * Chrome pressing real keys (spec: Acceptance; ticket 05). Skipped where no
 * Chrome is installed (set CHROME_PATH).
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
  const content = () => document.querySelector('[role="tabpanel"] .cm-content');
  const consoleToggle = () => document.querySelector('[data-console] button[aria-expanded]');
  const run = () => [...document.querySelectorAll('[data-actions] button')].find((b) => b.textContent.trim() === 'اجرا');
`;

/** Opens /editor and waits for the client-only island to render. */
async function openEditor(origin: string): Promise<BrowserPage> {
  const tab = await openPage(`${origin}/editor/`, { width: 1280, height: 900, reducedMotion: true });
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => tabs().length > 0 && !!content());
  })()`);
  if (!ready) throw new Error('the editor island never rendered');
  return tab;
}

/** Palette P's focus ring: 2px solid primary (#1769FF). */
const RING = 'solid 2px rgb(23, 105, 255)';

/**
 * Where the keyboard focus is: the control's name, and the ring drawn for it.
 * The Code Pane draws no frame: its blinking caret (and caret line) shows
 * focus, as in a code editor. A focused Preview is the visitor's page, which
 * draws its own.
 */
const focused = (tab: BrowserPage) =>
  tab.evaluate<{ name: string; ring: string } | null>(`(async () => {
    // The Code Pane marks itself focused a moment after it takes focus.
    await new Promise((r) => setTimeout(r, 50));
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const name = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent.trim();
    if (el.tagName === 'IFRAME') return { name, ring: "the visitor's page" };
    const editor = el.closest('.cm-editor');
    if (editor) {
      const caret = editor.querySelector('.cm-cursor-primary');
      const shown = caret && getComputedStyle(caret).display !== 'none';
      const frame = getComputedStyle(editor).outlineStyle;
      return { name, ring: shown && frame === 'none' ? 'the caret, no frame' : 'frame: ' + frame };
    }
    const s = getComputedStyle(el);
    return { name, ring: [s.outlineStyle, s.outlineWidth, s.outlineColor].join(' ') };
  })()`);

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('HTML Editor from the keyboard', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  it('reaches every control with Tab, each in a palette-P focus ring', async () => {
    // A console long enough to scroll, opened, so its log and «پاک کردن» are on the page.
    await tab.evaluate(`(async () => {
      ${lib}
      tabs()[2].click();
      await waitFor(() => selected() === tabs()[2]);
      content().focus();
      document.execCommand('selectAll');
      document.execCommand('insertText', false, "for (let i = 0; i < 40; i++) console.log(i);");
      consoleToggle().click();
      run().click();
      await waitFor(() => document.querySelectorAll('[data-console] li').length === 40);
      document.activeElement.blur();
    })()`);
    // Tab from the start of the page: focus on <main> moves the keyboard's starting point there.
    await tab.evaluate(`(() => { const main = document.querySelector('main'); main.tabIndex = -1; main.focus(); })()`);
    const stops = [];
    for (let i = 0; i < 20; i++) {
      await tab.press('Tab');
      const stop = await focused(tab);
      if (!stop) break;
      stops.push(stop);
      // Tab indents inside the Code Pane; Escape first lets it leave.
      if (stop.name.startsWith('کد ')) await tab.press('Escape');
    }
    // The Preview's column comes first: it is the top pane on a phone.
    expect(stops).toEqual([
      { name: 'بازنشانی', ring: RING },
      { name: 'دانلود', ring: RING },
      { name: 'اجرا', ring: RING },
      { name: 'پیش‌نمایش', ring: "the visitor's page" },
      // Named with how many entries it holds.
      { name: 'کنسول، 40 پیام', ring: RING },
      { name: 'پاک کردن', ring: RING },
      // The log scrolls, so Chrome lets the keyboard scroll it.
      { name: expect.stringMatching(/^0\s*1\s*2/), ring: RING },
      // Arrow keys resize the panes from here.
      { name: 'اندازهٔ پیش‌نمایش و کد', ring: RING },
      { name: 'JS', ring: RING },
      { name: 'کد JS', ring: 'the caret, no frame' },
    ]);
    // Twenty-odd sequential key presses: slow when the whole suite shares the machine.
  }, 60_000);

  it('tells screen readers how to leave the Code Pane, where Tab indents', async () => {
    await tab.send('DOM.enable');
    await tab.send('Accessibility.enable');
    const { root } = await tab.send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await tab.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '[role="tabpanel"] .cm-content',
    });
    const { nodes } = await tab.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const [pane] = nodes;
    expect({ role: pane.role.value, name: pane.name.value, description: pane.description?.value }).toEqual({
      role: 'textbox',
      name: 'کد JS',
      description: 'در کد، Tab فاصله می‌گذارد؛ برای بیرون رفتن، اول Esc و بعد Tab را بزن.',
    });
  });
});
