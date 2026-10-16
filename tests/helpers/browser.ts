import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { distDir } from './dist';

/**
 * A headless Chrome driven over the DevTools protocol, for tests that need a
 * real browser (layout, IntersectionObserver, animations, media emulation).
 * `chromePath` is undefined when no Chrome is installed; skip such tests then.
 */
export const chromePath = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((p): p is string => !!p && existsSync(p));

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
};

/** Serves dist/ over HTTP (module scripts don't load from file://). */
export async function serveDist(): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    if (path.endsWith('/')) path += 'index.html';
    const file = join(distDir, path);
    if (!file.startsWith(distDir) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

export interface PageOptions {
  /** Emulate `prefers-reduced-motion: reduce`. */
  reducedMotion?: boolean;
  /** Run the page with JavaScript disabled. */
  noScript?: boolean;
  width?: number;
  height?: number;
}

export interface BrowserPage {
  /** Evaluates an expression in the page (promises are awaited). */
  evaluate<T>(expression: string): Promise<T>;
  /** Sends a raw DevTools protocol command to the page. */
  send(method: string, params?: object): Promise<any>;
  /** Types text into the focused element as the keyboard would (Farsi included). */
  type(text: string): Promise<void>;
  /**
   * Presses and releases one key, e.g. `'ArrowRight'` or `'z'`, holding
   * `modifiers` (a bitmask: Alt 1, Ctrl 2, Meta 4, Shift 8).
   */
  press(key: string, modifiers?: number): Promise<void>;
  close(): Promise<void>;
}

/** Key codes for `BrowserPage.press`; letters map to their `Key*` codes. */
const keyCodes: Record<string, [code: string, keyCode: number]> = {
  ArrowLeft: ['ArrowLeft', 37],
  ArrowUp: ['ArrowUp', 38],
  ArrowRight: ['ArrowRight', 39],
  ArrowDown: ['ArrowDown', 40],
  Home: ['Home', 36],
  End: ['End', 35],
  Backspace: ['Backspace', 8],
  Delete: ['Delete', 46],
  Enter: ['Enter', 13],
  Tab: ['Tab', 9],
  Escape: ['Escape', 27],
};

function keyEvent(key: string, modifiers: number) {
  const [code, keyCode] = keyCodes[key] ?? [`Key${key.toUpperCase()}`, key.toUpperCase().charCodeAt(0)];
  const text = key === 'Enter' ? '\r' : key.length === 1 ? key : undefined;
  return {
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    modifiers,
    ...(text && !(modifiers & 7) ? { text, unmodifiedText: text } : {}),
  };
}

/** Launches Chrome, opens `url` with the given emulation, resolves on load. */
export async function openPage(url: string, options: PageOptions = {}): Promise<BrowserPage> {
  const { reducedMotion = false, noScript = false, width = 390, height = 844 } = options;
  const profile = mkdtempSync(join(tmpdir(), 'rabanian-chrome-'));
  const chrome: ChildProcess = spawn(
    chromePath!,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--window-size=${width},${height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const portFile = join(profile, 'DevToolsActivePort');
  // Chrome may create the file before writing the port into it.
  const readPort = () => (existsSync(portFile) ? readFileSync(portFile, 'utf8').split('\n')[0] : '');
  for (let i = 0; i < 200 && !/^\d+$/.test(readPort()); i++) await sleep(50);
  const port = readPort();
  const targets: { type: string; webSocketDebuggerUrl: string }[] = await (
    await fetch(`http://127.0.0.1:${port}/json/list`)
  ).json();
  const socket = new WebSocket(targets.find((t) => t.type === 'page')!.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map<number, (message: any) => void>();
  const listeners = new Map<string, () => void>();
  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id !== undefined) pending.get(message.id)?.(message);
    else listeners.get(message.method)?.();
  };
  const send = (method: string, params: object = {}) =>
    new Promise<any>((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) => {
        pending.delete(id);
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else resolve(message.result);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  if (reducedMotion) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  }
  if (noScript) await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Page.enable');
  const loaded = new Promise<void>((resolve) => listeners.set('Page.loadEventFired', resolve));
  await send('Page.navigate', { url });
  await loaded;

  return {
    send,
    async type(text: string) {
      await send('Input.insertText', { text });
    },
    async press(key: string, modifiers = 0) {
      const event = keyEvent(key, modifiers);
      await send('Input.dispatchKeyEvent', { type: 'text' in event ? 'keyDown' : 'rawKeyDown', ...event });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
    },
    async evaluate<T>(expression: string) {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
      return result.value as T;
    },
    async close() {
      socket.close();
      chrome.kill();
      if (chrome.exitCode === null) await new Promise((resolve) => chrome.once('exit', resolve));
      // Chrome's helper processes can still be writing to the profile for a
      // moment after the browser exits (ENOTEMPTY); retry instead of failing.
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    },
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
