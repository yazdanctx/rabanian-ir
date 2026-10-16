import type { ReactNode } from 'react';
import { COPY } from '../../site';

interface Props {
  /** «اجرا»: rebuild the Preview now. */
  onRun: () => void;
  /** «بازنشانی»: ask, in a dialog, before going back to the Starter Template. */
  onReset: () => void;
  /** «دانلود»: the three files as one index.html. */
  onDownload: () => void;
}

/** Line glyphs in the site's style (Icon.astro: 24×24, round strokes). */
const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const icons = {
  /** Play: points right in RTL too, like every media control. */
  run: <path d="M8 5.5v13l10-6.5z" fill="currentColor" {...stroke} />,
  /** Back to the start: a counter-clockwise arrow. */
  reset: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6" {...stroke} />
      <path d="M4 4v4.6h4.6" {...stroke} />
    </>
  ),
  download: <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" {...stroke} />,
  home: (
    <>
      <path d="M4 11 12 4l8 7" {...stroke} />
      <path d="M6 9.5V20h12V9.5M10 20v-5h4v5" {...stroke} />
    </>
  ),
} satisfies Record<string, ReactNode>;

function Glyph({ name }: { name: keyof typeof icons }) {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" className="editor-button-icon">
      {icons[name]}
    </svg>
  );
}

/**
 * The editor's only actions (spec: Layout). «اجرا» comes last, so it sits at
 * the far left of the RTL bar, the end the eye reaches last. Before them, a
 * house: the way back to the home page, since this page has no top bar.
 */
export default function ActionBar({ onRun, onReset, onDownload }: Props) {
  const { home, run, reset, download } = COPY.editor;
  return (
    <div data-actions className="editor-actions">
      <a href="/" aria-label={home} title={home} className="editor-button editor-home">
        <Glyph name="home" />
      </a>
      <button type="button" onClick={onReset} className="editor-button">
        <Glyph name="reset" />
        {reset}
      </button>
      <button type="button" onClick={onDownload} className="editor-button">
        <Glyph name="download" />
        {download}
      </button>
      <button type="button" onClick={onRun} className="editor-button editor-button-primary">
        <Glyph name="run" />
        {run}
      </button>
    </div>
  );
}
