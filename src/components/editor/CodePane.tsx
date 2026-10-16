import { useEffect, useLayoutEffect, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bidiIsolates, bracketMatching, indentUnit, syntaxHighlighting } from '@codemirror/language';
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
      // The page is RTL; code is LTR everywhere. Farsi runs inside it are
      // bidi-isolated per syntax node (tags, attribute values, strings,
      // comments), so `<p title="سلام">دنیا</p>` doesn't jumble. No
      // perLineTextDirection: every line is LTR, so it would change nothing.
      EditorView.editorAttributes.of({ dir: 'ltr' }),
      bidiIsolates(),
      EditorView.contentAttributes.of({ 'aria-label': `${COPY.editor.code} ${label}` }),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      // HTML tags auto-close from html() itself.
      closeBrackets(),
      bracketMatching(),
      history(),
      indentUnit.of('  '),
      EditorState.tabSize.of(2),
      EditorView.lineWrapping,
      // Tab indents; Escape then Tab leaves the editor (CodeMirror's escape hatch).
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      LANGUAGE[file](),
      syntaxHighlighting(highlighter),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onDocChange(update.state.doc.toString());
      }),
    ],
  });
}

const FADE: KeyframeAnimationOptions = { duration: 150, easing: 'ease-out' };

/**
 * Runs `swap` (which changes what the editor shows) as a 150ms crossfade:
 * a still copy of the outgoing file fades out over the incoming one fading
 * in. At once under reduced motion.
 */
function crossfade(editor: EditorView, swap: () => void) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return swap();
  const outgoing = editor.dom.cloneNode(true) as HTMLElement;
  outgoing.classList.remove('cm-focused');
  outgoing.classList.add('editor-code-outgoing');
  outgoing.inert = true;
  outgoing.setAttribute('aria-hidden', 'true');
  const { scrollTop } = editor.scrollDOM;
  swap();
  editor.dom.parentElement?.querySelectorAll('.editor-code-outgoing').forEach((old) => old.remove());
  editor.dom.after(outgoing);
  outgoing.querySelector('.cm-scroller')!.scrollTop = scrollTop;
  outgoing.animate({ opacity: [1, 0] }, FADE).onfinish = () => outgoing.remove();
  editor.dom.animate({ opacity: [0, 1] }, FADE);
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
    crossfade(editor, () => editor.setState(states.current[file]!));
  }, [file]);

  return <div ref={host} dir="ltr" className="editor-code" />;
}
