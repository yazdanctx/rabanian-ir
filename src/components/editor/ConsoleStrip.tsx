import { spring } from 'motion';
import { animate } from 'motion/mini';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { COPY } from '../../site';
import { consoleEntry, type ConsoleEntry } from './consoleBridge';

const LOG_ID = 'editor-console-log';

/** Expand/collapse: a 200ms height spring, no bounce (spec: Motion). */
const EXPAND = { type: spring, duration: 0.2, bounce: 0 } as const;

/** Entries kept: the newest. Bounds a learner's runaway `setInterval` log. */
const MAX_ENTRIES = 500;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  // Still shown while it springs shut, hidden once closed.
  const [closing, setClosing] = useState(false);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const body = useRef<HTMLDivElement>(null);
  const spinning = useRef<ReturnType<typeof animate> | null>(null);
  const toggled = useRef(false);

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
      if (entry) setEntries((list) => [...list.slice(1 - MAX_ENTRIES), entry]);
    }
    addEventListener('message', onMessage);
    return () => removeEventListener('message', onMessage);
  }, [frameRef]);

  function toggle() {
    toggled.current = true;
    setOpen(!open);
    setClosing(open && !reducedMotion());
  }

  // Before paint, so an opening body never flashes at full height.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el || !toggled.current) return;
    // From wherever an interrupted spring left it.
    const from = spinning.current || !open ? el.getBoundingClientRect().height : 0;
    spinning.current?.stop();
    spinning.current = null;
    if (reducedMotion()) {
      el.style.height = '';
      return;
    }
    const to = open ? el.scrollHeight : 0;
    const run = animate(el, { height: [`${from}px`, `${to}px`] }, EXPAND);
    spinning.current = run;
    run.finished.then(() => {
      if (spinning.current !== run) return;
      spinning.current = null;
      // Open: back to its natural height, to grow with new entries. Closed:
      // hidden, keeping height 0 for the next opening.
      if (open) el.style.height = '';
      else setClosing(false);
    });
  }, [open]);

  return (
    <div data-console className="editor-console">
      <div className="editor-console-head">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={LOG_ID}
          // With entries, named with their count, which shows even collapsed.
          aria-label={entries.length ? COPY.editor.consoleLabel(entries.length) : undefined}
          onClick={toggle}
          className="editor-console-toggle"
        >
          <span className="editor-console-title">
            {COPY.editor.console}
            {entries.length > 0 && <span className="editor-console-count">{entries.length}</span>}
          </span>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="editor-chevron">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <button type="button" onClick={() => setEntries([])} className="editor-button editor-console-clear">
            {COPY.editor.clearConsole}
          </button>
        )}
      </div>
      <div ref={body} id={LOG_ID} hidden={!open && !closing} className="editor-console-body">
        <ol className="editor-console-log">
          {entries.map((entry, index) => (
            <li key={index} data-level={entry.level} dir="auto" className="editor-console-entry">
              {entry.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
