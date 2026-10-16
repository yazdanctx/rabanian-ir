import { PALETTE } from '../../palette';
import type { Files } from './files';

/*
 * The Starter Template (قالب شروع): what the HTML Editor opens with on a first
 * visit and what «بازنشانی» restores. A short Farsi page whose comments teach
 * as they go: where to write, that the page is right to left by default, what
 * a selector is, and how a click handler works. Its JS logs only on a click,
 * so the console starts empty.
 *
 * The Code Pane sets code (comments included) left to right, so in a comment
 * a Latin word may only lead, as a label (`body: …`): one in mid-sentence, or
 * ASCII punctuation after the Farsi, would land at the wrong end of it.
 */

const html = `<!-- هرچه اینجا بنویسی، در پیش‌نمایش دیده می‌شود -->
<!-- صفحه به‌طور پیش‌فرض فارسی و راست‌به‌چپ است -->
<!-- dir="ltr": عنصری که این ویژگی را داشته باشد چپ‌به‌راست می‌شود -->
<h1>سلام دنیا</h1>
<p>این اولین صفحهٔ وب توست؛ متن‌ها را عوض کن و نتیجه را ببین</p>

<!-- id: شناسه‌ای که جاوااسکریپت دکمه را با آن پیدا می‌کند -->
<button id="greet">کلیک کن</button>
`;

const css = `/* هر قانون با یک انتخاب‌گر شروع می‌شود؛ انتخاب‌گر می‌گوید سبک‌ها روی کدام عنصرها اعمال شوند */

/* body: کل صفحه؛ فاصله‌ها و رنگ‌های اصلی */
body {
  margin: 0;
  padding: 24px;
  background: ${PALETTE.surface};
  color: ${PALETTE.ink};
  line-height: 1.8;
}

/* h1: عنوان صفحه */
h1 {
  color: ${PALETTE.primaryText};
}

/* #greet: عنصری که این شناسه را دارد، یعنی دکمه */
#greet {
  padding: 8px 20px;
  border: none;
  border-radius: 12px;
  background: ${PALETTE.primary};
  color: ${PALETTE.white};
  font: inherit;
  cursor: pointer;
}
`;

const js = `// عنوان و دکمهٔ صفحه را پیدا می‌کنیم
const title = document.querySelector('h1');
const button = document.getElementById('greet');

// با هر کلیک روی دکمه، متن عنوان عوض می‌شود و پیامی در کنسول ثبت می‌شود
button.addEventListener('click', () => {
  title.textContent = 'به دنیای وب خوش آمدی';
  // این پیام را در «کنسول» زیر پیش‌نمایش ببین
  console.log('سلام از جاوااسکریپت');
});
`;

export const STARTER_TEMPLATE: Files = { html, css, js };
