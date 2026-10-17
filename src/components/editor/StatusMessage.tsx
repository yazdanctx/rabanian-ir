import { useState } from 'react';
import type { Status } from './useStatus';

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * The status message, at the foot of the Preview while there is one. A
 * polite live region, always on the page so screen readers hear each new
 * message; it fades out keeping its words, hidden from them once gone.
 */
export default function StatusMessage({ status }: { status: Status | null }) {
  // The last message, still worded while it fades out.
  const [shown, setShown] = useState(status);
  if (status && status !== shown) setShown(status);

  return (
    <div role="status" data-status data-shown={status ? '' : undefined} className="editor-status">
      {shown && (
        <p key={shown.id} data-tone={shown.tone} className="editor-status-message">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" className="editor-status-icon">
            {shown.tone === 'success' ? (
              <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />
            ) : (
              <>
                <circle cx="12" cy="12" r="9" {...stroke} />
                <path d="M12 7.5v5.5m0 3.5v.01" {...stroke} />
              </>
            )}
          </svg>
          {shown.text}
        </p>
      )}
    </div>
  );
}
