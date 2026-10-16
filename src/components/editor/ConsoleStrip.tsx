import { useState } from 'react';
import { COPY } from '../../site';

const LOG_ID = 'editor-console-log';

/**
 * The console strip under the Preview, collapsed by default. Its log stays
 * empty until the Preview's console bridge feeds it (ticket 03).
 */
export default function ConsoleStrip() {
  const [open, setOpen] = useState(false);
  return (
    <div data-console className="editor-console">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={LOG_ID}
        onClick={() => setOpen((o) => !o)}
        className="editor-console-toggle"
      >
        {COPY.editor.console}
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="editor-chevron">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ol id={LOG_ID} hidden={!open} className="editor-console-log" />
    </div>
  );
}
