/*
 * The faces ride inside the document as data: URLs, so a downloaded
 * index.html shows them with no server behind it.
 */
import regular from '../../assets/fonts/fa/IRANYekanXFaNum-Regular.woff2?inline';
import bold from '../../assets/fonts/fa/IRANYekanXFaNum-Bold.woff2?inline';
import { CONSOLE_BRIDGE } from './consoleBridge';
import type { Files } from './files';

const face = (src: string, weight: number) =>
  `@font-face{font-family:IRANYekanXFaNum;src:url(${src}) format('woff2');font-weight:${weight};font-display:swap}`;

/** Our base style: Yekan, with Persian digit outlines, for everything the visitor writes. */
const BASE_CSS = `${face(regular, 400)}${face(bold, 700)}body{font-family:IRANYekanXFaNum,system-ui;margin:16px}`;

/**
 * `text` made safe to sit inside `<tag>…</tag>`: any `</tag` in it (a string
 * like `'</script>'`, any case) would end the element early, so it becomes
 * `<\/tag`, which JS strings and CSS both still read as `</tag`.
 */
const inside = (tag: 'script' | 'style', text: string) => text.replace(new RegExp(`</(${tag})`, 'gi'), '<\\/$1');

/**
 * Whether the HTML tab holds a Full Page, a whole document of its own (what
 * an AI or a tutorial hands over), not body content: it opens, after any
 * comments, with `<!DOCTYPE …>` or `<html>`.
 */
export const isFullPage = (html: string) => /^\s*(?:<!--[\s\S]*?-->\s*)*<(?:!doctype|html)[\s>]/i.test(html);

/**
 * `script` placed first in the Full Page's head: after `<head>`, else after
 * `<html>` (the parser opens the head for it), else after the doctype,
 * which must stay first.
 */
function first(page: string, script: string): string {
  for (const tag of [/<head(?:\s[^>]*)?>/i, /<html(?:\s[^>]*)?>/i, /<!doctype[^>]*>/i]) {
    const found = tag.exec(page);
    if (found) {
      const end = found.index + found[0].length;
      return page.slice(0, end) + script + page.slice(end);
    }
  }
  return script + page;
}

export interface BuildOptions {
  /**
   * Run the console bridge first, so the console strip sees everything the
   * page's scripts log or throw. On by default; off for the downloaded
   * index.html.
   */
  consoleBridge?: boolean;
}

/**
 * The visitor's three files as one page (spec: Preview): Farsi and
 * right-to-left by default, Yekan available, their CSS after ours, their HTML
 * as the body and their JS last. The `<html>`/`<head>` wrapper is ours; they
 * override direction with `dir` on their elements or `html { direction }`.
 * The console bridge closes the head, so it runs before any of their scripts,
 * those in the HTML included.
 *
 * A Full Page is the page as it is, as in Amin's original tool: none of our
 * wrapper, style or fonts, and not the CSS and JS tabs either (what is left
 * in them was written for other HTML). Only the console bridge goes in,
 * first in its head.
 */
export function buildDocument({ html, css, js }: Files, { consoleBridge = true }: BuildOptions = {}): string {
  const bridge = consoleBridge ? `<script>${CONSOLE_BRIDGE}</script>` : '';
  if (isFullPage(html)) return first(html, bridge);
  return (
    '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">' +
    `<style>${BASE_CSS}</style><style>${inside('style', css)}</style>${bridge}</head>` +
    `<body>${html}<script>${inside('script', js)}</script></body></html>`
  );
}
