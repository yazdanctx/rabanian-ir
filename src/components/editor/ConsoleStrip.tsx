import { useEffect, useState, type RefObject } from 'react';
import { COPY } from '../../site';
import { consoleEntry, type ConsoleEntry } from './consoleBridge';

const LOG_ID = 'editor-console-log';

interface Props {
  /** The Preview frame: the only window whose messages are listed. */
  frameRef: RefObject<HTMLIFrameElement | null>;
  /** The Preview's build id. A new build starts an empty console. */
  build: number;
}

/**
 * The console strip under the Preview, collapsed by default: the Preview's
 * console output and uncaught errors, newest last, as the console bridge
 * posts them. Messages from any other window are ignored.
 */
export default function ConsoleStrip({ frameRef, build }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);

  // Cleared during render, so in the same commit that mounts the new frame:
  // nothing the new build posts can arrive before the reset.
  const [shownBuild, setShownBuild] = useState(build);
  if (build !== shownBuild) {
    setShownBuild(build);
    setEntries([]);
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frame = frameRef.current?.contentWindow;
      if (!frame || event.source !== frame) return;
      const entry = consoleEntry(event.data);
      if (entry) setEntries((list) => [...list, entry]);
    }
    addEventListener('message', onMessage);
    return () => removeEventListener('message', onMessage);
  }, [frameRef]);

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
      <ol id={LOG_ID} hidden={!open} className="editor-console-log">
        {entries.map((entry, index) => (
          <li key={index} data-level={entry.level} dir="auto" className="editor-console-entry">
            {entry.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
