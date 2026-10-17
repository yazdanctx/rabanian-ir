import type { Ref } from 'react';
import { COPY } from '../../site';

interface Props {
  /** The page to render (`buildDocument`). */
  srcDoc: string;
  /** The build's id: each build gets a new frame (see below). */
  build: number;
  /** The frame element, for the console strip to check who posts to it. */
  frameRef: Ref<HTMLIFrameElement>;
}

/**
 * The Preview: the three files rendered as a page in a frame. Not sandboxed,
 * as in Amin's original tool (ADR-0004): the visitor's page runs as it would
 * on its own, storage, forms, dialogs and embedded videos included. Every
 * build remounts the frame, which reruns the page even when nothing changed
 * («اجرای کد») and gives it a new window, so messages from an older build
 * can't pass for the current one's.
 */
export default function Preview({ srcDoc, build, frameRef }: Props) {
  return (
    <iframe
      key={build}
      ref={frameRef}
      data-preview
      srcDoc={srcDoc}
      title={COPY.editor.preview}
      className="editor-preview"
    />
  );
}
