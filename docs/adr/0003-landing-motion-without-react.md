# Landing-page motion uses vanilla `motion`, not React islands

The landing page animates with `motion`'s framework-free API (`animate`, `inView`, `stagger` from `motion`) in a small bundled Astro `<script>`, not with React islands and `motion/react`. Measured on 2026-10-16: a React 19 + `motion/react` island ships about 97.5 KB gzipped (React's runtime alone is about 69 KB), which breaks the landing page's ~45 KB JS budget; the same effects in a plain script ship about 26 KB. The landing page has no interactive state, so React bought nothing but weight. We rejected `motion/mini` (~4 KB) because staggering and `inView` orchestration would have to be hand-rolled, and Preact because it added a compat layer for no gain.

## Consequences

- No `.tsx` and no `client:*` directive on the landing page. Astro components own all markup; motion is attached by `data-*` attributes (e.g. `data-reveal`, `data-stagger`) read by one script.
- Content must be visible without JS: the script hides elements only after it has run and only when `prefers-reduced-motion` is not `reduce`, so no-JS and reduced-motion visitors see the final state.
- The per-element fade uses `animate` from `motion/mini`, not from `motion`: mini drives browser-native WAAPI, so it doesn't re-apply final styles as inline styles after cleanup, and the CSS hover lift on revealed cards and links keeps working. `inView` and `stagger` still come from `motion`. The shipped landing JS is about 4 KB gzipped.
- `@astrojs/react` stays installed for the HTML Editor island (`client:only="react"`), which never loads on the landing page.
