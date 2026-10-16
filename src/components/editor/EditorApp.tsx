import { useMemo, useRef, useState } from 'react';
import { COPY } from '../../site';
import ActionBar from './ActionBar';
import CodePane from './CodePane';
import ConsoleStrip from './ConsoleStrip';
import Preview from './Preview';
import TabBar, { tabId } from './TabBar';
import type { FileId, Files } from './files';
import { usePreviewBuild } from './usePreviewBuild';

interface EditorState extends Files {
  activeTab: FileId;
}

const PANEL_ID = 'editor-panel';
const PREVIEW_TITLE_ID = 'editor-preview-title';

/** Placeholder for the actions ticket 04 wires up. */
const notYet = () => {};

/**
 * The HTML Editor: tabs over one Code Pane, and beside it (below it on
 * narrow screens) the Preview with the action bar and the console strip.
 */
export default function EditorApp() {
  const [state, setState] = useState<EditorState>({ html: '', css: '', js: '', activeTab: 'html' });
  const { activeTab, html, css, js } = state;
  const files = useMemo(() => ({ html, css, js }), [html, css, js]);
  const preview = usePreviewBuild(files);
  const frame = useRef<HTMLIFrameElement>(null);

  return (
    <div data-editor className="editor">
      <section data-code className="editor-card">
        <TabBar
          active={activeTab}
          onSelect={(file) => setState((s) => ({ ...s, activeTab: file }))}
          panelId={PANEL_ID}
          label={COPY.editor.filesLabel}
        />
        <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(activeTab)} className="editor-panel">
          <CodePane
            file={activeTab}
            initialFiles={state}
            onChange={(file, text) => setState((s) => ({ ...s, [file]: text }))}
          />
        </div>
      </section>
      <div className="editor-output">
        <section aria-labelledby={PREVIEW_TITLE_ID} className="editor-card">
          <div className="editor-card-head">
            <h2 id={PREVIEW_TITLE_ID} className="editor-card-title">
              {COPY.editor.preview}
            </h2>
            <ActionBar onRun={preview.runNow} onReset={notYet} onDownload={notYet} />
          </div>
          <Preview srcDoc={preview.srcDoc} build={preview.id} frameRef={frame} />
        </section>
        <ConsoleStrip frameRef={frame} build={preview.id} />
      </div>
    </div>
  );
}
