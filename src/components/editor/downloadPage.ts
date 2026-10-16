import { buildDocument } from './buildDocument';
import type { Files } from './files';

/** How long the download's blob URL is kept: enough for any browser to start saving it. */
const KEEP_URL_MS = 60_000;

/**
 * «دانلود»: saves the three files as one `index.html`, the Preview's page
 * (CSS in `<style>`, JS in `<script>`, the fonts inline) without the console
 * bridge, so it opens on its own in any browser.
 */
export function downloadPage(files: Files) {
  const page = buildDocument(files, { consoleBridge: false });
  const url = URL.createObjectURL(new Blob([page], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'index.html';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), KEEP_URL_MS);
}
