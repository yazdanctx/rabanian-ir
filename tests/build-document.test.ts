import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { buildDocument, isFullPage } from '../src/components/editor/buildDocument';
import { CONSOLE_BRIDGE } from '../src/components/editor/consoleBridge';

/*
 * The page the Preview renders and «دانلود index.html» saves (spec: Preview):
 * the three files inside our Farsi, right-to-left wrapper, or a Full Page as
 * it is.
 */

/** The built page as a DOM. */
const dom = (source: string) => parseHTML(source).document as unknown as Document;

const files = {
  html: '<h1>سلام دنیا</h1>',
  css: 'h1 { color: #0d5be0 }',
  js: "console.log('سلام')",
};

describe('buildDocument', () => {
  it('opens a Farsi, right-to-left, UTF-8 document', () => {
    expect(buildDocument(files)).toMatch(
      /^<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">/,
    );
  });

  it('embeds IRANYekanXFaNum Regular and Bold as data: URLs, so a downloaded page needs no server', () => {
    const [base] = dom(buildDocument(files)).querySelectorAll('head style');
    const faces = [...(base.textContent ?? '').matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
    const embedded = faces.map((face) => {
      expect(face).toMatch(/font-family:\s*["']?IRANYekanXFaNum["']?\s*;/);
      expect(face).toMatch(/font-display:\s*swap/);
      const data = face.match(
        /url\(["']?data:font\/woff2;base64,([^)"']+)["']?\)\s*format\(["']?woff2["']?\)/,
      )?.[1];
      return { weight: face.match(/font-weight:\s*(\d+)/)?.[1], bytes: Buffer.from(data ?? '', 'base64') };
    });
    const font = (name: string) => readFileSync(`src/assets/fonts/fa/IRANYekanXFaNum-${name}.woff2`);
    expect(embedded.map((face) => face.weight)).toEqual(['400', '700']);
    expect(embedded[0].bytes.equals(font('Regular'))).toBe(true);
    expect(embedded[1].bytes.equals(font('Bold'))).toBe(true);
  });

  it("sets the body in IRANYekanXFaNum with a 16px margin, before the visitor's CSS", () => {
    const styles = [...dom(buildDocument(files)).querySelectorAll('head style')].map((s) => s.textContent);
    expect(styles).toHaveLength(2);
    expect(styles[0]).toMatch(/body\s*{\s*font-family:\s*IRANYekanXFaNum,\s*system-ui;\s*margin:\s*16px;?\s*}/);
    expect(styles[1]).toBe(files.css);
  });

  it("runs the console bridge in the head, after the styles, so it hears every script on the visitor's page", () => {
    const head = dom(buildDocument(files)).head;
    expect([...head.children].map((el) => el.localName)).toEqual(['meta', 'style', 'style', 'script']);
    const bridge = head.querySelector('script')!;
    expect(bridge.textContent).toMatch(/parent\.postMessage\(/);
    expect(bridge.textContent).toMatch(/['"]rabanian-editor['"]/);
  });

  it("puts the visitor's HTML in the body, then the visitor's JS", () => {
    const body = dom(buildDocument(files)).body;
    expect([...body.children].map((el) => el.localName)).toEqual(['h1', 'script']);
    expect(body.querySelector('h1')?.textContent).toBe('سلام دنیا');
    expect(body.querySelector('script')?.textContent).toBe(files.js);
  });

  it('leaves the console bridge out when asked, for the downloaded page', () => {
    const page = dom(buildDocument(files, { consoleBridge: false }));
    expect(page.head.querySelector('script')).toBeNull();
    expect([...page.body.children].map((el) => el.localName)).toEqual(['h1', 'script']);
    expect(page.body.querySelector('script')?.textContent).toBe(files.js);
    expect(buildDocument(files, { consoleBridge: false })).not.toMatch(/postMessage|rabanian-editor/);
  });

  it.each([
    { page: 'the Preview', options: {} },
    { page: 'the download', options: { consoleBridge: false } },
  ])('keeps «</script>» in the JS and «</style>» in the CSS from ending them early, in $page', ({ options }) => {
    const tricky = {
      html: '<p>سلام</p>',
      css: 'p::after { content: "</style>" } p::before { content: "</STYLE >" }',
      js: "console.log('</script>'); console.log(`</Script >`);",
    };
    const page = dom(buildDocument(tricky, options));
    const styles = [...page.querySelectorAll('head style')];
    expect(styles).toHaveLength(2);
    // `<\/` is still `</` to CSS and in a JS string, but no end tag to HTML.
    expect(styles[1].textContent).toBe('p::after { content: "<\\/style>" } p::before { content: "<\\/STYLE >" }');
    expect([...page.body.children].map((el) => el.localName)).toEqual(['p', 'script']);
    expect(page.body.querySelector('script')?.textContent).toBe(
      "console.log('<\\/script>'); console.log(`<\\/Script >`);",
    );
  });
});

describe('a Full Page in the HTML tab', () => {
  const page = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <style>body { margin: 0 }</style>',
    '</head>',
    '<body><h1>Hello</h1><script>console.log(1)</script></body>',
    '</html>',
  ].join('\n');
  const bridge = `<script>${CONSOLE_BRIDGE}</script>`;

  it.each([
    page,
    '<!doctype html><p>سلام</p>',
    '<html dir="rtl"><body>سلام</body></html>',
    '\n  <!-- my page -->\n<!DOCTYPE html><html></html>',
  ])('is told by its opening doctype or <html>: %j', (html) => {
    expect(isFullPage(html)).toBe(true);
  });

  it.each([
    '<h1>سلام دنیا</h1>',
    '<header>سلام</header>',
    '<htmlx></htmlx>',
    '<p>سلام</p>\n<!DOCTYPE html>',
    '<!-- <!DOCTYPE html> -->\n<p>سلام</p>',
  ])('is not body content: %j', (html) => {
    expect(isFullPage(html)).toBe(false);
  });

  it('is downloaded exactly as written, without the CSS and JS tabs', () => {
    expect(buildDocument({ html: page, css: 'h1 { color: red }', js: 'alert(1)' }, { consoleBridge: false })).toBe(
      page,
    );
  });

  it('is previewed as written, with only the console bridge, first in its head', () => {
    const built = buildDocument({ html: page, css: 'h1 { color: red }', js: 'alert(1)' });
    expect(built).toBe(page.replace('<head>', `<head>${bridge}`));
    const head = dom(built).head;
    expect([...head.children].map((el) => el.localName)).toEqual(['script', 'meta', 'style']);
  });

  it('gets the bridge after <html> where it has no <head>, else after the doctype, which stays first', () => {
    expect(buildDocument({ html: '<!DOCTYPE html><html lang="en"><body>x</body></html>', css: '', js: '' })).toBe(
      `<!DOCTYPE html><html lang="en">${bridge}<body>x</body></html>`,
    );
    expect(buildDocument({ html: '<!DOCTYPE html><p>x</p>', css: '', js: '' })).toBe(
      `<!DOCTYPE html>${bridge}<p>x</p>`,
    );
  });
});
