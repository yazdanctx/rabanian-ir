import { Prec, RangeSetBuilder, type Line } from '@codemirror/state';
import {
  Decoration,
  Direction,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { NodeProp, type Tree } from '@lezer/common';

/**
 * Bidi isolation for Farsi inside LTR code: every Farsi run sits in its own
 * left-to-right island, so the code around it keeps its logical order and
 * the Farsi stays a right-to-left run inside it.
 *
 * The islands are the syntax nodes the grammars mark as isolates (HTML tags,
 * attribute values and comments; CSS and JS strings and comments), plus each
 * stretch of a line between those nodes' edges that holds Farsi: HTML text
 * between tags, the text around a template string's `${…}`, a Farsi name in
 * code. Isolates alone aren't enough: one is neutral to the text around it,
 * so between two Farsi words it joins their right-to-left run, and
 * `<p>سلام <b>دنیا</b></p>` would show «دنیا» first, the `<b>` after it.
 *
 * Like CodeMirror's `bidiIsolates()`, but always LTR: that one gives comments
 * and strings `dir="auto"`, which turns a comment that starts in Farsi into
 * an RTL island, its delimiters mirrored to the wrong ends (`// سلام` shows
 * as `مالس //`). Code is LTR everywhere (spec: Code Pane). Like it, too, only
 * lines holding right-to-left letters get islands: elsewhere they change
 * nothing.
 */
const island = Decoration.mark({
  class: 'cm-iso',
  attributes: { dir: 'ltr' },
  bidiIsolate: Direction.LTR,
});

/** A right-to-left letter (the test CodeMirror's `bidiIsolates()` uses). */
const RTL = /[֐-״؀-ۿ܀-ࢬﭐ-﷿]/;

type Span = { from: number; to: number };

/** The islands on one line, outermost first where two start together. */
function lineIslands(tree: Tree, line: Line): Span[] {
  const nodes: Span[] = [];
  tree.iterate({
    from: line.from,
    to: line.to,
    enter(node) {
      if (!node.type.prop(NodeProp.isolate)) return;
      const from = Math.max(node.from, line.from);
      const to = Math.min(node.to, line.to);
      if (from < to) nodes.push({ from, to });
    },
  });

  // The line cut at every node's edges: a stretch with Farsi that isn't a
  // whole node already gets its own island, trimmed of spaces at its ends.
  const edges = [...new Set([line.from, line.to, ...nodes.flatMap(({ from, to }) => [from, to])])].sort(
    (a, b) => a - b,
  );
  const runs: Span[] = [];
  for (let i = 1; i < edges.length; i++) {
    const [from, to] = [edges[i - 1], edges[i]];
    const text = line.text.slice(from - line.from, to - line.from);
    if (!RTL.test(text) || nodes.some((node) => node.from === from && node.to === to)) continue;
    runs.push({ from: from + text.search(/\S/), to: from + text.trimEnd().length });
  }

  return [...nodes, ...runs].sort((a, b) => a.from - b.from || b.to - a.to);
}

function islands(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { doc } = view.state;
  const tree = syntaxTree(view.state);
  const { from, to } = view.viewport;
  for (let pos = from; pos <= to; ) {
    const line = doc.lineAt(pos);
    if (RTL.test(line.text)) {
      for (const span of lineIslands(tree, line)) builder.add(span.from, span.to, island);
    }
    pos = line.to + 1;
  }
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
