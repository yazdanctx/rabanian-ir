import { useRef, type KeyboardEvent } from 'react';
import { FILES, type FileId } from './files';

/** The DOM id of a file's tab, for the tab panel's `aria-labelledby`. */
export const tabId = (file: FileId) => `editor-tab-${file}`;

interface Props {
  active: FileId;
  onSelect: (file: FileId) => void;
  /** DOM id of the tab panel every tab controls (the single Code Pane). */
  panelId: string;
  /** Accessible name of the tab list. */
  label: string;
}

/**
 * `HTML` · `CSS` · `JS` tabs over the Code Pane (WAI-ARIA tabs, automatic
 * activation): one tab in the Tab order; arrow keys move selection and focus
 * in reading order, so in RTL ArrowLeft goes forward; Home/End jump to the ends.
 */
export default function TabBar({ active, onSelect, panelId, label }: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = FILES.findIndex((file) => file.id === active);
    const forward = getComputedStyle(event.currentTarget).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const last = FILES.length - 1;
    const next = {
      [forward]: current === last ? 0 : current + 1,
      [forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft']: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(FILES[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="editor-tabs">
      {FILES.map((file, index) => {
        const selected = file.id === active;
        return (
          <button
            key={file.id}
            ref={(button) => {
              buttons.current[index] = button;
            }}
            type="button"
            role="tab"
            id={tabId(file.id)}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(file.id)}
            className="editor-tab"
          >
            {file.label}
          </button>
        );
      })}
    </div>
  );
}
