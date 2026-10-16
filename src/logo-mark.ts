import { PALETTE } from './palette';

/**
 * The logo's star as an SVG path in a 24×24 box; it sits slightly high, as in
 * the design. Drawn by `Icon name="star"` and by `LOGO_MARK_SVG`.
 */
export const STAR_PATH = 'M12 2.5l2 6.4 6.4 2-6.4 2-2 6.4-2-6.4-6.4-2 6.4-2z';

/**
 * The logo mark on its own: the white star on a 32px `primary` tile with a
 * 9px radius. Served as `/favicon.svg` and drawn on the OG image.
 */
export const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${PALETTE.primary}"/><path transform="translate(4 5.1)" d="${STAR_PATH}" fill="${PALETTE.white}"/></svg>`;
