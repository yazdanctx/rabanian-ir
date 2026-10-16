import { describe, expect, it } from 'vitest';
import {
  clearWorkspace,
  loadWorkspace,
  saveWorkspace,
  type Workspace,
} from '../src/components/editor/persistence';
import { STARTER_TEMPLATE } from '../src/components/editor/starterTemplate';

/*
 * The HTML Editor's autosave (spec: Persistence): the three files and the
 * active tab in localStorage under `rabanian.editor.v1`, the Starter Template
 * whenever nothing usable is saved.
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

const firstVisit: Workspace = { files: STARTER_TEMPLATE, activeTab: 'html' };

describe('loadWorkspace', () => {
  it('opens the Starter Template on the HTML tab when nothing is saved', () => {
    expect(loadWorkspace(memoryStorage())).toEqual(firstVisit);
  });

  it('restores what was saved: the three files, Farsi included, and the active tab', () => {
    const storage = memoryStorage();
    const edited: Workspace = {
      files: { html: '<h1>سلام دنیا</h1>', css: 'h1 { color: #0d5be0 }', js: "console.log('سلام')" },
      activeTab: 'css',
    };
    saveWorkspace(edited, storage);
    expect(loadWorkspace(storage)).toEqual(edited);
  });

  it('saves one flat object, as the editor always has, so earlier saves still open', () => {
    const storage = memoryStorage();
    saveWorkspace({ files: { html: '<p>a</p>', css: 'p {}', js: 'x()' }, activeTab: 'js' }, storage);
    expect(JSON.parse(storage.getItem('rabanian.editor.v1')!)).toEqual({
      html: '<p>a</p>',
      css: 'p {}',
      js: 'x()',
      activeTab: 'js',
    });
  });

  it.each([
    ['is not JSON', '{"html": "<h1>'],
    ['is JSON null', 'null'],
    ['is a JSON string', '"<h1>سلام</h1>"'],
    ['is a JSON array', '["<h1>", "h1 {}", "x()"]'],
    ['lacks a file', '{"html": "<h1>سلام</h1>", "css": "", "activeTab": "html"}'],
    ['has a file that is not text', '{"html": "<h1>سلام</h1>", "css": "", "js": 42, "activeTab": "html"}'],
  ])('falls back to the Starter Template when the save %s', (_, saved) => {
    const storage = memoryStorage({ 'rabanian.editor.v1': saved });
    expect(loadWorkspace(storage)).toEqual(firstVisit);
  });

  it.each([['"preview"'], ['null'], ['1']])('restores the files on the HTML tab when the saved tab is %s', (tab) => {
    const storage = memoryStorage({
      'rabanian.editor.v1': `{"html": "<p>a</p>", "css": "p {}", "js": "", "activeTab": ${tab}}`,
    });
    expect(loadWorkspace(storage)).toEqual({ files: { html: '<p>a</p>', css: 'p {}', js: '' }, activeTab: 'html' });
  });

  it('keeps only the files and the tab, whatever else was saved', () => {
    const storage = memoryStorage({
      'rabanian.editor.v1': '{"html": "<p>a</p>", "css": "", "js": "", "activeTab": "js", "theme": "dark"}',
    });
    expect(loadWorkspace(storage)).toEqual({ files: { html: '<p>a</p>', css: '', js: '' }, activeTab: 'js' });
  });
});

describe('clearWorkspace', () => {
  it('forgets the save, so the next visit opens the Starter Template', () => {
    const storage = memoryStorage();
    saveWorkspace({ files: { html: '<p>a</p>', css: '', js: '' }, activeTab: 'js' }, storage);
    clearWorkspace(storage);
    expect(loadWorkspace(storage)).toEqual(firstVisit);
  });
});

describe('when storage is unavailable (blocked, private mode) or full', () => {
  const refuse = () => {
    throw new DOMException('Access is denied for this document.', 'SecurityError');
  };
  const blocked = { getItem: refuse, setItem: refuse, removeItem: refuse };

  it('opens the Starter Template', () => {
    expect(loadWorkspace(blocked)).toEqual(firstVisit);
  });

  it('carries on without saving or clearing', () => {
    const full = {
      ...memoryStorage(),
      setItem: () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      },
    };
    expect(() => saveWorkspace(firstVisit, full)).not.toThrow();
    expect(() => saveWorkspace(firstVisit, blocked)).not.toThrow();
    expect(() => clearWorkspace(blocked)).not.toThrow();
  });
});
