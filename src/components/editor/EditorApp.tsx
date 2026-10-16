import { useEffect, useRef, useState } from 'react';
import { Group, Panel, Separator, useDefaultLayout, useGroupRef } from 'react-resizable-panels';
import { COPY } from '../../site';
import ActionBar from './ActionBar';
import CodePane from './CodePane';
import ConfirmDialog from './ConfirmDialog';
import ConsoleStrip from './ConsoleStrip';
import { downloadPage } from './downloadPage';
import Preview from './Preview';
import TabBar, { tabId } from './TabBar';
import { clearWorkspace, loadWorkspace, type Workspace } from './persistence';
import { STARTER_TEMPLATE } from './starterTemplate';
import { useAutosave } from './useAutosave';
import { useMediaQuery } from './useMediaQuery';
import { usePreviewBuild } from './usePreviewBuild';

const PANEL_ID = 'editor-panel';
const PREVIEW_TITLE_ID = 'editor-preview-title';

/** Half each, until the visitor drags the separator. */
const EVEN = { preview: 50, code: 50 };

/**
 * The library's panel content box scrolls; here each pane scrolls inside
 * itself instead (the Code Pane, the Preview, the console log).
 */
const PANEL_STYLE = { display: 'flex', flexDirection: 'column', overflow: 'hidden' } as const;

/**
 * The HTML Editor, filling the screen: the Preview (with the action bar and
 * the console strip) and the Code Pane (tabs over one file), with a
 * separator between them that resizes both.
 *
 * Side by side from 1024px, Preview on the left and Code Pane on the right;
 * stacked below that, Preview on top. One order gives both because the
 * panel group runs left to right (react-resizable-panels doesn't do RTL);
 * each pane is right to left again inside. Each arrangement remembers its
 * own sizes in localStorage, saved only when the visitor resizes.
 */
export default function EditorApp() {
  // The last visit's workspace, else the Starter Template.
  const [workspace, setWorkspace] = useState<Workspace>(loadWorkspace);
  // The workspace as opened or last reset: nothing new to save until it changes.
  const [opened, setOpened] = useState(workspace);
  useAutosave(workspace, opened);
  // Bumped to remount the Code Pane on files replaced from outside it.
  const [paneKey, setPaneKey] = useState(0);
  // `files` is a new object only when one of them is edited, not on a tab switch.
  const { activeTab, files } = workspace;
  const preview = usePreviewBuild(files);
  const frame = useRef<HTMLIFrameElement>(null);
  // «بازنشانی» asks first, in a dialog on the page.
  const [askingReset, setAskingReset] = useState(false);

  const orientation = useMediaQuery('(width >= 1024px)') ? 'horizontal' : 'vertical';
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `rabanian.editor.layout.${orientation}`,
    onlySaveAfterUserInteractions: true,
  });
  const group = useGroupRef();
  // Across the 1024px line the group stays mounted (the Code Pane keeps its
  // undo history), so it takes the other arrangement's sizes from here.
  const shownOrientation = useRef(orientation);
  useEffect(() => {
    if (shownOrientation.current === orientation) return;
    shownOrientation.current = orientation;
    group.current?.setLayout(defaultLayout ?? EVEN);
  }, [orientation, defaultLayout, group]);

  /** «بازنشانی», once confirmed: the Starter Template again, and nothing saved. */
  function reset() {
    setAskingReset(false);
    const template = { files: STARTER_TEMPLATE, activeTab };
    clearWorkspace();
    setWorkspace(template);
    setOpened(template);
    setPaneKey((key) => key + 1);
  }

  return (
    <>
      <Group
        data-editor
        dir="ltr"
        orientation={orientation}
        defaultLayout={defaultLayout ?? EVEN}
        onLayoutChanged={onLayoutChanged}
        groupRef={group}
        className="editor"
      >
        <Panel id="preview" dir="rtl" minSize="20%" style={PANEL_STYLE} className="editor-preview-column">
          <section aria-labelledby={PREVIEW_TITLE_ID} className="editor-pane">
            <div className="editor-bar editor-preview-bar">
              <h2 id={PREVIEW_TITLE_ID} className="editor-pane-title">
                {COPY.editor.preview}
              </h2>
              <ActionBar
                onRun={preview.runNow}
                onReset={() => setAskingReset(true)}
                onDownload={() => downloadPage(files)}
              />
            </div>
            <Preview srcDoc={preview.srcDoc} build={preview.id} frameRef={frame} />
          </section>
          <ConsoleStrip frameRef={frame} build={preview.id} />
        </Panel>
        <Separator aria-label={COPY.editor.resize} className="editor-separator" />
        <Panel id="code" dir="rtl" minSize="20%" style={PANEL_STYLE}>
          <section data-code className="editor-pane">
            <TabBar
              active={activeTab}
              onSelect={(file) => setWorkspace((w) => ({ ...w, activeTab: file }))}
              panelId={PANEL_ID}
              label={COPY.editor.filesLabel}
            />
            <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(activeTab)} className="editor-panel">
              <CodePane
                key={paneKey}
                file={activeTab}
                initialFiles={files}
                onChange={(file, text) => setWorkspace((w) => ({ ...w, files: { ...w.files, [file]: text } }))}
              />
            </div>
          </section>
        </Panel>
      </Group>
      <ConfirmDialog
        open={askingReset}
        title={COPY.editor.resetDialog.title}
        message={COPY.editor.resetDialog.message}
        confirmLabel={COPY.editor.resetDialog.confirm}
        cancelLabel={COPY.editor.resetDialog.cancel}
        onConfirm={reset}
        onClose={() => setAskingReset(false)}
      />
    </>
  );
}
