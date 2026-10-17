import { EditorView } from '@codemirror/view';
import { isFullPage } from './buildDocument';

/**
 * A Full Page pasted into the HTML tab takes the whole file, wherever the
 * caret was. Amin's videos say to paste the page into the box; the box here
 * opens holding the Starter Template, and a page pasted into the middle of it
 * would render as neither. One paste, so one undo brings the old file back.
 */
export const fullPagePaste = () =>
  EditorView.domEventHandlers({
    paste(event, view) {
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!isFullPage(text) || view.state.readOnly) return false;
      const insert = view.state.toText(text);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert },
        selection: { anchor: insert.length },
        userEvent: 'input.paste',
        scrollIntoView: true,
      });
      event.preventDefault();
      return true;
    },
  });
