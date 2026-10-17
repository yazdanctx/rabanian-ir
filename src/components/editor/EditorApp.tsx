import { useEffect, useRef, useState } from 'react';
import { Group, Panel, Separator, useDefaultLayout, useGroupRef } from 'react-resizable-panels';
import { COPY } from '../../site';
import ActionBar from './ActionBar';
import CodePane from './CodePane';
import ConfirmDialog from './ConfirmDialog';
import ConsoleStrip from './ConsoleStrip';
import { downloadPage } from './downloadPage';
import Preview from './Preview';
import StatusMessage from './StatusMessage';
import TabBar, { tabId } from './TabBar';
import { EMPTY_FILES, FILES, type FileId, type Files } from './files';
import { clearFiles, loadFiles } from './persistence';
import { useAutosave } from './useAutosave';
import { useMediaQuery } from './useMediaQuery';
import { usePreviewBuild } from './usePreviewBuild';
import { useStatus } from './useStatus';

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
 * separator between them that resizes both. «تمام‌صفحه پیش‌نمایش» lays the
 * Preview over all of it until «خروج از تمام‌صفحه» or Escape; the frame
 * stays where it is, so the page in it isn't rerun.
 *
 * Side by side from 1024px, Preview on the left and Code Pane on the right;
 * stacked below that, Preview on top. One order gives both because the
 * panel group runs left to right (react-resizable-panels doesn't do RTL);
 * each pane is right to left again inside. Each arrangement remembers its
 * own sizes in localStorage, saved only when the visitor resizes.
 */
export default function EditorApp() {
  // The last visit's files, else empty ones.
  const [files, setFiles] = useState<Files>(loadFiles);
  // The files as opened or last reset: nothing new to save until they change.
  const [opened, setOpened] = useState(files);
  useAutosave(files, opened);
  // Always opens on the HTML tab.
  const [activeTab, setActiveTab] = useState<FileId>(FILES[0].id);
  // Bumped to remount the Code Pane on files replaced from outside it.
  const [paneKey, setPaneKey] = useState(0);
  const preview = usePreviewBuild(files);
  const frame = useRef<HTMLIFrameElement>(null);
  // «بازنشانی» asks first, in a dialog on the page.
  const [askingReset, setAskingReset] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { status, show, clear } = useStatus();
  // A message about the files as they were is stale once they change.
  useEffect(() => clear(), [files, clear]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    addEventListener('keydown', onKeyDown);
    return () => removeEventListener('keydown', onKeyDown);
  }, [fullscreen]);

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

  /**
   * «اجرای کد» and «دانلود index.html», each saying how it went. As in the
   * original tool, both want something in the HTML tab first.
   */
  function act(action: () => void, done: string) {
    if (!files.html.trim()) return show(COPY.editor.status.empty, 'error');
    action();
    show(done, 'success');
  }

  /** «بازنشانی», once confirmed: empty files on the HTML tab, as on a first visit, and nothing saved. */
  function reset() {
    setAskingReset(false);
    clearFiles();
    setFiles(EMPTY_FILES);
    setOpened(EMPTY_FILES);
    setActiveTab(FILES[0].id);
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
          <section
            aria-labelledby={PREVIEW_TITLE_ID}
            data-fullscreen={fullscreen || undefined}
            className="editor-pane editor-preview-pane"
          >
            <div className="editor-bar editor-preview-bar">
              <h2 id={PREVIEW_TITLE_ID} className="editor-pane-title">
                {COPY.editor.preview}
              </h2>
              <ActionBar
                onRun={() => act(preview.runNow, COPY.editor.status.ran)}
                onReset={() => setAskingReset(true)}
                onDownload={() => act(() => downloadPage(files), COPY.editor.status.downloaded)}
                fullscreen={fullscreen}
                onFullscreen={setFullscreen}
              />
            </div>
            <Preview srcDoc={preview.srcDoc} build={preview.id} frameRef={frame} />
            <StatusMessage status={status} />
          </section>
          <ConsoleStrip frameRef={frame} build={preview.id} inert={fullscreen} />
        </Panel>
        <Separator aria-label={COPY.editor.resize} inert={fullscreen} className="editor-separator" />
        <Panel id="code" dir="rtl" minSize="20%" inert={fullscreen} style={PANEL_STYLE}>
          <section data-code className="editor-pane">
            <TabBar
              active={activeTab}
              onSelect={setActiveTab}
              panelId={PANEL_ID}
              label={COPY.editor.filesLabel}
            />
            <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(activeTab)} className="editor-panel">
              <CodePane
                key={paneKey}
                file={activeTab}
                initialFiles={files}
                onChange={(file, text) => setFiles((last) => ({ ...last, [file]: text }))}
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
