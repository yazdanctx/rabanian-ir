import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildDocument } from './buildDocument';
import type { Files } from './files';

/** How long typing must pause before the Preview rebuilds (spec: Preview). */
export const REBUILD_DELAY_MS = 300;

export interface PreviewBuild {
  /** Counts rebuilds. A new id is a new Preview document, and a fresh console. */
  id: number;
  /** The page the Preview renders. */
  srcDoc: string;
  /** Rebuilds now from the current files, even unchanged ones («اجرا»). */
  runNow: () => void;
}

/**
 * The Preview's current build: rebuilt `REBUILD_DELAY_MS` after the files stop
 * changing, or at once on `runNow`.
 */
export function usePreviewBuild(files: Files): PreviewBuild {
  const [build, setBuild] = useState(() => ({ id: 0, files }));

  useEffect(() => {
    const timer = setTimeout(
      // Skipped when «اجرا» already built these files.
      () => setBuild((last) => (last.files === files ? last : { id: last.id + 1, files })),
      REBUILD_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [files]);

  const runNow = useCallback(() => setBuild((last) => ({ id: last.id + 1, files })), [files]);
  const srcDoc = useMemo(() => buildDocument(build.files), [build.files]);
  return { id: build.id, srcDoc, runNow };
}
