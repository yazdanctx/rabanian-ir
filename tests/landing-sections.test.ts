import { describe, expect, it } from 'vitest';
import { page } from './helpers/dist';

const doc = page('index.html');
/** An element's text with whitespace collapsed; '' when it is missing. */
const text = (el: Element | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('page structure', () => {
  const sections = [...doc.querySelectorAll('main > section')];

  it('puts the top bar first, then Hero, About and Brands in spec order', () => {
    const content = [...doc.body.children].filter((el) => el.tagName !== 'SCRIPT');
    expect(content[0]?.tagName).toBe('HEADER');
    expect(sections.slice(0, 3).map((s) => s.id || text(s.querySelector('p')))).toEqual([
      'top',
      'about',
      'برندهایی که افتخار همکاری با آن‌ها را داشته‌ام',
    ]);
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
      'white', // About
      'gray', // Brands
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

  it('has its eyebrow and h2', () => {
    expect(text(about?.querySelector('header p'))).toBe('من کی هستم؟');
    expect(text(about?.querySelector('h2'))).toBe('یک مسیر؛ از مهندسی تا محصول');
  });

  it('tells the story with the four Brand names emphasised in ink', () => {
    const paragraph = about?.querySelector('header + p');
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
});

describe('brands', () => {
  const caption = 'برندهایی که افتخار همکاری با آن‌ها را داشته‌ام';
  const brands = [...doc.querySelectorAll('main > section')].find((s) =>
    text(s).startsWith(caption),
  );
  const rail = brands?.querySelector('ul[data-rail]');

  it('captions a Rail of the five Brands, each its logo + name, in order', () => {
    expect(brands).toBeDefined();
    const chips = [...(rail?.querySelectorAll(':scope > li') ?? [])];
    expect(chips.map(text)).toEqual([
      'اسنپ',
      'مستربلیط',
      'گروه صنعتی انتخاب',
      'سی‌آر‌ام دیدار',
      'ویسِند انگلیس',
    ]);
    const logos = chips.map((chip) => chip.querySelector('[data-logo] img'));
    for (const img of logos) {
      // Decorative: the Brand's name is right below it.
      expect(img?.getAttribute('alt')).toBe('');
      expect(img?.getAttribute('loading')).toBe('lazy');
    }
    expect(new Set(logos.map((img) => img?.getAttribute('src'))).size).toBe(5);
  });

  it('makes the Rail a named, keyboard-scrollable list', () => {
    expect(rail?.getAttribute('aria-label')).toBe(caption);
    expect(rail?.getAttribute('tabindex')).toBe('0');
  });

  it('marks only the Brands Rail to auto-scroll; the loop’s copies are made in the browser', () => {
    expect(rail?.hasAttribute('data-autoscroll')).toBe(true);
    expect(doc.querySelectorAll('[data-autoscroll]')).toHaveLength(1);
    expect(rail?.querySelectorAll(':scope > li')).toHaveLength(5);
  });

  it('snaps the Rail horizontally on mobile and turns it into a grid at md', () => {
    const classes = [...(rail?.classList ?? [])];
    expect(classes).toEqual(expect.arrayContaining(['snap-x', 'snap-mandatory', 'md:grid']));
    expect(classes.some((c) => /^md:grid-cols-[23]$/.test(c))).toBe(true);
  });
});
