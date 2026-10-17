import { useCallback, useEffect, useState } from 'react';

/** How long a status message stays up. */
const SHOW_MS = 4000;

export interface Status {
  /** Counts messages, so the same words twice are still two messages. */
  id: number;
  text: string;
  tone: 'success' | 'error';
}

/**
 * The status message: what the last action did, as the original tool's
 * status line said it. Each one stays `SHOW_MS`, or until `clear` (an edit
 * makes it stale).
 */
export function useStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const show = useCallback(
    (text: string, tone: Status['tone']) => setStatus((last) => ({ id: (last?.id ?? 0) + 1, text, tone })),
    [],
  );
  const clear = useCallback(() => setStatus(null), []);
  return { status, show, clear };
}
