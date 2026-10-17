# The Preview runs unsandboxed, as in Amin's original tool

The HTML Editor replaces Amin's original single-file HTML tool, and his course videos tell Learners to paste the pages they build there and run them. That tool drops the iframe's `sandbox` on purpose, so a pasted page runs like a normal one. Our Preview was `sandbox="allow-scripts"`, and measured in Chrome on 2026-10-17 that breaks such pages. `localStorage` and `document.cookie` throw `SecurityError`, embedded YouTube players render black, and forms, `alert()` and popups are blocked. We dropped the `sandbox` attribute so the Preview runs what the original ran.

We rejected keeping the sandbox with every `allow-*` flag except `allow-same-origin`. It fixes forms, dialogs, popups and downloads, but the opaque origin still breaks storage and embeds. A storage shim would only last one run. Adding `allow-same-origin` beside `allow-scripts` on a same-origin `srcdoc` lets the page remove its own sandbox, so it is no sandbox at all. A separate origin for the Preview, as CodePen uses, would keep both, but this site is static with no second host.

## Consequences

- The visitor's page shares the editor's origin. It can reach the editor through `parent` and read or clear `localStorage`, `rabanian.editor.v1` included. There are no accounts and no sharing, so the only code that runs there is code the visitor pasted or typed themselves.
- An endless loop in the visitor's JS now freezes the whole tab, not just the Preview. Chrome had been running the sandboxed frame in its own process. The Preview rebuilds 250ms after typing stops and autosave waits 500ms, so the edit that froze it is not saved and a reload recovers. Keep the rebuild delay below the autosave delay.
- The console bridge's check (`event.source === frame.contentWindow`) is unchanged. Tests read the Preview through `contentWindow` instead of as an out-of-process DevTools target.
- Revisit if the Preview ever shows someone else's code (sharing, a gallery). Then it needs a separate origin, not a sandbox flag.
