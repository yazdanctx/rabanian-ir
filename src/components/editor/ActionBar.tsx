import { useEffect, useRef, type ReactNode } from 'react';
import { COPY } from '../../site';

interface Props {
  /** «اجرای کد»: rebuild the Preview now. */
  onRun: () => void;
  /** «بازنشانی»: ask, in a dialog, before emptying the three files. */
  onReset: () => void;
  /** «دانلود index.html»: the page as one index.html. */
  onDownload: () => void;
  /** Whether the Preview fills the screen: then the bar holds only «خروج از تمام‌صفحه». */
  fullscreen: boolean;
  /** «تمام‌صفحه پیش‌نمایش» (true) and «خروج از تمام‌صفحه» (false). */
  onFullscreen: (fullscreen: boolean) => void;
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
  /** Four corners pulled out to the screen's edges. */
  fullscreen: <path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5" {...stroke} />,
  close: <path d="M6 6l12 12M18 6 6 18" {...stroke} />,
} satisfies Record<string, ReactNode>;

function Glyph({ name }: { name: keyof typeof icons }) {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" className="editor-button-icon">
      {icons[name]}
    </svg>
  );
}

/**
 * The editor's actions (spec: Layout), named as in Amin's original tool.
 * «اجرای کد» comes last, so it sits at the far left of the RTL bar, the end
 * the eye reaches last. While the Preview fills the screen, the one action is
 * leaving it; focus follows the switch both ways, so the keyboard stays on
 * the button that undoes it.
 */
export default function ActionBar({ onRun, onReset, onDownload, fullscreen, onFullscreen }: Props) {
  const { run, reset, download } = COPY.editor;
  const enter = useRef<HTMLButtonElement>(null);
  const exit = useRef<HTMLButtonElement>(null);
  const shown = useRef(fullscreen);

  useEffect(() => {
    if (shown.current === fullscreen) return;
    shown.current = fullscreen;
    (fullscreen ? exit : enter).current?.focus();
  }, [fullscreen]);

  if (fullscreen) {
    return (
      <div data-actions className="editor-actions">
        <button ref={exit} type="button" onClick={() => onFullscreen(false)} className="editor-button">
          <Glyph name="close" />
          {COPY.editor.exitFullscreen}
        </button>
      </div>
    );
  }

  return (
    <div data-actions className="editor-actions">
      <button type="button" onClick={onReset} className="editor-button">
        <Glyph name="reset" />
        {reset}
      </button>
      <button type="button" onClick={onDownload} className="editor-button">
        <Glyph name="download" />
        {download}
      </button>
      <button ref={enter} type="button" onClick={() => onFullscreen(true)} className="editor-button">
        <Glyph name="fullscreen" />
        {COPY.editor.fullscreen}
      </button>
      <button type="button" onClick={onRun} className="editor-button editor-button-primary">
        <Glyph name="run" />
        {run}
      </button>
    </div>
  );
}
