import { useEffect, useLayoutEffect, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { tagHighlighter, tags } from '@lezer/highlight';
import { COPY } from '../../site';
import { FILES, type FileId, type Files } from './files';

interface Props {
  /** The file shown: the active tab. */
  file: FileId;
  /**
   * The three files' text when the pane mounts. From then on the pane owns
   * the text and reports every edit through `onChange`; to replace it from
   * outside (reset, restore), remount the pane with a new `key`.
   */
  initialFiles: Files;
  onChange: (file: FileId, text: string) => void;
}

const LANGUAGE: Record<FileId, () => Extension> = { html, css, js: javascript };

/**
 * Syntax tokens get plain classes, coloured on palette P in editor.css.
 * Sub-tags follow their parent: `string` covers attribute values and JS
 * template strings; `comment` covers line and block comments.
 */
const highlighter = tagHighlighter([
  { tag: [tags.tagName, tags.angleBracket], class: 'code-tag' },
  { tag: tags.attributeName, class: 'code-attribute' },
  { tag: tags.string, class: 'code-string' },
  { tag: tags.comment, class: 'code-comment' },
]);

/** One editor state per file, so each keeps its own text, selection and undo history. */
function createState(file: FileId, doc: string, onDocChange: (text: string) => void) {
  const label = FILES.find((f) => f.id === file)!.label;
  return EditorState.create({
    doc,
    extensions: [
      // The page is RTL; code is LTR everywhere.
      EditorView.editorAttributes.of({ dir: 'ltr' }),
      EditorView.contentAttributes.of({ 'aria-label': `${COPY.editor.code} ${label}` }),
      lineNumbers(),
      // HTML tags auto-close from html() itself.
      closeBrackets(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap]),
      LANGUAGE[file](),
      syntaxHighlighting(highlighter),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onDocChange(update.state.doc.toString());
      }),
    ],
  });
}

/**
 * The Code Pane (CodeMirror 6, see ADR-0001): one editor view showing one of
 * the three files at a time, swapping per-file states on a tab switch.
 */
export default function CodePane({ file, initialFiles, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const states = useRef<Partial<Record<FileId, EditorState>>>({});
  const shown = useRef(file);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    for (const { id } of FILES) {
      states.current[id] ??= createState(id, initialFiles[id], (text) => onChangeRef.current(id, text));
    }
    const editor = new EditorView({ parent: host.current!, state: states.current[shown.current] });
    view.current = editor;
    return () => {
      states.current[shown.current] = editor.state;
      editor.destroy();
      view.current = null;
    };
    // Mounts once: later `initialFiles` are ignored by design (see Props).
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor || shown.current === file) return;
    states.current[shown.current] = editor.state;
    shown.current = file;
    editor.setState(states.current[file]!);
  }, [file]);

  return <div ref={host} dir="ltr" className="editor-code" />;
}
