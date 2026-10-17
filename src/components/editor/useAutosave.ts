import { useEffect } from 'react';
import type { Files } from './files';
import { saveFiles } from './persistence';

/** How long edits must pause before they are saved (ticket 04). */
const SAVE_DELAY_MS = 500;

/**
 * Saves `files` once they stop changing for `SAVE_DELAY_MS`, or at once if
 * the page is left first (reload, close, navigation). Nothing is saved while
 * they are still `opened`, the files as they were opened or reset: those are
 * already saved, or empty.
 */
export function useAutosave(files: Files, opened: Files) {
  useEffect(() => {
    if (files === opened) return;
    const save = () => saveFiles(files);
    const timer = setTimeout(save, SAVE_DELAY_MS);
    addEventListener('pagehide', save);
    return () => {
      clearTimeout(timer);
      removeEventListener('pagehide', save);
    };
  }, [files, opened]);
}
