import { EMPTY_FILES, FILES, type Files } from './files';

/** The slice of Web Storage the autosave uses (`localStorage` by default). */
export type FilesStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * The key the three files are saved under (spec: Persistence), as one flat
 * object: `{ html, css, js }`. Earlier saves also held the open tab, which is
 * no longer read: the editor always opens on the HTML tab.
 */
const KEY = 'rabanian.editor.v1';

/** The files in a save, if it holds every one of them as text; nothing else from it. */
function filesIn(saved: unknown): Files | null {
  if (typeof saved !== 'object' || saved === null) return null;
  const files = Object.fromEntries(FILES.map(({ id }) => [id, (saved as Record<string, unknown>)[id]]));
  return Object.values(files).every((text) => typeof text === 'string') ? (files as Files) : null;
}

/**
 * The saved files, else three empty ones. A save that doesn't hold all three
 * files counts as none.
 */
export function loadFiles(storage?: FilesStorage): Files {
  let saved: unknown = null;
  try {
    saved = JSON.parse((storage ?? localStorage).getItem(KEY) ?? 'null');
  } catch {
    // Storage unavailable, or not JSON: as if nothing was saved.
  }
  return filesIn(saved) ?? EMPTY_FILES;
}

/**
 * Saves the files for the next visit. Where storage is unavailable (blocked,
 * private mode) or full, the editor carries on unsaved.
 */
export function saveFiles(files: Files, storage?: FilesStorage): void {
  attempt(() => (storage ?? localStorage).setItem(KEY, JSON.stringify(files)));
}

/** Forgets the saved files: the next visit opens empty. */
export function clearFiles(storage?: FilesStorage): void {
  attempt(() => (storage ?? localStorage).removeItem(KEY));
}

/**
 * Runs a storage write, giving up quietly if storage refuses it. Even reading
 * `localStorage` throws where the browser blocks it.
 */
function attempt(write: () => void) {
  try {
    write();
  } catch {
    // Nothing to do: the editor works without autosave.
  }
}
