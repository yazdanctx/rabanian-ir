import { useEffect } from 'react';
import { saveWorkspace, type Workspace } from './persistence';

/** How long edits must pause before they are saved (ticket 04). */
export const SAVE_DELAY_MS = 500;

/**
 * Saves `workspace` once it stops changing for `SAVE_DELAY_MS`, or at once if
 * the page is left first (reload, close, navigation). Nothing is saved while
 * it is still `opened`, the workspace as it was opened or reset: that is
 * already saved, or is the Starter Template.
 */
export function useAutosave(workspace: Workspace, opened: Workspace) {
  useEffect(() => {
    if (workspace === opened) return;
    const save = () => saveWorkspace(workspace);
    const timer = setTimeout(save, SAVE_DELAY_MS);
    addEventListener('pagehide', save);
    return () => {
      clearTimeout(timer);
      removeEventListener('pagehide', save);
    };
  }, [workspace, opened]);
}
