import { COPY } from '../../site';

interface Props {
  /** «اجرا»: rebuild the Preview now. */
  onRun: () => void;
  /** «بازنشانی»: back to the Starter Template, after a confirm. */
  onReset: () => void;
  /** «دانلود»: the three files as one index.html. */
  onDownload: () => void;
}

/** The editor's only actions. Nothing else goes here (spec: Layout). */
export default function ActionBar({ onRun, onReset, onDownload }: Props) {
  const { run, reset, download } = COPY.editor;
  return (
    <div data-actions className="editor-actions">
      <button type="button" onClick={onRun} className="editor-button editor-button-primary">
        {run}
      </button>
      <button type="button" onClick={onReset} className="editor-button">
        {reset}
      </button>
      <button type="button" onClick={onDownload} className="editor-button">
        {download}
      </button>
    </div>
  );
}
