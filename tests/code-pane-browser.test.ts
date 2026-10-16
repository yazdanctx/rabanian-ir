import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STARTER_TEMPLATE } from '../src/components/editor/starterTemplate';
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
  const left = await tab.evaluate<string>(`(() => { ${lib} return text(); })()`);
  if (left !== '') throw new Error(`could not empty the Code Pane: ${JSON.stringify(left)} is left`);
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

/** The colour on screen at a viewport point, as `[r, g, b]`. */
async function pixel(tab: BrowserPage, x: number, y: number): Promise<number[]> {
  const { data } = await tab.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: Math.round(x), y: Math.round(y), width: 1, height: 1, scale: 1 },
  });
  return [...(await sharp(Buffer.from(data, 'base64')).removeAlpha().raw().toBuffer())];
}

const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

/** The first line's characters as they sit on screen, left to right. */
const onScreen = (tab: BrowserPage) =>
  tab.evaluate<string>(`(async () => {
    ${lib}
    await frames();
    const line = content().querySelector('.cm-line');
    const range = document.createRange();
    const chars = [];
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    for (let node; (node = walker.nextNode()); ) {
      for (let i = 0; i < node.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        chars.push([node.data[i], range.getBoundingClientRect().left]);
      }
    }
    return chars.sort((a, b) => a[1] - b[1]).map(([c]) => c).join('');
  })()`);

/** The caret as a logical offset into the first line, and where it is drawn. */
const caret = (tab: BrowserPage) =>
  tab.evaluate<{ offset: number; x: number }>(`(async () => {
    ${lib}
    await frames();
    const selection = getSelection();
    const range = document.createRange();
    range.setStart(content().querySelector('.cm-line'), 0);
    range.setEnd(selection.focusNode, selection.focusOffset);
    const drawn = panel().querySelector('.cm-cursor-primary').getBoundingClientRect();
    return { offset: range.toString().length, x: drawn.left };
  })()`);

/**
 * The fonts that actually drew a node's own text (not its children's), by
 * family, as Chrome reports them.
 */
async function drawnIn(tab: BrowserPage, selector: string): Promise<string[]> {
  await tab.evaluate(`(async () => { ${lib} await document.fonts.ready; await frames(); })()`);
  await tab.send('DOM.enable');
  await tab.send('CSS.enable');
  const { root } = await tab.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await tab.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { fonts } = await tab.send('CSS.getPlatformFontsForNode', { nodeId });
  return fonts.map((font: { familyName: string }) => font.familyName).sort();
}

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

  it('closes HTML tags as they are opened', async () => {
    await pick(tab, 'HTML');
    await clear(tab);
    await typeKeys(tab, '<div>');
    expect(await paneText(tab)).toBe('<div></div>');
  });

  it('closes brackets and quotes, and types over the closing one', async () => {
    await pick(tab, 'JS');
    await clear(tab);
    await typeKeys(tab, "f('x');");
    expect(await paneText(tab)).toBe("f('x');");
    await clear(tab);
    await typeKeys(tab, '[{(');
    expect(await paneText(tab)).toBe('[{()}]');
  });

  it('keeps a separate undo history per file', async () => {
    const mod = await modifier(tab);
    /** Undoes until nothing changes; returns every text passed through. */
    const undoAll = async () => {
      await tab.evaluate(`(() => { ${lib} content().focus(); })()`);
      const seen = [await paneText(tab)];
      for (let i = 0; i < 50; i++) {
        await tab.press('z', mod);
        const now = await paneText(tab);
        if (now === seen.at(-1)) break;
        seen.push(now);
      }
      return seen;
    };
    await pick(tab, 'CSS');
    const css = await paneText(tab);
    await clear(tab);
    await tab.type('p {}');
    await pick(tab, 'JS');
    await clear(tab);
    await tab.type('x');
    const js = await undoAll();
    // JS walks back to its own start (the Starter Template) and never shows CSS text…
    expect(js.at(-1)).toBe(STARTER_TEMPLATE.js);
    expect(js.some((text) => text.includes('p {}'))).toBe(false);
    // …while CSS keeps its text, and its own history.
    await pick(tab, 'CSS');
    expect(await paneText(tab)).toBe('p {}');
    await tab.evaluate(`(() => { ${lib} content().focus(); })()`);
    await tab.press('z', mod);
    // Typing straight after emptying may land in the same undo step.
    expect(['', css]).toContain(await paneText(tab));
  });

  it('indents by two spaces, with Tab and after Enter', async () => {
    await pick(tab, 'CSS');
    await clear(tab);
    await typeKeys(tab, 'p {\nx');
    await tab.press('Home');
    await tab.press('Tab');
    expect(await paneText(tab)).toBe('p {\n    x\n}');
  });

  it('wraps long lines instead of scrolling sideways', async () => {
    await pick(tab, 'JS');
    await clear(tab);
    await tab.type('// ' + 'سلام دنیا hello world '.repeat(40));
    const wrap = await tab.evaluate<{ lines: number; rows: number; overflow: number }>(`(() => {
      ${lib}
      const scroller = panel().querySelector('.cm-scroller');
      const line = content().querySelector('.cm-line');
      return {
        lines: content().querySelectorAll('.cm-line').length,
        rows: Math.round(line.getBoundingClientRect().height / parseFloat(getComputedStyle(line).lineHeight)),
        overflow: scroller.scrollWidth - scroller.clientWidth,
      };
    })()`);
    expect(wrap.lines).toBe(1);
    expect(wrap.rows).toBeGreaterThan(1);
    expect(wrap.overflow).toBe(0);
  });

  it('marks the bracket matching the one at the caret', async () => {
    await pick(tab, 'JS');
    await clear(tab);
    await typeKeys(tab, 'f(1');
    const matched = await tab.evaluate<string[]>(`(async () => {
      ${lib}
      await frames();
      return [...content().querySelectorAll('.cm-matchingBracket')].map(
        (b) => b.textContent + ' on ' + getComputedStyle(b).backgroundColor,
      );
    })()`);
    // Marked in primary-soft.
    expect(matched).toEqual(['( on rgb(234, 241, 255)', ') on rgb(234, 241, 255)']);
  });

  it('has only the line-number gutter, and leaves Ctrl/Cmd-F to the browser', async () => {
    await tab.evaluate(`(() => { ${lib} content().focus(); })()`);
    await tab.press('f', await modifier(tab));
    const chrome = await tab.evaluate<{ gutters: string[]; panels: number }>(`(async () => {
      ${lib}
      await frames();
      return {
        gutters: [...panel().querySelectorAll('.cm-gutter')].map((g) => g.className.trim()),
        panels: panel().querySelectorAll('.cm-panels, .cm-search').length,
      };
    })()`);
    expect(chrome).toEqual({ gutters: ['cm-gutter cm-lineNumbers'], panels: 0 });
  });

  it('shades the caret line in surface and draws selections in primary-soft, on that line too', async () => {
    const SURFACE = [245, 247, 250];
    const PRIMARY_SOFT = [234, 241, 255];
    await pick(tab, 'JS');
    await clear(tab);
    await tab.type('let a = 1;');
    // A blank spot on the caret's line, right of the text.
    const blank = await tab.evaluate<{ x: number; y: number }>(`(async () => {
      ${lib}
      await frames();
      const line = content().querySelector('.cm-activeLine').getBoundingClientRect();
      return { x: line.right - 8, y: line.top + 2 };
    })()`);
    const line = await pixel(tab, blank.x, blank.y);
    line.forEach((value, i) => expect(Math.abs(value - SURFACE[i])).toBeLessThanOrEqual(1));

    await tab.press('a', await modifier(tab));
    const selected = await tab.evaluate<{ x: number; y: number } | null>(`(async () => {
      ${lib}
      await frames();
      const box = panel().querySelector('.cm-selectionBackground')?.getBoundingClientRect();
      return box ? { x: box.left + 1, y: box.top + 2 } : null;
    })()`);
    expect(selected).not.toBeNull();
    const selection = await pixel(tab, selected!.x, selected!.y);
    expect(distance(selection, PRIMARY_SOFT)).toBeLessThan(distance(selection, SURFACE));
    expect(distance(selection, PRIMARY_SOFT)).toBeLessThan(15);
  });

  it('shows an ink caret and a primary focus ring while focused', async () => {
    await tab.evaluate(`(() => { ${lib} content().focus(); })()`);
    await tab.press('End');
    const look = await tab.evaluate<{ caret: string; ring: string }>(`(async () => {
      ${lib}
      await frames();
      const editor = getComputedStyle(panel().querySelector('.cm-editor'));
      return {
        caret: getComputedStyle(panel().querySelector('.cm-cursor')).borderLeftColor,
        ring: [editor.outlineStyle, editor.outlineWidth, editor.outlineColor].join(' '),
      };
    })()`);
    expect(look).toEqual({ caret: 'rgb(5, 8, 22)', ring: 'solid 2px rgb(23, 105, 255)' });
  });

  describe('Farsi inside code', () => {
    it('keeps attribute values and text apart: <p title="سلام">دنیا</p> is not jumbled', async () => {
      await pick(tab, 'HTML');
      await clear(tab);
      await tab.type('<p title="سلام">دنیا</p>');
      // Each Farsi run reads right to left, so on screen its letters are reversed.
      expect(await onScreen(tab)).toBe('<p title="مالس">ایند</p>');
    });

    it.each([
      { file: 'HTML', comment: '<!-- سلام دنیا -->', shown: '<!-- ایند مالس -->' },
      { file: 'CSS', comment: '/* سلام دنیا */', shown: '/* ایند مالس */' },
      { file: 'JS', comment: '// سلام دنیا', shown: '// ایند مالس' },
    ])('keeps a Farsi comment between its $file delimiters, left to right', async ({ file, comment, shown }) => {
      await pick(tab, file);
      await clear(tab);
      await tab.type(comment);
      expect(await onScreen(tab)).toBe(shown);
    });

    it.each([
      { file: 'HTML', line: '<p>سلام <b>دنیا</b></p>', shown: '<p>مالس <b>ایند</b></p>' },
      {
        file: 'HTML',
        line: '<p>سلام <a href="#">دنیا</a> خوبی؟</p>',
        shown: '<p>مالس <a href="#">ایند</a> ؟یبوخ</p>',
      },
      { file: 'JS', line: 'let s = `سلام ${name} دنیا`;', shown: 'let s = `مالس ${name} ایند`;' },
    ])('keeps code between Farsi runs in place: $line', async ({ file, line, shown }) => {
      await pick(tab, file);
      await clear(tab);
      await tab.type(line);
      expect(await onScreen(tab)).toBe(shown);
    });

    /** Offsets strictly inside a Farsi word of `line`: between two of its letters. */
    const insideFarsi = (line: string) =>
      new Set([...line.matchAll(/[؀-ۿ]+/g)].flatMap(({ index, 0: word }) =>
        Array.from({ length: word.length - 1 }, (_, i) => index + i + 1),
      ));

    describe.each(['<p>سلام <b>دنیا</b></p>', '<p>سلام <a href="#">دنیا</a> خوبی؟</p>'])(
      'with inline tags between Farsi words: %s',
      (line) => {
        async function startOf() {
          await pick(tab, 'HTML');
          await clear(tab);
          await tab.type(line);
          await tab.press('Home');
        }

        it('walks the arrow keys through the tags in reading order', async () => {
          await startOf();
          const walk = [await caret(tab)];
          for (let i = 0; i < line.length; i++) {
            await tab.press('ArrowRight');
            walk.push(await caret(tab));
          }
          const offsets = walk.map((c) => c.offset);
          expect([...offsets].sort((a, b) => a - b)).toEqual([...Array(line.length + 1).keys()]);
          for (let i = 1; i < walk.length; i++) expect(walk[i].x).toBeGreaterThanOrEqual(walk[i - 1].x);
          // Outside the Farsi words, the caret passes the code left to right, in order.
          const inside = insideFarsi(line);
          const code = offsets.filter((offset) => !inside.has(offset));
          expect(code).toEqual([...code].sort((a, b) => a - b));
        });

        it('selects from an inline tag to the line end as one stretch on screen', async () => {
          await startOf();
          const tag = line.indexOf('<', 1); // the inline tag's «<»
          for (let i = 0; i < line.length && (await caret(tab)).offset !== tag; i++) await tab.press('ArrowRight');
          expect((await caret(tab)).offset).toBe(tag);
          await tab.press('End', 8); // Shift
          const selection = await tab.evaluate<{ text: string; gaps: number; startsAtTag: boolean }>(`(async () => {
            ${lib}
            await frames();
            const boxes = [...panel().querySelectorAll('.cm-selectionBackground')]
              .map((b) => b.getBoundingClientRect())
              .sort((a, b) => a.left - b.left);
            const gaps = boxes.filter((box, i) => i > 0 && box.left > boxes[i - 1].right + 1).length;
            const walker = document.createTreeWalker(content().querySelector('.cm-line'), NodeFilter.SHOW_TEXT);
            let left = null;
            for (let node, start = 0; (node = walker.nextNode()) && left === null; start += node.length) {
              if (${tag} >= start + node.length) continue;
              const range = document.createRange();
              range.setStart(node, ${tag} - start);
              range.setEnd(node, ${tag} - start + 1);
              left = range.getBoundingClientRect().left;
            }
            return { text: getSelection().toString(), gaps, startsAtTag: Math.abs(boxes[0].left - left) <= 1 };
          })()`);
          expect(selection).toEqual({ text: line.slice(tag), gaps: 0, startsAtTag: true });
        });
      },
    );

    const LINE = '<h1>سلام دنیا</h1>';

    /** Puts the caret at the start of LINE, freshly typed. */
    async function start() {
      await pick(tab, 'HTML');
      await clear(tab);
      await tab.type(LINE);
      await tab.press('Home');
    }

    it('reaches every position with the arrow keys, the caret always moving the way pressed', async () => {
      await start();
      const walk = [await caret(tab)];
      for (let i = 0; i < LINE.length; i++) {
        await tab.press('ArrowRight');
        walk.push(await caret(tab));
      }
      // Arrows move visually (as in a textarea): through the Farsi run
      // logical offsets count down, but every one of them is visited once…
      const offsets = walk.map((c) => c.offset);
      expect([...offsets].sort((a, b) => a - b)).toEqual([...Array(LINE.length + 1).keys()]);
      // …and the caret only ever moves right on screen.
      for (let i = 1; i < walk.length; i++) expect(walk[i].x).toBeGreaterThanOrEqual(walk[i - 1].x);
      expect(walk.at(-1)!.x).toBeGreaterThan(walk[0].x);
    });

    it('highlights a selection inside the Farsi run as one contiguous block', async () => {
      await start();
      for (let i = 0; i < 4; i++) await tab.press('ArrowRight'); // just past <h1>
      for (let i = 0; i < 4; i++) await tab.press('ArrowRight', 8); // Shift
      const selection = await tab.evaluate<{ text: string; blocks: number }>(`(async () => {
        ${lib}
        await frames();
        return {
          text: getSelection().toString(),
          blocks: panel().querySelectorAll('.cm-selectionBackground').length,
        };
      })()`);
      expect(selection).toEqual({ text: 'سلام ', blocks: 1 });
    });

    it('deletes the logically previous letter with Backspace', async () => {
      await start();
      // Walk right until the caret sits after «سلام» (offset 8).
      for (let i = 0; i < LINE.length && (await caret(tab)).offset !== 8; i++) await tab.press('ArrowRight');
      expect((await caret(tab)).offset).toBe(8);
      await tab.press('Backspace');
      expect(await paneText(tab)).toBe('<h1>سلا دنیا</h1>');
    });

    it('deletes the logically next letter with Delete', async () => {
      await start();
      // Just past <h1>, before «سلام» (offset 4).
      for (let i = 0; i < 4; i++) await tab.press('ArrowRight');
      expect((await caret(tab)).offset).toBe(4);
      await tab.press('Delete');
      expect(await paneText(tab)).toBe('<h1>لام دنیا</h1>');
    });

    it('puts the caret on the clicked side of a Farsi letter', async () => {
      await start();
      /** Clicks inside a character of LINE, by its offset, near its left or right edge. */
      const click = async (offset: number, side: 'left' | 'right') => {
        const point = await tab.evaluate<{ x: number; y: number }>(`(() => {
          ${lib}
          const walker = document.createTreeWalker(content().querySelector('.cm-line'), NodeFilter.SHOW_TEXT);
          for (let node, start = 0; (node = walker.nextNode()); start += node.length) {
            if (${offset} >= start + node.length) continue;
            const range = document.createRange();
            range.setStart(node, ${offset} - start);
            range.setEnd(node, ${offset} - start + 1);
            const box = range.getBoundingClientRect();
            return { x: ${side === 'left'} ? box.left + 1.5 : box.right - 1.5, y: box.top + box.height / 2 };
          }
        })()`);
        for (const type of ['mousePressed', 'mouseReleased']) {
          await tab.send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 });
        }
        return (await caret(tab)).offset;
      };
      // «ل» (offset 5) reads right to left: its right edge is before it, its left edge after.
      expect([await click(5, 'right'), await click(5, 'left'), await click(1, 'left'), await click(1, 'right')]).toEqual([
        5, 6, 1, 2,
      ]);
    });

    it('draws Farsi in IRANYekanXFaNum, code and line numbers in JetBrains Mono', async () => {
      await pick(tab, 'HTML');
      await clear(tab);
      await tab.type('<b>سلام</b>');
      const line = '[role="tabpanel"] .cm-line';
      expect({
        farsi: await drawnIn(tab, line),
        tag: await drawnIn(tab, `${line} .code-tag:not(:empty)`),
        lineNumber: await drawnIn(tab, '[role="tabpanel"] .cm-lineNumbers .cm-activeLineGutter'),
      }).toEqual({
        farsi: ['IRANYekanXFaNum'],
        tag: ['JetBrains Mono'],
        lineNumber: ['JetBrains Mono'],
      });
    });
  });
});

/** Clicks a tab and reports the fades running in the pane right after. */
const switchTo = (tab: BrowserPage, label: string) =>
  tab.evaluate<{
    fades: { on: string; opacity: string; duration: number }[];
    outgoing: { text: string; hidden: boolean; inert: boolean } | null;
  }>(`(async () => {
    ${lib}
    tabs().find((t) => t.textContent.trim() === ${JSON.stringify(label)}).click();
    await waitFor(() => content().getAttribute('aria-label') === ${JSON.stringify(`کد ${label}`)});
    const live = panel().querySelector('.cm-editor');
    const outgoing = panel().querySelector('.cm-editor[aria-hidden="true"]');
    const fades = panel()
      .getAnimations({ subtree: true })
      .filter((a) => !(a instanceof CSSAnimation)) // not the caret's blink
      .map((a) => ({
        on: a.effect.target === live ? 'incoming' : a.effect.target === outgoing ? 'outgoing' : 'other',
        opacity: a.effect.getKeyframes().map((k) => k.opacity).join(' → '),
        duration: a.effect.getTiming().duration,
      }))
      .sort((a, b) => a.on.localeCompare(b.on));
    return {
      fades,
      outgoing: outgoing && {
        text: [...outgoing.querySelectorAll('.cm-line')].map((l) => l.textContent).join('\\n'),
        hidden: outgoing.getAttribute('aria-hidden') === 'true',
        inert: outgoing.inert,
      },
    };
  })()`);

describe.skipIf(!chromePath)('Code Pane tab switch', () => {
  it('crossfades from one file to the next over 150ms', async () => {
    const tab = await openEditor(site.origin, { reducedMotion: false });
    try {
      await clear(tab);
      await tab.type('<p>html</p>');
      const { fades, outgoing } = await switchTo(tab, 'CSS');
      expect(fades).toEqual([
        { on: 'incoming', opacity: '0 → 1', duration: 150 },
        { on: 'outgoing', opacity: '1 → 0', duration: 150 },
      ]);
      // The outgoing file is a picture only: hidden from assistive tech, not focusable.
      expect(outgoing).toEqual({ text: '<p>html</p>', hidden: true, inert: true });
      const after = await tab.evaluate<{ editors: number; opacity: string }>(`(async () => {
        ${lib}
        // Gone once faded (generous budget: a busy machine may drop frames).
        await waitFor(() => panel().querySelectorAll('.cm-editor').length === 1, 2000);
        return {
          editors: panel().querySelectorAll('.cm-editor').length,
          opacity: getComputedStyle(panel().querySelector('.cm-editor')).opacity,
        };
      })()`);
      expect(after).toEqual({ editors: 1, opacity: '1' });
    } finally {
      await tab.close();
    }
  });

  it('switches at once under reduced motion', async () => {
    const tab = await openEditor(site.origin, { reducedMotion: true });
    try {
      await clear(tab);
      await tab.type('<p>html</p>');
      expect(await switchTo(tab, 'CSS')).toEqual({ fades: [], outgoing: null });
    } finally {
      await tab.close();
    }
  });
});