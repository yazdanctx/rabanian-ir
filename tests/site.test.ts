import { describe, expect, it } from 'vitest';
import { COPY, LINKS, SITE, SUPPORT_URL, courseLink } from '../src/site';
import { collection } from './helpers/content';

describe('site singletons', () => {
  it('identifies Amin with name, badge, tagline and lead', () => {
    expect(SITE).toMatchObject({
      domain: 'rabanian.ir',
      name: 'امین ربانیان',
      badge: 'متخصص هوش مصنوعی · مدیریت محصول',
      tagline: 'با من هوش مصنوعی رو اصولی یاد بگیر!',
      lead: 'تجربیاتم از دل دنیای کسب‌وکار و هوش مصنوعی رو باهات به اشتراک می‌ذارم تا درآمدت رو افزایش بدی!',
      footerBio:
        'با من هوش مصنوعی رو اصولی یاد بگیر! متخصص هوش مصنوعی و مدیریت محصولات نرم‌افزاری.',
    });
  });

  it('links Support, the Telegram channel and LinkedIn', () => {
    expect(SUPPORT_URL).toBe('https://t.me/codaminsupport');
    expect(LINKS).toEqual({
      support: 'https://t.me/codaminsupport',
      channel: 'https://t.me/aminrabanian',
      linkedin: 'https://www.linkedin.com/in/amin-rabanian/',
    });
  });

  it('writes the About paragraph with the four highlighted Brands, digits in ASCII', () => {
    const { paragraph } = COPY.about;
    expect(paragraph.map((part) => (typeof part === 'string' ? part : part.brand)).join('')).toBe(
      'از دنیای مهندسی برق و کامپیوتر به فضای کسب‌وکارهای آنلاین رسیدم و الان 10 ساله که در توسعه و رشد کسب‌وکارهای بزرگ در ایران و انگلیس نقش داشتم. کسب‌وکارهایی مثل اسنپ، گروه صنعتی انتخاب، مستربلیط، سی‌آر‌ام دیدار و … فقط بخشی از کسب‌وکارهایی هستن که افتخار همراهی، مدیریت یا مشاوره‌شون رو داشتم.',
    );
    expect(paragraph.flatMap((part) => (typeof part === 'string' ? [] : [part.brand]))).toEqual([
      'اسنپ',
      'گروه صنعتی انتخاب',
      'مستربلیط',
      'سی‌آر‌ام دیدار',
    ]);
  });

  it('carries every section eyebrow and heading in page order', () => {
    expect(
      [COPY.about, COPY.courses, COPY.tools, COPY.testimonials, COPY.resume, COPY.cta].map(
        (s) => [s.eyebrow, s.title],
      ),
    ).toEqual([
      ['من کی هستم؟', 'یک مسیر؛ از مهندسی تا محصول'],
      ['آموزش', 'دوره‌های من'],
      ['جعبه‌ابزار', 'ابزارها'],
      ['تجربه دانش‌پذیران', 'نظرات'],
      ['مسیر من', 'خلاصه‌ای از سوابق'],
      ['پشتیبانی', 'سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟'],
    ]);
  });

  it('carries the remaining section copy from the spec', () => {
    expect(COPY).toMatchObject({
      topBar: { supportLabel: 'پشتیبانی تلگرام' },
      hero: { photoPill: 'هوش مصنوعی کاربردی ✦', coursesButton: 'دوره‌ها', toolsButton: 'ابزارها' },
      brands: { caption: 'برندهایی که افتخار همکاری با آن‌ها را داشته‌ام' },
      courses: {
        enroll: 'ثبت‌نام',
        details: 'جزئیات ←',
        swipeHint: '← برای دیدن بیشتر بکشید',
        priceUnit: 'میلیون',
        priceUnitLong: 'میلیون تومان',
      },
      tools: {
        note: 'ویرایشگر HTML برای همه آزاد است؛ باقی ابزارها ویژهٔ دانش‌پذیران دورهٔ مسترکلاس فعال می‌شوند.',
      },
      resume: { experienceTitle: 'تجربهٔ حرفه‌ای', educationTitle: 'تحصیلات' },
      cta: {
        line: 'همین حالا در تلگرام به پشتیبانی پیام بده؛ سریع راهنمایی می‌شی.',
        button: 'پیام در تلگرام',
      },
      footer: { creditBefore: 'ساخته شده با', creditAfter: 'توسط آکادمی ربانیان' },
    });
  });

  it('lists the footer links in order: Support, channel, LinkedIn', () => {
    expect(COPY.footer.links.map((l) => [l.label, l.href])).toEqual([
      ['پشتیبانی و مشاوره', 'https://t.me/codaminsupport'],
      ['کانال تلگرام', 'https://t.me/aminrabanian'],
      ['لینکدین', 'https://www.linkedin.com/in/amin-rabanian/'],
    ]);
  });
});

describe('courseLink', () => {
  it('sends a Course with its own url there', () => {
    expect(courseLink({ url: 'https://example.com/figma' })).toBe('https://example.com/figma');
  });

  it('falls back to Support on Telegram when a Course has no url', () => {
    expect(courseLink({})).toBe('https://t.me/codaminsupport');
  });

  it('resolves every shipped Course to Support today', () => {
    expect(new Set(collection('courses').map(courseLink))).toEqual(
      new Set(['https://t.me/codaminsupport']),
    );
  });
});
