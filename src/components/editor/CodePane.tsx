import { useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { tagHighlighter, tags } from '@lezer/highlight';
import { COPY } from '../../site';
import { FILES, type FileId, type Files } from './files';
import { fullPagePaste } from './fullPagePaste';
import { ltrIsolates } from './ltrIsolates';
import { reducedMotion } from './reducedMotion';

interface Props {
  /** The file shown: the active tab. */
  file: FileId;
  /**
   * The three files' text when the pane mounts. From then on the pane owns
   * the text and reports every edit through `onChange`; to replace it from
   * outside (reset, restore), remount the pane with a new `key`.
   */
  initialFiles: Files;
  /**
   * Every edit, applied synchronously (as a controlled input's would be), so
   * an action straight after typing («اجرای کد») sees the new text.
   */
  onChange: (file: FileId, text: string) => void;
}

const LANGUAGE: Record<FileId, () => Extension> = { html, css, js: javascript };

/** DOM id of the Code Pane's screen-reader description (`COPY.editor.codeHint`). */
const HINT_ID = 'editor-code-hint';

/**
 * Syntax tokens get plain classes, coloured in editor.css. A tag takes its
 * most specific rule, else its parent's: `keyword` covers JS's control,
 * definition and module keywords, CSS at-rules and `!important`; `string`
 * covers attribute values and template strings. Plain names and operators
 * stay ink.
 */
const highlighter = tagHighlighter([
  { tag: tags.keyword, class: 'code-keyword' },
  { tag: tags.tagName, class: 'code-tag' },
  { tag: [tags.attributeName, tags.propertyName], class: 'code-attribute' },
  { tag: [tags.string, tags.regexp], class: 'code-string' },
  {
    tag: [tags.number, tags.bool, tags.null, tags.atom, tags.unit, tags.color, tags.character, tags.escape],
    class: 'code-constant',
  },
  {
    tag: [
      tags.function(tags.variableName),
      tags.function(tags.propertyName),
      tags.function(tags.definition(tags.variableName)),
      tags.className,
      tags.labelName,
    ],
    class: 'code-function',
  },
  { tag: tags.definition(tags.variableName), class: 'code-definition' },
  { tag: [tags.angleBracket, tags.meta], class: 'code-punctuation' },
  { tag: tags.comment, class: 'code-comment' },
]);

/** One editor state per file, so each keeps its own text, selection and undo history. */
function createState(file: FileId, doc: string, onDocChange: (text: string) => void) {
  const label = FILES.find((f) => f.id === file)!.label;
  return EditorState.create({
    doc,
    extensions: [
      // The page is RTL; code is LTR everywhere, Farsi runs inside it
      // isolated per syntax node. No perLineTextDirection: every line is
      // LTR, so it would change nothing.
      EditorView.editorAttributes.of({ dir: 'ltr' }),
      ltrIsolates(),
      EditorView.contentAttributes.of({
        'aria-label': `${COPY.editor.code} ${label}`,
        'aria-describedby': HINT_ID,
      }),
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
      // Tab indents; Escape then Tab leaves the Code Pane (CodeMirror's escape
      // hatch), as the pane's description tells screen-reader users.
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      LANGUAGE[file](),
      syntaxHighlighting(highlighter),
      // The original tool's hint in an empty box; editor.css sets it right to left.
      placeholder(COPY.editor.placeholder(label)),
      file === 'html' ? fullPagePaste() : [],
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onDocChange(update.state.doc.toString());
      }),
    ],
  });
}

const FADE: KeyframeAnimationOptions = { duration: 150, easing: 'ease-out' };

/**
 * Runs `swap` (which changes what the Code Pane shows) as a 150ms crossfade:
 * a still copy of the outgoing file fades out over the incoming one fading
 * in. At once under reduced motion.
 */
function crossfade(editor: EditorView, swap: () => void) {
  if (reducedMotion()) return swap();
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
      states.current[id] ??= createState(id, initialFiles[id], (text) =>
        flushSync(() => onChangeRef.current(id, text)),
      );
    }
    const editor = new EditorView({ parent: host.current!, state: states.current[shown.current] });
    view.current = editor;
    // The pane's height follows the viewport, which an on-screen keyboard can
    // shrink: then keep the line being typed on in view.
    let height = host.current!.clientHeight;
    const keyboard = new ResizeObserver(([{ target }]) => {
      if (editor.hasFocus && target.clientHeight < height) {
        editor.dispatch({ effects: EditorView.scrollIntoView(editor.state.selection.main.head) });
      }
      height = target.clientHeight;
    });
    keyboard.observe(host.current!);
    return () => {
      keyboard.disconnect();
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

  return (
    <>
      <div ref={host} dir="ltr" className="editor-code" />
      {/* Hidden, yet read out as the pane's description (aria-describedby). */}
      <p id={HINT_ID} hidden>
        {COPY.editor.codeHint}
      </p>
    </>
  );
}
