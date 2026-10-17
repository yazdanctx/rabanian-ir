import { PALETTE } from './palette';

/**
 * The academy's mark: a terminal prompt «>_» as one stroked path in a 48×48
 * box. Code reads left to right, so it is never mirrored for RTL.
 */
export const LOGO_MARK_PATH = 'M14 17l7 7-7 7M25.5 31H35';

/**
 * The mark on its tile: the white prompt on an `ink` square with an 11px
 * radius. Drawn inline by `Logo.astro` (top bar and footer), served as
 * `/favicon.svg` and drawn on the OG image.
 */
export const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="${PALETTE.ink}"/><path d="${LOGO_MARK_PATH}" fill="none" stroke="${PALETTE.white}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
