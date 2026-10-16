import { describe, expect, it } from 'vitest';
import { collection } from './helpers/content';

describe('courses collection', () => {
  const courses = collection('courses');

  it('opens with the Masterclass, featured and badged, at 15 million toman', () => {
    const [masterclass] = courses;
    expect(masterclass).toMatchObject({
      title: 'مسترکلاس برنامه‌نویسی و طراحی سایت با هوش مصنوعی',
      description:
        'آموزش طراحی سایت و برنامه‌نویسی با هوش مصنوعی از صفر، بدون هیچ پیش‌نیاز — به‌همراه دسترسی کامل به تمام دوره‌ها و آموزش‌های امین ربانیان.',
      featured: true,
      badge: 'دوره پرچم‌دار',
      priceMillionToman: 15,
    });
    expect(courses.filter((c) => c.featured)).toHaveLength(1);
  });

  it('lists the seven rail Courses in design order with category, title, description and price', () => {
    expect(
      courses
        .filter((c) => !c.featured)
        .map((c) => [c.category, c.title, c.description, c.priceMillionToman]),
    ).toEqual([
      ['AI Coding', 'مینی‌دوره برنامه‌نویسی با AI', 'آموزش فشرده طراحی سایت با هوش مصنوعی از صفر.', 5],
      ['طراحی', 'آموزش فیگما از صفر', 'طراحی و دیزاین سایت با نرم‌افزار تخصصی فیگما.', 2],
      ['سه‌بعدی', 'طراحی سایت‌های سه‌بعدی', 'دوره فشرده طراحی سایت‌های انیمیشن‌دار از صفر.', 4],
      ['بازاریابی', 'تگ منیجر برای مبتدیان', 'دوره تخصصی ابزار حرفه‌ای بازاریابی آنلاین گوگل.', 2],
      ['آنالیز', 'آموزش پست‌هاگ (PostHog)', 'دوره تخصصی ابزار مدیریت رویدادهای وبسایت.', 1],
      ['آنالیز', 'مایکروسافت کلریتی', 'دوره تخصصی گزارش‌گیری از رخدادهای سایت.', 1],
      ['ایجنتیک', 'آموزش کرسر (Cursor)', 'برنامه‌نویسی ایجنتیک با هوش مصنوعی با کرسر.', 3],
    ]);
  });

  it('ships every Course without its own url (all fall back to Support)', () => {
    expect(courses.map((c) => c.url)).toEqual(Array(8).fill(undefined));
  });
});

describe('tools collection', () => {
  const tools = collection('tools');

  it('opens with the HTML Editor, the one Free Tool, linking to /editor', () => {
    expect(tools[0]).toMatchObject({
      title: 'ویرایشگر HTML',
      locked: false,
      href: '/editor',
      note: 'فعال · ورود ←',
    });
    expect(tools.filter((t) => !t.locked)).toHaveLength(1);
  });

  it('follows with the seven Locked Tools in order, reserved for Masterclass Learners, with no link', () => {
    const locked = tools.slice(1);
    expect(locked.map((t) => t.title)).toEqual([
      'دیکشنری اصطلاحات',
      'مگاپرامپت‌ها',
      'کتاب‌های مرجع',
      'ویدئوها',
      'نمونه قراردادها',
      'نمونه کد وبسایت‌ها',
      'دانلود نرم‌افزارها',
    ]);
    for (const tool of locked) {
      expect(tool).toMatchObject({ locked: true, note: 'ویژه دانش‌پذیران مسترکلاس' });
      expect(tool.href).toBeUndefined();
    }
  });

  it('gives each Tool a distinct icon', () => {
    expect(new Set(tools.map((t) => t.icon)).size).toBe(8);
  });
});
