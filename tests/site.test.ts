import { describe, expect, it } from 'vitest';
import { courseLink } from '../src/site';
import { collection } from './helpers/content';

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
