import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

const doc = page('index.html');
/** An element's text with whitespace collapsed; '' when it is missing. */
const text = (el: Element | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const SUPPORT = 'https://t.me/codaminsupport';

describe('courses (#courses)', () => {
  const courses = doc.querySelector('main > section#courses');

  it('follows About (which holds the Brands), with its eyebrow and h2', () => {
    expect(courses?.previousElementSibling?.id).toBe('about');
    expect(text(courses?.querySelector('header p'))).toBe('آموزش');
    expect(text(courses?.querySelector('h2'))).toBe('دوره‌های من');
  });

  describe('Masterclass card', () => {
    const card = courses?.querySelector('[data-masterclass]');

    it('leads with a gray (surface) banner slot carrying the «دوره پرچم‌دار» badge', () => {
      const banner = card?.querySelector('[data-banner]');
      expect(banner?.classList.contains('bg-surface')).toBe(true);
      expect(text(banner)).toBe('دوره پرچم‌دار');
      expect(text(card)).not.toContain('قابل آپلود');
    });

    it('names and describes the Masterclass', () => {
      expect(text(card?.querySelector('h3'))).toBe(
        'مسترکلاس برنامه‌نویسی و طراحی سایت با هوش مصنوعی',
      );
      expect(text(card?.querySelector('h3 + p'))).toBe(
        'آموزش طراحی سایت و برنامه‌نویسی با هوش مصنوعی از صفر، بدون هیچ پیش‌نیاز — به‌همراه دسترسی کامل به تمام دوره‌ها و آموزش‌های امین ربانیان.',
      );
    });

    it('enrolls through a filled «ثبت‌نام» button to Support, priced 15 میلیون تومان', () => {
      const enroll = card?.querySelector('a');
      expect(text(enroll)).toBe('ثبت‌نام');
      expect(enroll?.getAttribute('href')).toBe(SUPPORT);
      expect(enroll?.classList.contains('bg-primary')).toBe(true);
      expect(text(card?.querySelector('[data-price]'))).toBe('15 میلیون تومان');
    });
  });

  describe('Course rail', () => {
    const rail = courses?.querySelector('ul[data-rail]');
    const cards = [...(rail?.querySelectorAll(':scope > li') ?? [])];

    it('hints at swiping above the Rail on mobile only', () => {
      const hint = rail?.previousElementSibling;
      expect(text(hint)).toBe('← برای دیدن بیشتر بکشید');
      expect(hint?.classList.contains('md:hidden')).toBe(true);
    });

    it('is a named Rail that becomes a 2-column grid at md', () => {
      expect(rail?.getAttribute('aria-label')).toBe('دوره‌های من');
      expect(rail?.classList.contains('md:grid-cols-2')).toBe(true);
    });

    it('lists the 7 other Courses in order: category, title, description', () => {
      expect(cards.map((card) => text(card.querySelector('h3')))).toEqual([
        'مینی‌دوره برنامه‌نویسی با AI',
        'آموزش فیگما از صفر',
        'طراحی سایت‌های سه‌بعدی',
        'تگ منیجر برای مبتدیان',
        'آموزش پست‌هاگ (PostHog)',
        'مایکروسافت کلریتی',
        'آموزش کرسر (Cursor)',
      ]);
      expect(text(cards[0]?.querySelector('[data-category]'))).toBe('AI Coding');
      expect(text(cards[6]?.querySelector('[data-category]'))).toBe('ایجنتیک');
      expect(text(cards[0]?.querySelector('h3 + p'))).toBe(
        'آموزش فشرده طراحی سایت با هوش مصنوعی از صفر.',
      );
    });

    it('prices each card in «میلیون»', () => {
      expect(cards.map((card) => text(card.querySelector('[data-price]')))).toEqual([
        '5 میلیون',
        '2 میلیون',
        '4 میلیون',
        '2 میلیون',
        '1 میلیون',
        '1 میلیون',
        '3 میلیون',
      ]);
    });

    it('sets every price amount, Masterclass included, in weight 600 (spec: prices)', () => {
      const amounts = [...(courses?.querySelectorAll('[data-price] b') ?? [])];
      expect(amounts).toHaveLength(8);
      for (const amount of amounts) {
        expect(amount.classList.contains('font-semibold')).toBe(true);
        expect(amount.classList.contains('font-bold')).toBe(false);
      }
    });

    it('links every card\'s «جزئیات ←» to Support while no Course has its own url', () => {
      for (const card of cards) {
        const details = card.querySelector('a');
        expect(text(details)).toBe('جزئیات ←');
        expect(details?.getAttribute('href')).toBe(SUPPORT);
        expect(details?.classList.contains('text-primary-text')).toBe(true);
      }
    });
  });
});

describe('toolbox (#tools)', () => {
  const tools = doc.querySelector('main > section#tools');
  const rows = [...(tools?.querySelectorAll('ul > li > *') ?? [])];

  it('follows Courses, with its eyebrow, h2 and note', () => {
    expect(tools?.previousElementSibling?.id).toBe('courses');
    expect(text(tools?.querySelector('header p'))).toBe('جعبه‌ابزار');
    expect(text(tools?.querySelector('h2'))).toBe('ابزارها');
    expect(text(tools?.querySelector('header + p'))).toBe(
      'ویرایشگر HTML برای همه آزاد است؛ باقی ابزارها ویژهٔ دانش‌پذیران دورهٔ مسترکلاس فعال می‌شوند.',
    );
  });

  it('lays a fine SVG dot pattern behind it, decorative and out of the way of the pointer', () => {
    const layer = tools?.firstElementChild;
    expect(layer?.getAttribute('data-pattern')).toBe('dots');
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    expect(layer?.getAttribute('class')).toContain('pointer-events-none');
    expect(layer?.querySelector('pattern#tools-dots circle')).not.toBeNull();
    expect(layer?.querySelector('rect')?.getAttribute('fill')).toBe('url(#tools-dots)');
  });

  it('lists the 8 Tools in order', () => {
    expect(rows.map((row) => text(row.querySelector('[data-title]')))).toEqual([
      'ویرایشگر HTML',
      'دیکشنری اصطلاحات',
      'مگاپرامپت‌ها',
      'کتاب‌های مرجع',
      'ویدئوها',
      'نمونه قراردادها',
      'نمونه کد وبسایت‌ها',
      'دانلود نرم‌افزارها',
    ]);
  });

  it('gives every Tool an icon tile: a primary glyph on primary-soft', () => {
    for (const row of rows) {
      const tile = row.querySelector('[data-icon]');
      expect(tile?.classList.contains('bg-primary-soft')).toBe(true);
      expect(tile?.classList.contains('text-primary')).toBe(true);
      expect(tile?.querySelector('svg path')).not.toBeNull();
    }
  });

  it('opens the HTML Editor, the Free Tool, as a link to /editor in an emerald border, with a check', () => {
    const editor = rows[0];
    expect(editor?.tagName).toBe('A');
    expect(editor?.getAttribute('href')).toBe('/editor');
    expect(editor?.classList.contains('free-tool')).toBe(true);
    expect(editor?.querySelector('[data-check] svg')?.getAttribute('aria-hidden')).toBe('true');
    // The check sits last: at the left end of the RTL row, where Locked Tools have their lock.
    expect(editor?.lastElementChild?.hasAttribute('data-check')).toBe(true);
    expect(text(editor)).toBe('ویرایشگر HTML فعال · ورود ←');
  });

  it('writes the Free Tool’s note in muted gray, its «·» drawn as a dot icon', () => {
    const note = rows[0]?.querySelector('[data-dotted]');
    expect(note?.classList.contains('text-muted')).toBe(true);
    expect(note?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(text(note?.querySelector('.sr-only'))).toBe('·');
  });

  it('shows the 7 Locked Tools as inert rows: no link, not focusable, aria-disabled, with a lock', () => {
    const locked = rows.slice(1);
    expect(locked).toHaveLength(7);
    for (const row of locked) {
      expect(row.tagName).toBe('DIV');
      expect(row.querySelector('a, button, [href]')).toBeNull();
      expect(row.hasAttribute('tabindex')).toBe(false);
      expect(row.getAttribute('aria-disabled')).toBe('true');
      expect(row.querySelector('[data-lock] svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(text(row).endsWith('ویژه دانش‌پذیران مسترکلاس')).toBe(true);
      expect([...row.classList].some((c) => /^(hover|focus|focus-visible):/.test(c))).toBe(false);
    }
  });

  it('has exactly one link in the Toolbox: the HTML Editor', () => {
    const links = [...(tools?.querySelectorAll('a[href]') ?? [])];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/editor']);
  });
});
