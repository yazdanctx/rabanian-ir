/**
 * Whether the visitor asks for reduced motion, read at the moment of moving:
 * then the HTML Editor's motion (the tab crossfade, the console spring) is
 * skipped and things change at once (spec: Motion).
 */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
