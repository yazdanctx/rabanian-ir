# 05 — Farsi, accessibility and acceptance verification

Status: ready-for-agent
Spec: ../spec.md (Farsi support — the definition, Acceptance)
Blocked by: 04

## Task

Walk the spec's acceptance list and the five-point Farsi definition on desktop Chrome/Safari and a 390px mobile viewport; record results under `## Comments` here and fix what fails:

1. Chrome strings all Farsi, `dir="rtl"` on page, Persian digits in UI counts, Latin digits in gutter.
2. Bidi behavior in the Code Pane for mixed Farsi/Latin lines (cursor, selection, delete).
3. Preview default direction and font.
4. Keyboard: tabs via arrows, all buttons reachable, focus visible on palette P.
5. Mobile: on-screen keyboard does not hide the tab bar; stacked layout usable.
6. Lighthouse Accessibility 100 on `/editor`; the landing page's JS graph contains no CodeMirror/JetBrains Mono.

## Acceptance

- Every item above passes and is recorded with browser/version.

## Comments

**Verification, 2026-10-16** — branch `html-editor-05`, from `html-editor` at c45ef2e.

- **Chrome:** Google Chrome 154.0.8037.58 on macOS 14.5 (23F79). It ran headless and was driven over CDP with real key, mouse and touch input (`Input.dispatch*`). Mobile is the same Chrome emulating a 390×844 device (`mobile: true`, touch).
- **Safari 17.5:** WebDriver still refuses a session: "You must enable 'Allow remote automation' in the Developer section of Safari Settings". `AllowRemoteAutomation` is unset and the Develop menu is off (`ShowDevelopMenu = 0`). Settings were left alone, so every Safari cell below is **manual check pending**.
- **Lighthouse and axe:** Lighthouse 13.5.0 and its axe-core 4.14.0 ran on a production `npm run build` (React prod bundle), served with `npx serve`.

| # | Item | Chrome 154, desktop 1280 | Chrome 154, 390 emulated | Safari 17.5 |
|---|---|---|---|---|
| 1 | Farsi chrome, `dir="rtl"`, digits | pass | pass | manual check pending |
| 2 | Bidi in the Code Pane (caret, selection, delete) | pass | pass (same engine) | manual check pending |
| 3 | Preview direction and font | pass | pass | manual check pending |
| 4 | Keyboard: tabs, reachability, focus ring | pass **after fix** | n/a | manual check pending |
| 5 | Mobile: keyboard vs tab bar; stacked layout | n/a | layout pass; keyboard pass **after fix** (approximated, see 5) | iOS: manual check pending |
| 6 | Lighthouse Accessibility; landing JS graph | **100** desktop; graph clean | **100** mobile | n/a |

**1. Chrome strings, direction, digits.**
- **Method:** I walked every text node and every accessible name (`aria-label`, `title`, `alt`) on /editor with the console open. Code, the Preview and console messages were left out.
- **Strings:** all are Farsi except the tab labels `HTML` `CSS` `JS`, which are the languages' names, as the spec says.
- **Page:** `<html lang="fa" dir="rtl">`, title «ویرایشگر HTML — rabanian.ir». Every string on screen is set in IRANYekanXFaNum.
- **Digits:** the editor shows no counts today. Any digit in the chrome would still read Persian, because the FaNum face draws it (ADR-0002). Line numbers are drawn in JetBrains Mono (checked with `CSS.getPlatformFontsForNode`), so they are Latin digits. Console messages are shown verbatim in the code font, so `console.log('سلام ۱۲۳ 123')` keeps both kinds of digit.
- **Tests:** `editor-browser.test.ts` → "Farsi chrome" (new); `code-pane-browser.test.ts` → "draws Farsi in IRANYekanXFaNum, code and line numbers in JetBrains Mono".

**2. Bidi in the Code Pane.** Checked on `<h1>سلام دنیا</h1>` (offsets 0–18), using the definition ticket 02 settled.
- **Arrow keys move visually.** ArrowRight visits 0,1,2,3,4,12,11,10,9,8,7,6,5,13,…,18: every offset once, and the caret's x only ever increases.
  - Correction to the brief: Chrome 154's own `<textarea dir="ltr">` moves *logically* on the same line (measured 1,2,…,18). "Like a native textarea" is true of the selection model, not of Chrome's arrow keys.
  - CodeMirror's visual motion is its documented behaviour (codemirror.net/examples/bidi).
- **Selection is logical:**
  - Shift+ArrowRight ×4 from offset 4 selects «سلام » (4..9), drawn as one block. The textarea's Shift ×4 gives «سلام» (4..8), also logical.
  - Shift+End selects the whole line, drawn as 3 rectangles, one per bidi run.
  - Double-clicking «دنیا» selects that word.
- **Delete and Backspace are logical:** Delete at 4 removes «س»; Backspace at 8 removes «م».
- **Mouse:** a click near the right edge of «ل» (offset 5) puts the caret at 5; near its left edge, at 6. On Latin `h`, left and right edges give 1 and 2.
- **Rendering:** `<p title="سلام">دنیا</p>` and Farsi comments in all three files keep their order. That holds for comments wrapped over two rows at 390px too: measured visual order per row is `<!--  …هچره ⏎ دوش‌یم -->`. On screen, JetBrains Mono's `<!--`/`-->` ligatures make this look odd, but the order is correct.
- **Tests:** `code-pane-browser.test.ts` → "Farsi inside code". Delete and the click test are new here.

**3. Preview.**
- **Direction and font:** checked by attaching to the out-of-process srcdoc frame, at 1280 and at 390.
  - The Starter Template's «سلام دنیا» `h1` computes `direction: rtl`.
  - The document is `lang="fa" dir="rtl"`, with the body in `IRANYekanXFaNum, system-ui`.
  - `document.fonts.check('16px IRANYekanXFaNum', 'س')` returns true.
- **Spec acceptance "within 300ms":**
  - Measured from the last real keystroke of `<h1>سلام دنیا</h1>` to the new Preview's `load`: 327/343/355 ms at 1280 and 315/312/322 ms at 390.
  - That is the spec's ~300ms debounce plus 12–55 ms to build and load the frame. A 300ms debounce can't render inside 300ms, so I read the acceptance as "on the debounce" and left `REBUILD_DELAY_MS` at 300.
  - If the literal reading is wanted, 250 would land it under 300.
- **Tests:** `preview-browser.test.ts` → "renders <h1>سلام</h1> right to left in Yekan…" and "turns left to right with html { direction: ltr }…".

**4. Keyboard** (real keys, 1280).
- **Tab order:**
  1. logo «آکادمی ربانیان»
  2. «پشتیبانی تلگرام»
  3. the selected file tab
  4. «کد HTML/CSS/JS». Tab indents here; Escape then Tab leaves, which is CodeMirror's escape hatch.
  5. «اجرا», «بازنشانی», «دانلود»
  6. the Preview. Focus enters the learner's page, whose button draws its own ring.
  7. «کنسول»
  8. «پاک کردن», when the console is open
  9. the console log, once it scrolls. Chrome makes scrolling regions focusable.
- **Arrow keys on the tabs:** ArrowLeft ×3 gives CSS, JS, then HTML (it wraps). ArrowRight gives JS, End gives JS, Home gives HTML. Focus and the panel's name follow each move.
- **Failed:** the logo, the Telegram button and the scrolling console log drew Chrome's default ring (`auto 1px rgb(0, 95, 204)`) instead of palette P.
- **Fixed (495bd38):** all three now use 2px solid primary `#1769FF`, offset 2px (inset −2px on the log).
  - Every stop now reports `solid 2px rgb(23, 105, 255)`, and I checked the top bar rings on a screenshot.
  - `#1769FF` has 4.35:1 contrast on surface and 4.67:1 on white, above the 3:1 non-text minimum (WCAG 1.4.11).
  - The landing page shares the top bar, so it gains the same ring there.
- **Added (c5a00ad):** the Code Pane's accessible description tells screen-reader users the way out: «در کد، Tab فاصله می‌گذارد؛ برای بیرون رفتن، اول Esc و بعد Tab را بزن.».
  - It is a hidden element referenced by `aria-describedby`; WCAG 2.1.2 asks that a non-standard exit be announced.
  - There is no visible hint for sighted keyboard users. Adding one is a design decision, left open.
- **Tests:**
  - `editor-a11y-browser.test.ts` (new): the Tab walk with rings, and the description read from the accessibility tree.
  - `editor-browser.test.ts` → "moves selection and focus with the arrow keys…".

**5. Mobile** (Chrome 154, 390×844 emulated, mobile, touch).
- **Verified:**
  - Stacked layout: title; the Code Pane card (46px tab bar over a 422px pane); the Preview card with «اجرا» «بازنشانی» «دانلود»; the console. No horizontal overflow.
  - Touch targets are at least 32px tall: tabs 62/50/41×32, buttons ×32, console toggle 348×44, Telegram 36×36.
  - A tap focuses the pane. I reviewed a full-page screenshot.
- **Approximated, page-resizing keyboard** (as Chrome with `interactive-widget=resizes-content` behaves, and other browsers that resize the layout):
  - **Method:** tap the pane's lowest visible line, then shrink the viewport by 260, 300, 336 and 380px.
  - **Result:** the tab bar stays at 119–165px, in view. The pane shrinks to 292/280px.
  - **Failed:** the tapped line ended up below the shrunken pane's edge (caret at 480px, pane bottom at 445px).
  - **Fixed (511d598):** when the pane shrinks while focused, its caret is scrolled back into view. The caret now sits at 422–440px, inside both the pane and the viewport, and typed text lands there.
  - **Test:** `editor-browser.test.ts` → "on a phone… keeps the tab bar and the caret in view when the keyboard shrinks the page".
- **Not emulated, overlaying keyboard** (iOS Safari, and Chrome Android's default): the keyboard covers the page and the browser scrolls the caret above it.
  - Headless Chrome can't shrink only the visual viewport: `Emulation.setVisibleSize` left `visualViewport` at 844.
  - **By geometry:** the tab bar stays in view while the caret is within (visible height − 46px) of the pane's top.
  - **Worst case**, caret on the pane's last line: the keyboard must leave 46px plus the pane (`max(280px, 50dvh)`). That is 468px at 844px tall, and about 378px on a 664px-tall iPhone Safari viewport.
  - With less room, the tab bar scrolls off the top of the screen (it is not covered by the keyboard) until the learner scrolls back.
  - **Real-device check pending** on iPhone Safari and Android Chrome.

**6. Lighthouse and the landing page.**
- **Lighthouse Accessibility:** /editor mobile **100** and desktop **100** (27 audits passed, 49 not applicable), both before and after the fixes. The landing page `/` mobile is still **100** after the top bar change.
- **axe (WCAG 2.2 AA + best practice):** run in the page with the console open and holding log, warn and error entries: 0 violations. `frame-tested` is "incomplete" only because the sandboxed Preview is cross-origin.
- **Landing JS graph** (production build): `index.html` loads `Motion…js` (1.4 KB gz), which loads `animate-style…js` (3.0 KB gz), plus `TopBar…css`. None contain `cm-editor`, `@codemirror` or `JetBrains`, and there is no `astro-island`.
- **Tests:** `editor-page.test.ts` → "landing page (dist/index.html) stays free of the editor".

```bash
npm run build -- --outDir /tmp/rabanian-05-dist && npx -y serve /tmp/rabanian-05-dist -l 4878 &
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npx -y lighthouse@13 http://localhost:4878/editor/ --quiet --chrome-flags="--headless=new" \
  --only-categories=accessibility --output=json --output-path=./editor-mobile.json   # add --preset=desktop for desktop
```

**Rest of the spec's acceptance list** (Chrome 154, all passing in `npm test`, 242/242):
- Console log and thrown errors appear, and messages from other windows are ignored: `preview-browser.test.ts`.
- Reload restores the files, «بازنشانی» brings back the Starter Template, and «دانلود» saves one working `index.html`: `workspace-browser.test.ts`.
- `role="tablist"`: `editor-browser.test.ts`.
- Farsi Starter Template and «کنسول»: `starter-template.test.ts` and `editor-browser.test.ts`.

**Safari: manual check pending.** Safari 17.5 desktop and iOS Safari. On desktop, enable Safari → Settings → Advanced → "Press Tab to highlight each item" first; otherwise Tab skips links and buttons.
- Items 1–3: Farsi chrome and fonts; arrow, Shift+Arrow, Delete and click on `<h1>سلام دنیا</h1>`; Preview RTL in Yekan.
- Item 4: Tab order and the blue rings, plus arrows on the tabs.
- Item 5 on an iPhone: tap the pane's lower lines and confirm the HTML/CSS/JS tabs stay on screen above the keyboard.

To automate this later: Develop → "Allow Remote Automation", then run `safaridriver --enable` once.
