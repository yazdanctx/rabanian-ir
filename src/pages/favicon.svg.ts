import type { APIRoute } from 'astro';
import { LOGO_MARK_SVG } from '../logo-mark';

/** `/favicon.svg`: the logo mark, prerendered into `dist/favicon.svg` at build. */
export const GET: APIRoute = () =>
  new Response(LOGO_MARK_SVG, { headers: { 'Content-Type': 'image/svg+xml' } });
