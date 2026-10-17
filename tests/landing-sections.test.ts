import { describe, expect, it } from 'vitest';
import { collection } from './helpers/content';
import { page } from './helpers/dist';

const doc = page('index.html');
/** An element's text with whitespace collapsed; '' when it is missing. */
const text = (el: Element | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('page structure', () => {
  const sections = [...doc.querySelectorAll('main > section')];

  it('puts the top bar first, then Hero, About (with the Brands in it) and Courses in spec order', () => {
    const content = [...doc.body.children].filter((el) => el.tagName !== 'SCRIPT');
    expect(content[0]?.tagName).toBe('HEADER');
    expect(sections.slice(0, 3).map((s) => s.id)).toEqual(['top', 'about', 'courses']);
  });

  it('separates sections with a 1px line rule and centers them in the page column', () => {
    for (const section of sections) {
      expect(section.classList.contains('border-b')).toBe(true);
      expect(section.classList.contains('border-line')).toBe(true);
      expect(section.querySelector(':scope > .max-w-page')).not.toBeNull();
    }
  });

  it('alternates white and gray bands from a white Hero, before the dark footer', () => {
    expect(sections.map((s) => s.getAttribute('data-tone'))).toEqual([
      'white', // Hero
      'gray', // About, with the Brands
      'white', // Courses
      'gray', // Toolbox
      'white', // Testimonials
      'gray', // Résumé
    ]);
  });

  it('draws no side borders on any column, top bar to footer (the frame was dropped)', () => {
    const columns = [
      doc.querySelector('body > header > div'),
      ...sections.map((s) => s.querySelector(':scope > .max-w-page')),
      doc.querySelector('body > footer > .max-w-page'),
    ];
    for (const column of columns) {
      expect(column).not.toBeNull();
      expect([...column!.classList].filter((c) => /border-(x|s|e|l|r)\b/.test(c))).toEqual([]);
    }
  });
});

describe('top bar', () => {
  const header = doc.querySelector('body > header');

  it('links the logo, Amin’s photo + «آکادمی ربانیان», to the top of the page', () => {
    const logo = header?.querySelector('a[href="#top"]');
    expect(text(logo)).toBe('آکادمی ربانیان');
    expect(logo?.getAttribute('dir')).toBeNull();
    const img = logo?.querySelector('picture img');
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('width')).toBe('30');
    expect(img?.getAttribute('height')).toBe('30');
    expect(logo?.querySelectorAll('picture source').length).toBe(2);
  });

  it('has a Telegram button to Support, named for screen readers', () => {
    const support = header?.querySelector('a[href="https://t.me/codaminsupport"]');
    expect(support?.getAttribute('aria-label')).toBe('پشتیبانی تلگرام');
    expect(support?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('hero (#top)', () => {
  const hero = doc.querySelector('main #top');

  it('introduces Amin: badge, name as the only h1, tagline and lead', () => {
    expect(text(hero?.querySelector('[data-badge]'))).toBe('متخصص هوش مصنوعی · مدیریت محصول');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(text(hero?.querySelector('h1'))).toBe('امین ربانیان');
    const paragraphs = [...(hero?.querySelectorAll('p') ?? [])].map(text);
    expect(paragraphs).toContain('با من هوش مصنوعی رو اصولی یاد بگیر!');
    expect(paragraphs).toContain(
      'تجربیاتم از دل دنیای کسب‌وکار و هوش مصنوعی رو باهات به اشتراک می‌ذارم تا درآمدت رو افزایش بدی!',
    );
  });

  it('marks the badge dot as the pulsing dot, hidden from screen readers', () => {
    const dot = hero?.querySelector('[data-badge] .pulse-dot');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
  });

  it('holds a profile photo slot named for Amin, with a static pill label', () => {
    const slot = hero?.querySelector('[data-profile-photo]');
    const named = slot?.querySelector('img[alt], [role="img"]');
    expect(named?.getAttribute('alt') ?? named?.getAttribute('aria-label')).toBe('امین ربانیان');
    expect(text(slot)).toContain('هوش مصنوعی کاربردی ✦');
    expect(text(slot)).not.toContain('قابل آپلود');
  });

  it('offers «دوره‌ها» (filled) to #courses and «ابزارها» (outlined) to #tools', () => {
    const courses = hero?.querySelector('a[href="#courses"]');
    const tools = hero?.querySelector('a[href="#tools"]');
    expect(text(courses)).toBe('دوره‌ها');
    expect(courses?.className).toMatch(/\bbg-primary\b/);
    expect(text(tools)).toBe('ابزارها');
    expect(tools?.className).toMatch(/\bborder-line\b/);
  });

  it('shows the three stats with ASCII digits for the font to draw Persian', () => {
    const tiles = [...(hero?.querySelectorAll('[data-stats] > li') ?? [])].map(text);
    expect(tiles).toEqual(['10 سال تجربه', '8 دوره تخصصی', '+2000 دانش‌پذیر']);
    expect(hero?.textContent).not.toMatch(/[۰-۹٠-٩]/);
  });
});

describe('about (#about)', () => {
  const about = doc.querySelector('main #about');
  const caption = 'برندهایی که افتخار همکاری با آن‌ها را داشته‌ام';

  it('has its eyebrow and h2', () => {
    expect(text(about?.querySelector('header p'))).toBe('من کی هستم؟');
    expect(text(about?.querySelector('h2'))).toBe('یک مسیر؛ از مهندسی تا محصول');
  });

  it('opens with a strip of the five photos, in gallery order, each named in Farsi', () => {
    const strip = about?.querySelector('header + [data-gallery-frame] > ul[data-gallery]');
    expect(strip?.getAttribute('aria-label')).toBe('تصاویری از مسیر کاری امین ربانیان');
    expect(strip?.getAttribute('tabindex')).toBe('0');
    const photos = [...(strip?.querySelectorAll(':scope > li') ?? [])];
    expect(photos.map((li) => li.querySelector('img')?.getAttribute('alt'))).toEqual(
      collection('gallery').map((photo) => photo.alt),
    );
    for (const li of photos) {
      const picture = li.querySelector('picture');
      expect([...(picture?.querySelectorAll('source') ?? [])].map((s) => s.getAttribute('type'))).toEqual([
        'image/avif',
        'image/webp',
      ]);
      const img = picture?.querySelector('img');
      expect(img?.getAttribute('loading')).toBe('lazy');
      expect(Number(img?.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(img?.getAttribute('height'))).toBeGreaterThan(0);
    }
  });

  it('makes the photo strip the one auto-scrolling row; its loop copies are made in the browser', () => {
    const strip = about?.querySelector('ul[data-gallery]');
    expect(strip?.hasAttribute('data-autoscroll')).toBe(true);
    expect([...doc.querySelectorAll('[data-autoscroll]')]).toEqual([strip]);
    expect(strip?.children).toHaveLength(5);
  });

  it('tells the story under the photos, with the four Brand names emphasised in ink', () => {
    const paragraph = about?.querySelector('[data-gallery-frame] + p');
    expect(text(paragraph)).toBe(
      'از دنیای مهندسی برق و کامپیوتر به فضای کسب‌وکارهای آنلاین رسیدم و الان 10 ساله که در توسعه و رشد کسب‌وکارهای بزرگ در ایران و انگلیس نقش داشتم. کسب‌وکارهایی مثل اسنپ، گروه صنعتی انتخاب، مستربلیط، سی‌آر‌ام دیدار و … فقط بخشی از کسب‌وکارهایی هستن که افتخار همراهی، مدیریت یا مشاوره‌شون رو داشتم.',
    );
    const brands = [...(paragraph?.querySelectorAll('strong') ?? [])];
    expect(brands.map(text)).toEqual(['اسنپ', 'گروه صنعتی انتخاب', 'مستربلیط', 'سی‌آر‌ام دیدار']);
    for (const brand of brands) {
      expect(brand.classList.contains('font-semibold')).toBe(true);
      expect(brand.classList.contains('text-ink')).toBe(true);
    }
  });

  it('ends with the Brands as a still wall: the caption cell, then the five logos with names', () => {
    const wall = about?.querySelector('[data-gallery-frame] + p + [data-brand-wall]');
    const label = wall?.querySelector(':scope > p');
    expect(text(label)).toBe(caption);
    const list = wall?.querySelector(':scope > ul');
    expect(list?.getAttribute('aria-labelledby')).toBe(label?.id);
    const cells = [...(list?.querySelectorAll(':scope > li') ?? [])];
    expect(cells.map(text)).toEqual(['اسنپ', 'مستربلیط', 'گروه صنعتی انتخاب', 'سی‌آر‌ام دیدار', 'ویسِند انگلیس']);
    const logos = cells.map((cell) => cell.querySelector('[data-logo] img'));
    for (const img of logos) {
      // Decorative: the Brand's name is right below it.
      expect(img?.getAttribute('alt')).toBe('');
      expect(img?.getAttribute('loading')).toBe('lazy');
    }
    expect(new Set(logos.map((img) => img?.getAttribute('src'))).size).toBe(5);
    // Still: no scrolling row, no loop.
    expect(wall?.querySelector('[data-rail], [data-autoscroll]')).toBeNull();
  });

  it('reveals the wall as one block (cells fading alone would flash the hairline backing)', () => {
    const wall = about?.querySelector('[data-brand-wall]');
    expect(wall?.hasAttribute('data-reveal')).toBe(true);
    expect(wall?.querySelector('[data-reveal]')).toBeNull();
  });
});
