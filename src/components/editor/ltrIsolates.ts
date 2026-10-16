import { Prec, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  Direction,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { NodeProp } from '@lezer/common';

/**
 * Bidi isolation for Farsi inside LTR code: every syntax node the grammars
 * mark as an isolate (HTML tags, attribute values and comments; CSS and JS
 * strings and comments) is set as its own left-to-right island. So
 * `<p title="سلام">دنیا</p>` doesn't jumble, and Farsi stays a right-to-left
 * run inside it.
 *
 * Like CodeMirror's `bidiIsolates()`, but always LTR: that one gives comments
 * and strings `dir="auto"`, which turns a comment that starts in Farsi into
 * an RTL island, its delimiters mirrored to the wrong ends (`// سلام` shows
 * as `مالس //`). Code is LTR everywhere (spec: Code Pane).
 */
const island = Decoration.mark({
  class: 'cm-iso',
  attributes: { dir: 'ltr' },
  bidiIsolate: Direction.LTR,
});

function islands(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { from, to } = view.viewport;
  syntaxTree(view.state).iterate({
    from,
    to,
    enter(node) {
      if (node.type.prop(NodeProp.isolate)) builder.add(node.from, node.to, island);
    },
  });
  return builder.finish();
}

const plugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = islands(view);
    }
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = islands(update.view);
      }
    }
  },
  {
    provide(plugin) {
      const marks = (view: EditorView) => view.plugin(plugin)?.decorations ?? Decoration.none;
      // Drawn as isolates, and known to cursor motion as isolates.
      return [EditorView.outerDecorations.of(marks), Prec.lowest(EditorView.bidiIsolatedRanges.of(marks))];
    },
  },
);

export const ltrIsolates = () => plugin;
