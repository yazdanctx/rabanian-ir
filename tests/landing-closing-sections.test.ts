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

  it('ends main with Testimonials and Résumé, then the dark footer, which opens with the CTA', () => {
    const lastTitles = sections.slice(-2).map((s) => text(s.querySelector('h2')));
    expect(lastTitles).toEqual(['نظرات', 'خلاصه‌ای از سوابق']);
    const footer = doc.querySelector('main')?.nextElementSibling;
    expect(footer?.tagName).toBe('FOOTER');
    expect(text(footer?.querySelector('h2'))).toBe('سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟');
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

  it('draws each quote on a card that follows its band (gray on this white one), like every other card', () => {
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.classList.contains('bg-(--card)')).toBe(true);
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
      'مدیر محصول نرم‌افزاری ویسِند انگلستان · تیر 1404 – اکنون هوشمندسازی شبکه‌های اجتماعی با هوش مصنوعی.',
      'مدیر ارشد محصول مستربلیط · مرداد 1403 – تیر 1404 توسعه و گسترش پلتفرم مستربلیط و رشد تیم محصول در صنعت سفر آنلاین.',
      'مدیر محصول سی‌آر‌ام دیدار · آذر 1402 – تیر 1403 رهبری تیم محصول.',
      'مدیر عملکرد اسنپ · خرداد 1402 – آذر 1402 همکاری با تیمی حدود 50 نفره، بهبود فرایندها، تحلیل داده با تیم BI، توسعهٔ پروژه‌های جدید (اسنپ‌لاین و اسنپ‌استور) و ساخت داشبورد داخلی سازمانی.',
    ]);
  });

  it('separates employer and period with a dot icon, read out as «·»', () => {
    for (const item of itemsAfter('تجربهٔ حرفه‌ای')) {
      const meta = item.querySelector('[data-meta]');
      // The font's «·» glyph sits above the line's middle; an SVG dot is drawn instead.
      expect(meta?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(text(meta?.querySelector('.sr-only'))).toBe('·');
      const visible = [...(meta?.childNodes ?? [])].filter((n) => n.nodeType === 3).map((n) => n.textContent);
      expect(visible.join('')).not.toContain('·');
    }
  });

  it('draws the Experiences as a timeline: a line with the employer’s logo per entry', () => {
    expect(listAfter('تجربهٔ حرفه‌ای')?.hasAttribute('data-timeline')).toBe(true);
    const logos = itemsAfter('تجربهٔ حرفه‌ای').map((item) => item.querySelector('[data-logo] img'));
    for (const img of logos) {
      // Decorative: the employer's name is right next to it.
      expect(img?.getAttribute('alt')).toBe('');
      expect(img?.getAttribute('width')).toBe('36');
      expect(img?.getAttribute('height')).toBe('36');
      expect(img?.getAttribute('loading')).toBe('lazy');
    }
    // One distinct logo per employer, each a built asset.
    const srcs = logos.map((img) => img?.getAttribute('src') ?? '');
    expect(new Set(srcs).size).toBe(4);
    for (const src of srcs) expect(src).toMatch(/^\/_astro\//);
  });

  it('lists the three degrees with their universities', () => {
    expect(itemsAfter('تحصیلات').map(text)).toEqual([
      'کارشناسی ارشد مدیریت دانشگاه تهران',
      'کارشناسی ارشد مهندسی برق دانشگاه صنعتی اصفهان',
      'کارشناسی مهندسی برق دانشگاه صنعتی اصفهان',
    ]);
  });

  it('ends each degree card with its university’s logo (the left side, in RTL)', () => {
    const items = itemsAfter('تحصیلات');
    const logos = items.map((item) => item.lastElementChild);
    for (const logo of logos) {
      expect(logo?.hasAttribute('data-logo')).toBe(true);
      const img = logo?.querySelector('img');
      // Decorative: the university's name is right next to it.
      expect(img?.getAttribute('alt')).toBe('');
      expect(img?.getAttribute('width')).toBe('36');
      expect(img?.getAttribute('height')).toBe('36');
      expect(img?.getAttribute('loading')).toBe('lazy');
      expect(img?.getAttribute('src')).toMatch(/^\/_astro\//);
    }
    // Tehran, then Isfahan University of Technology for both its degrees.
    const [tehran, iutMsc, iutBsc] = logos.map((logo) => logo?.querySelector('img')?.getAttribute('src'));
    expect(iutMsc).toBe(iutBsc);
    expect(tehran).not.toBe(iutMsc);
  });
});

describe('CTA', () => {
  const footer = doc.querySelector('body > footer');
  const block = footer?.querySelector('[data-cta]');

  it('opens the footer, on its ink, with white text', () => {
    expect(footer?.firstElementChild?.nextElementSibling?.firstElementChild).toBe(block);
    expect(block?.closest('.bg-ink')).toBe(footer);
    expect(footer?.classList.contains('text-white')).toBe(true);
  });

  it('draws a faint grid of squares behind the whole footer as a decorative SVG pattern, no gradient', () => {
    const grid = footer?.querySelector(':scope > svg');
    expect(grid?.getAttribute('aria-hidden')).toBe('true');
    expect(grid?.querySelector('pattern')).not.toBeNull();
    expect(grid?.innerHTML).not.toMatch(/gradient/i);
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

  it('is on the only dark surface on the page, the footer', () => {
    // Palette P has no dark token besides ink (and no default palette to reach for).
    expect([...doc.querySelectorAll('.bg-ink')]).toEqual([footer]);
  });
});

describe('footer', () => {
  const footer = doc.querySelector('body > footer');

  it('closes the page, after main, as one dark ink block: the CTA, then the logo, bio and links', () => {
    expect(footer?.previousElementSibling?.tagName).toBe('MAIN');
    expect(footer?.classList.contains('bg-ink')).toBe(true);
    const cta = footer?.querySelector('[data-cta]');
    const nav = footer?.querySelector('nav');
    expect(cta && nav && cta.compareDocumentPosition(nav) & 4).toBeTruthy(); // CTA first
  });

  it('repeats the logo, linking to the top, and the one-line bio', () => {
    const logo = footer?.querySelector('a[href="#top"]');
    expect(text(logo)).toBe('آکادمی ربانیان');
    expect(logo?.querySelector('picture img')).not.toBeNull();
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
