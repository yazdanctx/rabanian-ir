/*
 * Landing-page motion (spec: Motion; ADR-0003): vanilla `motion`, driven by
 * data attributes that the Astro components put in their markup.
 *
 * - `data-reveal`: fades in and rises 8px → 0 (400ms, ease-out), once.
 *   Optional `data-delay` adds that many milliseconds before it starts.
 * - `data-stagger`: a group. Its `data-reveal` descendants (those whose
 *   nearest group it is) reveal together, 60ms apart in document order,
 *   when the group comes ~10% into view; `data-stagger="load"` reveals them
 *   on page load instead (the Hero).
 * - A `data-reveal` outside any group reveals itself when ~10% in view.
 *
 * The hidden starting state lives in CSS under `html.motion`, a class the
 * inline script in `Motion.astro` adds only when reduced motion is off. So
 * with no JS, or with `prefers-reduced-motion: reduce`, nothing is hidden and
 * nothing moves. Once revealed, an element gets `data-revealed` and its
 * inline styles are cleared, so CSS (e.g. the hover lift) owns it again.
 */
import { animate, inView, stagger } from 'motion';

const STEP = 0.06;
const IN_VIEW = { amount: 0.1 } as const;

function reveal(items: Element[]) {
  const delay = stagger(STEP);
  items.forEach((el, i) => {
    const extra = Number((el as HTMLElement).dataset.delay ?? 0) / 1000;
    animate(
      el,
      { opacity: [0, 1], transform: ['translateY(8px)', 'none'] },
      { duration: 0.4, ease: 'easeOut', delay: delay(i, items.length) + extra },
    ).finished.then(() => {
      el.setAttribute('data-revealed', '');
      (el as HTMLElement).style.removeProperty('opacity');
      (el as HTMLElement).style.removeProperty('transform');
    });
  });
}

/** Starts the reveals if `Motion.astro`'s inline script turned motion on. */
export function startMotion(doc: Document = document) {
  const root = doc.documentElement;
  if (!root.classList.contains('motion')) return;
  root.dataset.motionReady = '';

  const groupOf = (el: Element) => el.parentElement?.closest('[data-stagger]') ?? null;
  const members = new Map<Element, Element[]>();
  const loners: Element[] = [];
  for (const el of doc.querySelectorAll('[data-reveal]')) {
    const group = groupOf(el);
    if (group) members.set(group, [...(members.get(group) ?? []), el]);
    else loners.push(el);
  }

  for (const [group, items] of members) {
    if (group.getAttribute('data-stagger') === 'load') reveal(items);
    else inView(group, () => reveal(items), IN_VIEW);
  }
  inView(loners, (el) => reveal([el]), IN_VIEW);
}
