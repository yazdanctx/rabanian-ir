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
 * - `data-autoscroll` (the About photo strip, Gallery.astro): gets a hidden
 *   copy of its items and `data-looping`, and the component's CSS loops it.
 *
 * The hidden starting state lives in CSS under `html.motion`, a class the
 * inline script in `Motion.astro` adds only when reduced motion is off. So
 * with no JS, or with `prefers-reduced-motion: reduce`, nothing is hidden and
 * nothing moves. Once revealed, an element gets `data-revealed` and its
 * inline styles are cleared, so CSS (e.g. the hover lift) owns it again.
 */
import { inView, stagger } from 'motion';
// The WAAPI `animate`: it commits the final keyframe inline synchronously on
// finish, so `finished` is the moment to hand the element back to CSS.
import { animate } from 'motion/mini';

const STEP = 0.06;
const IN_VIEW = { amount: 0.1 } as const;

const extraDelay = (el: HTMLElement) => Number(el.dataset.delay ?? 0) / 1000;

/** Fades and lifts `items` in, 60ms apart in the given order. */
function reveal(items: HTMLElement[]) {
  const step = stagger(STEP);
  animate(
    items,
    { opacity: [0, 1], transform: ['translateY(8px)', 'none'] },
    { duration: 0.4, ease: 'easeOut', delay: (i, n) => step(i, n) + extraDelay(items[i]) },
  ).finished.then(() => {
    for (const el of items) {
      el.setAttribute('data-revealed', '');
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    }
  });
}

/**
 * Closes the loop of each auto-scrolling row: appends an inert, aria-hidden
 * copy of every item (already in its final state, so not a reveal), then sets
 * `data-looping` and `--loop-count` for the row's CSS animation.
 */
function loopRows(doc: Document) {
  for (const row of doc.querySelectorAll<HTMLElement>('[data-autoscroll]')) {
    const items = [...row.children];
    for (const item of items) {
      const copy = item.cloneNode(true) as HTMLElement;
      copy.removeAttribute('data-reveal');
      copy.setAttribute('data-loop-copy', '');
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      row.append(copy);
    }
    row.style.setProperty('--loop-count', String(items.length));
    row.setAttribute('data-looping', '');
  }
}

/** Starts the reveals if `Motion.astro`'s inline script turned motion on. */
export function startMotion(doc: Document = document) {
  const root = doc.documentElement;
  if (!root.classList.contains('motion')) return;
  root.dataset.motionReady = '';

  const groupOf = (el: Element) => el.parentElement?.closest('[data-stagger]') ?? null;
  const members = new Map<Element, HTMLElement[]>();
  const loners: HTMLElement[] = [];
  for (const el of doc.querySelectorAll<HTMLElement>('[data-reveal]')) {
    const group = groupOf(el);
    if (group) members.set(group, [...(members.get(group) ?? []), el]);
    else loners.push(el);
  }

  for (const [group, items] of members) {
    if (group.getAttribute('data-stagger') === 'load') reveal(items);
    else inView(group, () => reveal(items), IN_VIEW);
  }
  inView(loners, (el) => reveal([el as HTMLElement]), IN_VIEW);
  // After the reveals are collected, so the copies are not among them.
  loopRows(doc);
}
