import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

const doc = page('index.html');
/** An element's text with whitespace collapsed; '' when it is missing. */
const text = (el: Element | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const SUPPORT = 'https://t.me/codaminsupport';

describe('courses (#courses)', () => {
  const courses = doc.querySelector('main > section#courses');

  it('follows the Brands section, with its eyebrow and h2', () => {
    const previous = courses?.previousElementSibling;
    expect(text(previous)).toMatch(/^برندهایی که افتخار همکاری با آن‌ها را داشته‌ام/);
    expect(text(courses?.querySelector('header p'))).toBe('آموزش');
    expect(text(courses?.querySelector('h2'))).toBe('دوره‌های من');
  });

  describe('Masterclass card', () => {
    const card = courses?.querySelector('[data-masterclass]');

    it('leads with a primary-soft banner slot carrying the «دوره پرچم‌دار» badge', () => {
      const banner = card?.querySelector('[data-banner]');
      expect(banner?.classList.contains('bg-primary-soft')).toBe(true);
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
});
