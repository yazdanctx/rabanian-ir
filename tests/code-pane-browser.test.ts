import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The Code Pane on /editor (spec: .scratch/html-editor/spec.md → Code Pane),
 * driven like a learner would: clicks, the keyboard (over the DevTools
 * protocol) and what ends up on screen. Skipped where no Chrome is installed.
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
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const tabs = () => [...document.querySelectorAll('[role="tablist"] [role="tab"]')];
  const pick = async (label) => {
    tabs().find((t) => t.textContent.trim() === label).click();
    await waitFor(() => document.querySelector('[role="tab"][aria-selected="true"]').textContent.trim() === label);
    await frames();
  };
  const panel = () => document.querySelector('[role="tabpanel"]');
  const content = () => panel().querySelector('.cm-content');
  const text = () => [...content().querySelectorAll('.cm-line')].map((l) => l.textContent).join('\\n');
`;

/** Opens /editor and waits for the Code Pane to mount. */
async function openEditor(origin: string, options: { reducedMotion?: boolean } = {}) {
  const tab = await openPage(`${origin}/editor/`, {
    width: 1280,
    height: 900,
    reducedMotion: options.reducedMotion ?? true,
  });
  const ready = await tab.evaluate<boolean>(`(async () => {
    ${lib}
    return waitFor(() => panel()?.querySelector('.cm-content'));
  })()`);
  if (!ready) throw new Error('the Code Pane never mounted');
  return tab;
}

/** The platform's command modifier, as CodeMirror reads it: Meta on macOS, else Ctrl. */
const modifier = async (tab: BrowserPage) =>
  (await tab.evaluate<boolean>(`/Mac/.test(navigator.platform)`)) ? 4 : 2;

/** Focuses the Code Pane and empties the file it shows. */
async function clear(tab: BrowserPage) {
  await tab.evaluate(`(() => { ${lib} content().focus(); })()`);
  await tab.press('a', await modifier(tab));
  await tab.press('Backspace');
}

/** Types `text` one character at a time, as from a keyboard. */
async function typeKeys(tab: BrowserPage, text: string) {
  for (const char of text) {
    if (char === '\n') await tab.press('Enter');
    else await tab.type(char);
  }
}

/** Each leaf token on screen, as `text: color` (plus ` italic`). */
const tokens = (tab: BrowserPage) =>
  tab.evaluate<Record<string, string>>(`(() => {
    ${lib}
    const leaves = [...content().querySelectorAll('.cm-line span')].filter((s) => !s.querySelector('span'));
    return Object.fromEntries(leaves.map((s) => {
      const style = getComputedStyle(s);
      return [s.textContent.trim(), style.color + (style.fontStyle === 'italic' ? ' italic' : '')];
    }));
  })()`);

/** Palette P's syntax colours (spec: Code Pane). */
const TAG = 'rgb(13, 91, 224)';
const ATTRIBUTE = 'rgb(83, 96, 120)';
const STRING = 'rgb(18, 55, 200)';
const COMMENT = 'rgb(83, 96, 120) italic';

const pick = (tab: BrowserPage, label: string) =>
  tab.evaluate(`(async () => { ${lib} await pick(${JSON.stringify(label)}); })()`);

const paneText = (tab: BrowserPage) => tab.evaluate<string>(`(() => { ${lib} return text(); })()`);

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('Code Pane in the browser', () => {
  let tab: BrowserPage;
  beforeAll(async () => {
    tab = await openEditor(site.origin);
  });
  afterAll(() => tab?.close());

  it('is a left-to-right code editor named after its file, line numbers on the left', async () => {
    const pane = await tab.evaluate<{
      textareas: number;
      role: string | null;
      name: string | null;
      direction: string;
      gutterLeftOfCode: boolean;
    }>(`(() => {
      ${lib}
      const gutter = panel().querySelector('.cm-lineNumbers').getBoundingClientRect();
      return {
        textareas: panel().querySelectorAll('textarea').length,
        role: content().getAttribute('role'),
        name: content().getAttribute('aria-label'),
        direction: getComputedStyle(content()).direction,
        gutterLeftOfCode: gutter.right <= content().getBoundingClientRect().left,
      };
    })()`);
    expect(pane).toEqual({
      textareas: 0,
      role: 'textbox',
      name: 'کد HTML',
      direction: 'ltr',
      gutterLeftOfCode: true,
    });
  });

  it('shows what is typed, Farsi included', async () => {
    await clear(tab);
    await tab.type('<h1>سلام دنیا</h1>');
    expect(await paneText(tab)).toBe('<h1>سلام دنیا</h1>');
  });

  it('sets code in 14px / 1.7 on white, line numbers muted on white in a Latin-digit font', async () => {
    await clear(tab);
    await tab.type('a');
    const look = await tab.evaluate<Record<string, string>>(`(() => {
      ${lib}
      const editor = getComputedStyle(panel().querySelector('.cm-editor'));
      const line = getComputedStyle(content().querySelector('.cm-line'));
      const gutters = getComputedStyle(panel().querySelector('.cm-gutters'));
      return {
        fontSize: line.fontSize,
        lineHeight: line.lineHeight,
        background: editor.backgroundColor,
        ink: line.color,
        gutter: gutters.color + ' on ' + gutters.backgroundColor,
        gutterBorder: gutters.borderRightWidth,
        gutterFont: gutters.fontFamily.replace(/["']/g, ''),
      };
    })()`);
    expect(look).toEqual({
      fontSize: '14px',
      lineHeight: '23.8px',
      background: 'rgb(255, 255, 255)',
      ink: 'rgb(5, 8, 22)',
      gutter: 'rgb(83, 96, 120) on rgb(255, 255, 255)',
      gutterBorder: '0px',
      // No IRANYekanXFaNum here: it would draw line numbers in Persian digits.
      gutterFont: 'JetBrains Mono, ui-monospace, monospace',
    });
  });

  it('highlights HTML: tags, attribute names, values and comments', async () => {
    await pick(tab, 'HTML');
    await clear(tab);
    await tab.type('<!-- c --><h1 class="t">سلام</h1>');
    expect(await tokens(tab)).toMatchObject({
      '<!-- c -->': COMMENT,
      '<': TAG,
      h1: TAG,
      '>': TAG,
      '</': TAG,
      class: ATTRIBUTE,
      '"t"': STRING,
    });
  });

  it('highlights CSS: selectors, strings and comments', async () => {
    await pick(tab, 'CSS');
    await clear(tab);
    await tab.type('/* c */ body { font-family: "x"; }');
    expect(await tokens(tab)).toMatchObject({ '/* c */': COMMENT, body: TAG, '"x"': STRING });
  });

  it('highlights JS: strings and comments', async () => {
    await pick(tab, 'JS');
    await clear(tab);
    await tab.type('// c');
    await tab.press('Enter');
    await tab.type("console.log('s');");
    expect(await tokens(tab)).toMatchObject({ '// c': COMMENT, "'s'": STRING });
  });
});
