import { describe, expect, it } from 'vitest';
import { EMPTY_FILES } from '../src/components/editor/files';
import { clearFiles, loadFiles, saveFiles } from '../src/components/editor/persistence';

/*
 * The HTML Editor's autosave (spec: Persistence): the three files in
 * localStorage under `rabanian.editor.v1`, empty files whenever nothing
 * usable is saved.
 */

/** An in-memory Web Storage. */
function memoryStorage(entries: Record<string, string> = {}) {
  const items = new Map(Object.entries(entries));
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
  };
}

describe('loadFiles', () => {
  it('opens three empty files when nothing is saved', () => {
    expect(loadFiles(memoryStorage())).toEqual({ html: '', css: '', js: '' });
  });

  it('restores what was saved: the three files, Farsi included', () => {
    const storage = memoryStorage();
    const edited = { html: '<h1>سلام دنیا</h1>', css: 'h1 { color: #0d5be0 }', js: "console.log('سلام')" };
    saveFiles(edited, storage);
    expect(loadFiles(storage)).toEqual(edited);
  });

  it('saves one flat object', () => {
    const storage = memoryStorage();
    saveFiles({ html: '<p>a</p>', css: 'p {}', js: 'x()' }, storage);
    expect(JSON.parse(storage.getItem('rabanian.editor.v1')!)).toEqual({ html: '<p>a</p>', css: 'p {}', js: 'x()' });
  });

  it.each([
    ['is not JSON', '{"html": "<h1>'],
    ['is JSON null', 'null'],
    ['is a JSON string', '"<h1>سلام</h1>"'],
    ['is a JSON array', '["<h1>", "h1 {}", "x()"]'],
    ['lacks a file', '{"html": "<h1>سلام</h1>", "css": ""}'],
    ['has a file that is not text', '{"html": "<h1>سلام</h1>", "css": "", "js": 42}'],
  ])('falls back to empty files when the save %s', (_, saved) => {
    const storage = memoryStorage({ 'rabanian.editor.v1': saved });
    expect(loadFiles(storage)).toEqual(EMPTY_FILES);
  });

  it('keeps only the files from earlier saves, which also held the open tab', () => {
    const storage = memoryStorage({
      'rabanian.editor.v1': '{"html": "<p>a</p>", "css": "", "js": "", "activeTab": "js", "theme": "dark"}',
    });
    expect(loadFiles(storage)).toEqual({ html: '<p>a</p>', css: '', js: '' });
  });
});

describe('clearFiles', () => {
  it('forgets the save, so the next visit opens empty', () => {
    const storage = memoryStorage();
    saveFiles({ html: '<p>a</p>', css: '', js: '' }, storage);
    clearFiles(storage);
    expect(loadFiles(storage)).toEqual(EMPTY_FILES);
  });
});

describe('when storage is unavailable (blocked, private mode) or full', () => {
  const refuse = () => {
    throw new DOMException('Access is denied for this document.', 'SecurityError');
  };
  const blocked = { getItem: refuse, setItem: refuse, removeItem: refuse };

  it('opens empty', () => {
    expect(loadFiles(blocked)).toEqual(EMPTY_FILES);
  });

  it('carries on without saving or clearing', () => {
    const full = {
      ...memoryStorage(),
      setItem: () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      },
    };
    expect(() => saveFiles(EMPTY_FILES, full)).not.toThrow();
    expect(() => saveFiles(EMPTY_FILES, blocked)).not.toThrow();
    expect(() => clearFiles(blocked)).not.toThrow();
  });
});
