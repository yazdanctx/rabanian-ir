/*
 * The sandboxed Preview has an opaque (`null`) origin, so a font fetched by
 * URL, even from this host, is a cross-origin request the server would have to
 * allow (CORS). The faces ride inside the document as data: URLs instead,
 * which also keeps a downloaded index.html self-contained.
 */
import regular from '../../assets/fonts/fa/IRANYekanXFaNum-Regular.woff2?inline';
import bold from '../../assets/fonts/fa/IRANYekanXFaNum-Bold.woff2?inline';
import { CONSOLE_BRIDGE } from './consoleBridge';
import type { Files } from './files';

const face = (src: string, weight: number) =>
  `@font-face{font-family:IRANYekanXFaNum;src:url(${src}) format('woff2');font-weight:${weight};font-display:swap}`;

/** Our base style: Yekan, with Persian digit outlines, for everything the learner writes. */
const BASE_CSS = `${face(regular, 400)}${face(bold, 700)}body{font-family:IRANYekanXFaNum,system-ui;margin:16px}`;

export interface BuildOptions {
  /**
   * Run the console bridge before the learner's JS, so the console strip
   * sees its output. On by default; off for the downloaded index.html.
   */
  consoleBridge?: boolean;
}

/**
 * The learner's three files as one page (spec: Preview): Farsi and
 * right-to-left by default, Yekan available, their CSS after ours, their HTML
 * as the body and their JS last. The `<html>`/`<head>` wrapper is ours; they
 * override direction with `dir` on their elements or `html { direction }`.
 */
export function buildDocument({ html, css, js }: Files, { consoleBridge = true }: BuildOptions = {}): string {
  const bridge = consoleBridge ? `<script>${CONSOLE_BRIDGE}</script>` : '';
  return (
    '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">' +
    `<style>${BASE_CSS}</style><style>${css}</style></head>` +
    `<body>${html}${bridge}<script>${js}</script></body></html>`
  );
}
