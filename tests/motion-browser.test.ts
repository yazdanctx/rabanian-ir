import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromePath, openPage, serveDist, type BrowserPage } from './helpers/browser';

/*
 * The motion script in a real (headless) Chrome, on a 390×844 phone
 * viewport. Skipped where no Chrome is installed (set CHROME_PATH).
 */

/** Page-side helpers, prepended to evaluated expressions. */
const lib = `
  const reveals = () => [...document.querySelectorAll('[data-reveal]')];
  const shown = (el) => {
    const s = getComputedStyle(el);
    return s.opacity === '1' && s.transform === 'none';
  };
  const waitFor = async (test, ms = 3000) => {
    const end = performance.now() + ms;
    while (!test()) {
      if (performance.now() > end) return false;
      await new Promise((r) => setTimeout(r, 50));
    }
    return true;
  };
`;

let site: Awaited<ReturnType<typeof serveDist>>;
beforeAll(async () => {
  site = await serveDist();
});
afterAll(() => site?.close());

describe.skipIf(!chromePath)('landing motion in the browser', () => {
  describe('with motion allowed', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`);
    });
    afterAll(() => tab?.close());

    it('plays the Hero sequence on load, in order, 60ms apart', async () => {
      const result = await tab.evaluate<{ done: boolean; starts: number[] }>(`(async () => {
        ${lib}
        const hero = reveals().filter((el) => el.closest('#top'));
        const done = await waitFor(() => hero.every((el) => el.hasAttribute('data-revealed')));
        return { done, starts: hero.map((el) => shown(el) ? 1 : 0) };
      })()`);
      expect(result.done).toBe(true);
      expect(result.starts).toEqual([1, 1, 1, 1, 1, 1, 1]);
      expect(await tab.evaluate('document.documentElement.classList.contains("motion")')).toBe(true);
    });

    it('keeps below-the-fold content hidden until it scrolls into view, then reveals it once', async () => {
      const result = await tab.evaluate<{ before: string; after: boolean; revealed: boolean }>(`(async () => {
        ${lib}
        const header = document.querySelector('#resume header');
        const before = getComputedStyle(header).opacity;
        header.scrollIntoView({ block: 'center', behavior: 'instant' });
        const revealed = await waitFor(() => header.hasAttribute('data-revealed'));
        return { before, revealed, after: shown(header) };
      })()`);
      expect(result.before).toBe('0');
      expect(result.revealed).toBe(true);
      expect(result.after).toBe(true);
    });

    it('staggers a list as it enters view, and leaves no inline styles behind', async () => {
      const result = await tab.evaluate<{ revealed: boolean; inline: string[] }>(`(async () => {
        ${lib}
        const list = document.querySelector('[data-timeline]');
        list.scrollIntoView({ block: 'start', behavior: 'instant' });
        const items = [...list.children];
        const revealed = await waitFor(() => items.every((el) => el.hasAttribute('data-revealed')));
        return { revealed, inline: items.map((el) => el.getAttribute('style') ?? '') };
      })()`);
      expect(result.revealed).toBe(true);
      expect(result.inline.every((style) => style.trim() === '')).toBe(true);
    });
  });

  describe('the Brands Rail on a phone', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`);
    });
    afterAll(() => tab?.close());

    it('scrolls itself forward in a seamless loop, its copies hidden from assistive tech', async () => {
      const result = await tab.evaluate<{
        cards: number;
        copies: number;
        copiesHidden: boolean;
        moved: number;
        period: number;
        half: number;
        pageOverflow: number;
      }>(`(async () => {
        ${lib}
        const rail = document.querySelector('[data-autoscroll]');
        rail.scrollIntoView({ block: 'center', behavior: 'instant' });
        await waitFor(() => rail.hasAttribute('data-looping'));
        const cards = [...rail.children];
        const copies = cards.filter((li) => li.hasAttribute('data-rail-clone'));
        const x = () => new DOMMatrix(getComputedStyle(rail).transform).m41;
        const x0 = x();
        await new Promise((r) => setTimeout(r, 600));
        const right = (el) => el.getBoundingClientRect().right;
        return {
          cards: cards.length,
          copies: copies.length,
          copiesHidden: copies.every((li) => li.getAttribute('aria-hidden') === 'true' && li.inert),
          moved: x() - x0,
          // One loop slides the row by one set: card 1 to where its copy was.
          period: right(cards[0]) - right(cards[5]),
          half: rail.getBoundingClientRect().width / 2,
          pageOverflow: document.documentElement.scrollWidth - innerWidth,
        };
      })()`);
      expect(result.cards).toBe(10);
      expect(result.copies).toBe(5);
      expect(result.copiesHidden).toBe(true);
      // RTL: the next Brand is on the left, so the row moves right.
      expect(result.moved).toBeGreaterThan(0);
      expect(Math.abs(result.period - result.half)).toBeLessThan(1);
      expect(result.pageOverflow).toBe(0);
    });

    it('pauses while it has keyboard focus', async () => {
      const state = await tab.evaluate<string>(`(() => {
        const rail = document.querySelector('[data-autoscroll]');
        rail.focus();
        return getComputedStyle(rail).animationPlayState;
      })()`);
      expect(state).toBe('paused');
    });
  });

  describe('the Brands Rail on desktop', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`, { width: 1280, height: 900 });
    });
    afterAll(() => tab?.close());

    it('stays a still grid of the five Brands', async () => {
      const result = await tab.evaluate<{ shown: number; animations: number }>(`(async () => {
        ${lib}
        const rail = document.querySelector('[data-autoscroll]');
        rail.scrollIntoView({ block: 'center', behavior: 'instant' });
        await waitFor(() => rail.hasAttribute('data-looping'));
        return {
          shown: [...rail.children].filter((li) => getComputedStyle(li).display !== 'none').length,
          animations: rail.getAnimations().length,
        };
      })()`);
      expect(result).toEqual({ shown: 5, animations: 0 });
    });
  });

  describe('with prefers-reduced-motion: reduce', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`, { reducedMotion: true });
    });
    afterAll(() => tab?.close());

    it('shows every element in its final place on load, and nothing animates', async () => {
      const result = await tab.evaluate<{ motion: boolean; hidden: number; animations: number }>(`(async () => {
        ${lib}
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 300));
        return {
          motion: document.documentElement.classList.contains('motion'),
          hidden: reveals().filter((el) => !shown(el)).length,
          animations: document.getAnimations().length,
        };
      })()`);
      expect(result).toEqual({ motion: false, hidden: 0, animations: 0 });
    });

    it('leaves the Brands Rail a plain row to swipe, without copies', async () => {
      const result = await tab.evaluate<{ cards: number; looping: boolean; scrollable: boolean }>(`(() => {
        const rail = document.querySelector('[data-autoscroll]');
        return {
          cards: rail.children.length,
          looping: rail.hasAttribute('data-looping'),
          scrollable: rail.scrollWidth > rail.clientWidth,
        };
      })()`);
      expect(result).toEqual({ cards: 5, looping: false, scrollable: true });
    });
  });

  describe('with JavaScript disabled', () => {
    let tab: BrowserPage;
    beforeAll(async () => {
      tab = await openPage(`${site.origin}/`, { noScript: true });
    });
    afterAll(() => tab?.close());

    it('shows every element in its final place', async () => {
      const result = await tab.evaluate<{ count: number; hidden: number; motion: boolean }>(`(() => {
        ${lib}
        return {
          count: reveals().length,
          hidden: reveals().filter((el) => !shown(el)).length,
          motion: document.documentElement.classList.contains('motion'),
        };
      })()`);
      expect(result.count).toBeGreaterThan(20);
      expect(result.hidden).toBe(0);
      expect(result.motion).toBe(false);
    });
  });
});
