import { useState } from 'react';
import { COPY } from '../../site';
import CodePane from './CodePane';
import TabBar, { tabId } from './TabBar';
import type { FileId, Files } from './files';

interface EditorState extends Files {
  activeTab: FileId;
}

const PANEL_ID = 'editor-panel';

/** The HTML Editor: tabs over one Code Pane, the Preview and its console. */
export default function EditorApp() {
  const [state, setState] = useState<EditorState>({ html: '', css: '', js: '', activeTab: 'html' });
  const { activeTab } = state;

  return (
    <div data-editor className="editor">
      <section className="editor-card">
        <TabBar
          active={activeTab}
          onSelect={(file) => setState((s) => ({ ...s, activeTab: file }))}
          panelId={PANEL_ID}
          label={COPY.editor.filesLabel}
        />
        <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(activeTab)}>
          <CodePane
            value={state[activeTab]}
            onChange={(text) => setState((s) => ({ ...s, [s.activeTab]: text }))}
            labelledBy={tabId(activeTab)}
          />
        </div>
      </section>
    </div>
  );
}
