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

/** `HTML` · `CSS` · `JS` tabs over the Code Pane (WAI-ARIA tabs pattern). */
export default function TabBar({ active, onSelect, panelId, label }: Props) {
  return (
    <div role="tablist" aria-label={label} className="editor-tabs">
      {FILES.map((file) => {
        const selected = file.id === active;
        return (
          <button
            key={file.id}
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
