import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

// Sections 7–10 of the spec: Testimonials, Résumé, CTA, Footer.
const doc = page('index.html');
/** An element's text with whitespace collapsed; '' when it is missing. */
const text = (el: Element | null | undefined): string =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
/** The <main> section whose h2 reads `title`. */
const sectionTitled = (title: string) =>
  [...doc.querySelectorAll('main > section')].find((s) => text(s.querySelector('h2')) === title);

describe('testimonials', () => {
  const section = sectionTitled('نظرات');
  const rail = section?.querySelector('ul[data-rail]');
  const cards = [...(rail?.querySelectorAll(':scope > li > figure') ?? [])];

  it('has its eyebrow and h2', () => {
    expect(section).toBeDefined();
    expect(text(section?.querySelector('header p'))).toBe('تجربه دانش‌پذیران');
  });

  it('shows the four Learner quotes verbatim, emoji included, on a named Rail', () => {
    expect(rail?.getAttribute('aria-label')).toBe('نظرات');
    expect(cards.map((c) => text(c.querySelector('blockquote')))).toEqual([
      'دوره خیلی خوب بود و راضی بودم.',
      'واقعاً استاد خوب توضیح می‌دن که نتیجهٔ تمرین‌هام می‌شه این 😍 برای ثبت‌نام خیلی دودل بودم اما الان خیلی راضی‌ام و می‌دونم قراره کلی کارهای خفن انجام بدم 😍',
      'دارم دوره رو تماشا می‌کنم که برای دخترم هست (سال دوم شبکه و نرم‌افزار) و تمرین‌ها رو بهش می‌دم؛ خیلی ذوق داره 😊 استاد فرمودند دانشجویان مستعد رو در پروژه‌های آینده به کار می‌گیرند. 🚀',
      'خیلی ممنون از آموزش‌های خوبتون و راهنمایی‌هاتون حین دوره. اینجوری کمک می‌کنه پیشرفت بیشتری داشته باشم 😍',
    ]);
  });

  it('attributes each quote to a Learner: initial-letter avatar, name, role', () => {
    const captions = cards.map((c) => c.querySelector('figcaption'));
    const avatars = captions.map((c) => c?.querySelector('[data-avatar]'));
    expect(avatars.map(text)).toEqual(['ز', 'س', 'م', 'ف']);
    for (const avatar of avatars) {
      expect(avatar?.getAttribute('aria-hidden')).toBe('true');
      expect(avatar?.classList.contains('bg-surface')).toBe(true);
    }
    expect(captions.map(text)).toEqual([
      'ز زهرا قاضی‌زاهدی دانش‌پذیر مسترکلاس',
      'س سارا اسفندیاری دانش‌پذیر مسترکلاس',
      'م میثم بدرقه دانش‌پذیر مسترکلاس',
      'ف فرناز کاشی دانش‌پذیر مسترکلاس',
    ]);
  });
});
