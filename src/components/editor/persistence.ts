import { FILES, type FileId, type Files } from './files';
import { STARTER_TEMPLATE } from './starterTemplate';

/** What the HTML Editor keeps between visits: the three files and the tab being edited. */
export interface Workspace extends Files {
  activeTab: FileId;
}

/** The slice of Web Storage the autosave uses (`localStorage` by default). */
export type WorkspaceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The key the workspace is saved under (spec: Persistence). */
const KEY = 'rabanian.editor.v1';

const FIRST_TAB: FileId = FILES[0].id;

const isFileId = (value: unknown): value is FileId => FILES.some((file) => file.id === value);

/** The three files in `value`, if it holds all three as text. */
function filesIn(value: unknown): Files | null {
  if (typeof value !== 'object' || value === null) return null;
  const saved = value as Record<string, unknown>;
  const { html, css, js } = saved;
  if (typeof html !== 'string' || typeof css !== 'string' || typeof js !== 'string') return null;
  return { html, css, js };
}

/**
 * The saved workspace, else the Starter Template on the HTML tab. A save that
 * doesn't hold all three files counts as none; an unknown tab, as the HTML tab.
 */
export function loadWorkspace(storage?: WorkspaceStorage): Workspace {
  let saved: unknown = null;
  try {
    saved = JSON.parse((storage ?? localStorage).getItem(KEY) ?? 'null');
  } catch {
    // Storage unavailable, or not JSON: as if nothing was saved.
  }
  const files = filesIn(saved);
  if (!files) return { ...STARTER_TEMPLATE, activeTab: FIRST_TAB };
  const { activeTab } = saved as { activeTab?: unknown };
  return { ...files, activeTab: isFileId(activeTab) ? activeTab : FIRST_TAB };
}

/**
 * Saves the workspace for the next visit. Where storage is unavailable
 * (blocked, private mode) or full, the editor carries on unsaved.
 */
export function saveWorkspace(workspace: Workspace, storage?: WorkspaceStorage): void {
  const { html, css, js, activeTab } = workspace;
  attempt(() => (storage ?? localStorage).setItem(KEY, JSON.stringify({ html, css, js, activeTab })));
}

/** Forgets the saved workspace: the next visit opens the Starter Template. */
export function clearWorkspace(storage?: WorkspaceStorage): void {
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
