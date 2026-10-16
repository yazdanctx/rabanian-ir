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

describe('page assembly', () => {
  const sections = [...doc.querySelectorAll('main > section')];
  it('gives sections exactly the spec ids, in spec order', () => {
    expect(sections.map((s) => s.id).filter(Boolean)).toEqual([
      'top',
      'about',
      'courses',
      'tools',
      'resume',
    ]);
  });

  it('lands every in-page anchor on an element of the page', () => {
    const targets = [...doc.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')!);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of new Set(targets)) {
      expect(doc.getElementById(target.slice(1)), target).not.toBeNull();
    }
  });

  it('ends main with Testimonials, Résumé and the CTA, then the footer', () => {
    const lastTitles = sections.slice(-3).map((s) => text(s.querySelector('h2')));
    expect(lastTitles).toEqual(['نظرات', 'خلاصه‌ای از سوابق', 'سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟']);
    expect(doc.querySelector('main')?.nextElementSibling?.tagName).toBe('FOOTER');
  });
});

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

  it('draws each quote on a surface card, like every other card', () => {
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.classList.contains('bg-surface')).toBe(true);
      expect(card.classList.contains('rounded-card')).toBe(true);
    }
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

describe('résumé (#resume)', () => {
  const resume = doc.querySelector('main #resume');
  const headings = [...(resume?.querySelectorAll('h3') ?? [])];
  /** The list that directly follows the h3 reading `title`. */
  const listAfter = (title: string) => headings.find((h) => text(h) === title)?.nextElementSibling;
  const itemsAfter = (title: string) => [...(listAfter(title)?.querySelectorAll(':scope > li') ?? [])];

  it('has its eyebrow and h2', () => {
    expect(text(resume?.querySelector('header p'))).toBe('مسیر من');
    expect(text(resume?.querySelector('h2'))).toBe('خلاصه‌ای از سوابق');
    expect(headings.map(text)).toEqual(['تجربهٔ حرفه‌ای', 'تحصیلات']);
  });

  it('lists the four Experiences, newest first: role, employer · period, summary', () => {
    expect(itemsAfter('تجربهٔ حرفه‌ای').map(text)).toEqual([
      'مدیر محصول نرم‌افزاری ویسِند انگلستان · جولای 2025 – اکنون هوشمندسازی شبکه‌های اجتماعی با هوش مصنوعی.',
      'مدیر ارشد محصول مستربلیط · آگوست 2024 – جولای 2025 توسعه و گسترش پلتفرم مستربلیط و رشد تیم محصول در صنعت سفر آنلاین.',
      'مدیر محصول سی‌آر‌ام دیدار · دسامبر 2023 – جولای 2024 رهبری تیم محصول.',
      'مدیر عملکرد اسنپ · ژوئن 2023 – دسامبر 2023 همکاری با تیمی حدود 50 نفره، بهبود فرایندها، تحلیل داده با تیم BI، توسعهٔ پروژه‌های جدید (اسنپ‌لاین و اسنپ‌استور) و ساخت داشبورد داخلی سازمانی.',
    ]);
  });

  it('draws the Experiences as a timeline: a line with a primary dot per entry', () => {
    expect(listAfter('تجربهٔ حرفه‌ای')?.hasAttribute('data-timeline')).toBe(true);
    for (const item of itemsAfter('تجربهٔ حرفه‌ای')) {
      const dot = item.querySelector('[data-dot]');
      expect(dot?.getAttribute('aria-hidden')).toBe('true');
      expect(dot?.classList.contains('bg-primary')).toBe(true);
    }
  });

  it('lists the three degrees with their universities', () => {
    expect(itemsAfter('تحصیلات').map(text)).toEqual([
      'کارشناسی ارشد مدیریت دانشگاه تهران',
      'کارشناسی ارشد مهندسی برق دانشگاه صنعتی اصفهان',
      'کارشناسی مهندسی برق دانشگاه صنعتی اصفهان',
    ]);
  });
});

describe('CTA', () => {
  const section = sectionTitled('سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟');
  const block = section?.querySelector('h2')?.closest('.bg-ink');

  it('sits on an ink block with an 18px radius and white text', () => {
    expect(block).toBeTruthy();
    expect(block?.classList.contains('rounded-cta')).toBe(true);
    expect(block?.classList.contains('text-white')).toBe(true);
  });

  it('carries the Support eyebrow in the on-dark blue, and the line', () => {
    const eyebrow = block?.querySelector('h2')?.previousElementSibling;
    expect(text(eyebrow)).toBe('پشتیبانی');
    expect(eyebrow?.classList.contains('text-primary-on-ink')).toBe(true);
    expect([...(block?.querySelectorAll('p') ?? [])].map(text)).toContain(
      'همین حالا در تلگرام به پشتیبانی پیام بده؛ سریع راهنمایی می‌شی.',
    );
  });

  it('sends the visitor to Support with a primary «پیام در تلگرام» button', () => {
    const button = block?.querySelector('a[href="https://t.me/codaminsupport"]');
    expect(text(button)).toBe('پیام در تلگرام');
    expect(button?.classList.contains('bg-primary')).toBe(true);
    expect(button?.classList.contains('text-white')).toBe(true);
  });

  it('is the only dark surface on the page', () => {
    // Palette P has no dark token besides ink (and no default palette to reach for).
    expect([...doc.querySelectorAll('.bg-ink')]).toEqual([block]);
  });
});

describe('footer', () => {
  const footer = doc.querySelector('body > footer');

  it('closes the page, after main, on the light page background', () => {
    expect(footer?.previousElementSibling?.tagName).toBe('MAIN');
    expect(footer?.closest('.bg-ink')).toBeNull();
  });

  it('repeats the logo, linking to the top, and the one-line bio', () => {
    const logo = footer?.querySelector('a[href="#top"]');
    expect(text(logo)).toBe('rabanian.ir');
    expect(logo?.querySelector('svg')).not.toBeNull();
    expect([...(footer?.querySelectorAll('p') ?? [])].map(text)).toContain(
      'با من هوش مصنوعی رو اصولی یاد بگیر! متخصص هوش مصنوعی و مدیریت محصولات نرم‌افزاری.',
    );
  });

  it('links Support, the Telegram channel and LinkedIn, each with a decorative icon', () => {
    const links = [...(footer?.querySelectorAll('nav a') ?? [])];
    expect(links.map((a) => [text(a), a.getAttribute('href')])).toEqual([
      ['پشتیبانی و مشاوره', 'https://t.me/codaminsupport'],
      ['کانال تلگرام', 'https://t.me/aminrabanian'],
      ['لینکدین', 'https://www.linkedin.com/in/amin-rabanian/'],
    ]);
    for (const link of links) {
      expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('credits Rabanian Academy with an inline primary heart, no gradient', () => {
    const credit = [...(footer?.querySelectorAll('p') ?? [])].find((p) =>
      text(p).startsWith('ساخته شده با'),
    );
    expect(text(credit)).toBe('ساخته شده با ♥ توسط آکادمی ربانیان');
    const heart = credit?.querySelector('svg');
    expect(heart?.classList.contains('text-primary')).toBe(true);
    expect(credit?.innerHTML).not.toMatch(/gradient/i);
  });
});
