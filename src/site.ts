/**
 * Site-wide singletons: links and one-off copy. List-shaped content lives in
 * the content collections (`src/content/*.json`). Components import from here
 * and never hard-code copy, prices or links. Digits are ASCII (ADR-0002).
 */

/** Support (پشتیبانی): the Telegram account for questions and enrollment. */
export const SUPPORT_URL = 'https://t.me/codaminsupport';

/** Where a Course's «ثبت‌نام» / «جزئیات ←» goes: its own `url`, else Support. */
export function courseLink(course: { url?: string }): string {
  return course.url ?? SUPPORT_URL;
}
