import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { STARTER_TEMPLATE } from '../src/components/editor/starterTemplate';
import { PALETTE } from '../src/palette';

/*
 * The Starter Template (spec: Starter Template): three short files with Farsi
 * comments. What its JS does on a click is checked in the browser
 * (tests/workspace-browser.test.ts).
 */

const { html, css, js } = STARTER_TEMPLATE;
const body = parseHTML(`<!doctype html><html><body>${html}</body></html>`).document.body;

const FARSI = /[؀-ۿ]/;

/** Every comment in the three files, delimiters stripped. */
const comments = [
  ...[...html.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]),
  ...[...css.matchAll(/\/\*([\s\S]*?)\*\//g)].map((m) => m[1]),
  ...[...js.matchAll(/\/\/(.*)/g)].map((m) => m[1]),
].map((c) => c.trim());

describe('Starter Template', () => {
  it('HTML: a «سلام دنیا» heading, a Farsi paragraph and a button with id="greet"', () => {
    expect(body.querySelector('h1')?.textContent).toBe('سلام دنیا');
    expect(body.querySelector('p')?.textContent).toMatch(FARSI);
    expect(body.querySelector('button')?.id).toBe('greet');
  });

  it('HTML: says in a comment that the page is right to left by default, and how to turn an element', () => {
    const notes = [...html.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]).join('\n');
    expect(notes).toMatch(/راست‌به‌چپ/);
    expect(notes).toMatch(/dir="ltr"/);
  });

  it('CSS: styles the page and the button in palette P colours only', () => {
    expect(css).toMatch(/(^|\n)body\s*{/);
    expect(css).toMatch(/(^|\n)#greet\s*{/);
    const palette = Object.values(PALETTE).map((hex) => hex.toUpperCase());
    const used = [...css.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)].map((m) => m[0].toUpperCase());
    expect(used.length).toBeGreaterThan(0);
    for (const colour of used) expect(palette).toContain(colour);
  });

  it('CSS: names each rule\'s selector in a comment', () => {
    for (const selector of ['body', 'h1', '#greet']) {
      expect(comments.some((c) => c.startsWith(`${selector}:`))).toBe(true);
    }
  });

  it('comments in all three files, in Farsi', () => {
    for (const file of [html, css, js]) {
      expect(comments.filter((c) => file.includes(c)).some((c) => FARSI.test(c))).toBe(true);
    }
  });

  it('keeps Latin in a Farsi comment to a leading label, so the left-to-right Code Pane shows it in reading order', () => {
    // After the first Farsi letter: only Farsi, spaces, ZWNJ, «», and Farsi punctuation.
    for (const comment of comments.filter((c) => FARSI.test(c))) {
      const farsi = comment.slice(comment.search(FARSI));
      expect(farsi, comment).toMatch(/^[؀-ۿ‌ «»]+$/);
    }
  });
});
