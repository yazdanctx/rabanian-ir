/**
 * Site-wide singletons: links and one-off section copy. List-shaped content
 * lives in the content collections (`src/content/*.json`). Components import
 * from here and never hard-code copy, prices or links.
 *
 * Strings are verbatim from the design (ZWNJ included); digits are ASCII and
 * the FaNum font draws them Persian (ADR-0002).
 */

export const LINKS = {
  /** Support (پشتیبانی): the Telegram account for questions and enrollment. */
  support: 'https://t.me/codaminsupport',
  channel: 'https://t.me/aminrabanian',
  linkedin: 'https://www.linkedin.com/in/amin-rabanian/',
} as const;

/** Where a Course's «ثبت‌نام» / «جزئیات ←» goes: its own `url`, else Support. */
export function courseLink(course: { url?: string }): string {
  return course.url ?? LINKS.support;
}

const tagline = 'با من هوش مصنوعی رو اصولی یاد بگیر!';

export const SITE = {
  /** The site's domain, shown on the OG image. */
  domain: 'rabanian.ir',
  /** Logo text, next to Amin's photo. */
  brand: 'آکادمی ربانیان',
  name: 'امین ربانیان',
  /** Hero status badge, next to the pulsing dot. */
  badge: 'متخصص هوش مصنوعی · مدیریت محصول',
  tagline,
  lead: 'تجربیاتم از دل دنیای کسب‌وکار و هوش مصنوعی رو باهات به اشتراک می‌ذارم تا درآمدت رو افزایش بدی!',
  /** The home page's meta description (also its og/twitter description). */
  description:
    'امین ربانیان، متخصص هوش مصنوعی و مدیریت محصول؛ دوره‌های آموزش هوش مصنوعی، برنامه‌نویسی و طراحی سایت.',
  /** The tagline, then a one-line bio. */
  footerBio: `${tagline} متخصص هوش مصنوعی و مدیریت محصولات نرم‌افزاری.`,
} as const;

/** A run of About text: plain, or a Brand name to emphasise. */
export type AboutPart = string | { brand: string };

export const COPY = {
  topBar: {
    supportLabel: 'پشتیبانی تلگرام',
  },
  hero: {
    photoPill: 'هوش مصنوعی کاربردی ✦',
    coursesButton: 'دوره‌ها',
    toolsButton: 'ابزارها',
  },
  about: {
    eyebrow: 'من کی هستم؟',
    title: 'یک مسیر؛ از مهندسی تا محصول',
    paragraph: [
      'از دنیای مهندسی برق و کامپیوتر به فضای کسب‌وکارهای آنلاین رسیدم و الان 10 ساله که در توسعه و رشد کسب‌وکارهای بزرگ در ایران و انگلیس نقش داشتم. کسب‌وکارهایی مثل ',
      { brand: 'اسنپ' },
      '، ',
      { brand: 'گروه صنعتی انتخاب' },
      '، ',
      { brand: 'مستربلیط' },
      '، ',
      { brand: 'سی‌آر‌ام دیدار' },
      ' و … فقط بخشی از کسب‌وکارهایی هستن که افتخار همراهی، مدیریت یا مشاوره‌شون رو داشتم.',
    ] as readonly AboutPart[],
  },
  brands: {
    caption: 'برندهایی که افتخار همکاری با آن‌ها را داشته‌ام',
  },
  courses: {
    eyebrow: 'آموزش',
    title: 'دوره‌های من',
    /** Masterclass button. */
    enroll: 'ثبت‌نام',
    /** Alt text of the Masterclass banner image. */
    bannerAlt: 'بنر دوره مسترکلاس',
    /** Rail card link. */
    details: 'جزئیات ←',
    /** Under the Courses rail, mobile only. */
    swipeHint: '← برای دیدن بیشتر بکشید',
    /** Rail cards: `5 میلیون`. */
    priceUnit: 'میلیون',
    /** Masterclass: `15 میلیون تومان`. */
    priceUnitLong: 'میلیون تومان',
  },
  tools: {
    eyebrow: 'جعبه‌ابزار',
    title: 'ابزارها',
    note: 'ویرایشگر HTML برای همه آزاد است؛ باقی ابزارها ویژهٔ دانش‌پذیران دورهٔ مسترکلاس فعال می‌شوند.',
  },
  testimonials: {
    eyebrow: 'تجربه دانش‌پذیران',
    title: 'نظرات',
  },
  resume: {
    eyebrow: 'مسیر من',
    title: 'خلاصه‌ای از سوابق',
    experienceTitle: 'تجربهٔ حرفه‌ای',
    educationTitle: 'تحصیلات',
    /** Screen-reader text for the dot icon between employer and period. */
    separator: '·',
  },
  cta: {
    eyebrow: 'پشتیبانی',
    title: 'سوالی دربارهٔ دوره‌ها یا ثبت‌نام داری؟',
    line: 'همین حالا در تلگرام به پشتیبانی پیام بده؛ سریع راهنمایی می‌شی.',
    button: 'پیام در تلگرام',
  },
  footer: {
    links: [
      { label: 'پشتیبانی و مشاوره', href: LINKS.support, icon: 'telegram' },
      { label: 'کانال تلگرام', href: LINKS.channel, icon: 'telegram' },
      { label: 'لینکدین', href: LINKS.linkedin, icon: 'linkedin' },
    ],
    /** «ساخته شده با ♥ توسط آکادمی ربانیان» — the heart is an inline SVG between the two. */
    creditBefore: 'ساخته شده با',
    /** Screen-reader text for the heart SVG. */
    creditHeart: '♥',
    creditAfter: 'توسط آکادمی ربانیان',
  },
} as const;
