import { useEffect, useId, useRef } from 'react';

interface Props {
  /** Shown while true. */
  open: boolean;
  title: string;
  message: string;
  /** The button that goes ahead, at the far left (RTL), in the warning red. */
  confirmLabel: string;
  /** The safe answer, focused on open. */
  cancelLabel: string;
  onConfirm: () => void;
  /** Declined, by its button, Escape or a click outside. */
  onClose: () => void;
}

/**
 * A question on the page, in place of the browser's `confirm()`. A native
 * <dialog> opened with showModal(): the page behind it is inert, Tab stays
 * inside, Escape declines, and focus goes back to whatever opened it.
 */
export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const box = dialog.current!;
    if (open && !box.open) {
      box.showModal();
      cancel.current!.focus();
    } else if (!open && box.open) {
      box.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      // However it closed (Escape included), the parent hears of it.
      onClose={onClose}
      // A click on the dimmed page around the panel lands on the dialog itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current!.close();
      }}
      className="editor-dialog"
    >
      <div className="editor-dialog-panel">
        <h2 id={`${id}-title`} className="editor-dialog-title">
          {title}
        </h2>
        <p id={`${id}-message`} className="editor-dialog-message">
          {message}
        </p>
        <div className="editor-dialog-actions">
          <button ref={cancel} type="button" onClick={() => dialog.current!.close()} className="editor-button">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="editor-button editor-button-danger">
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
