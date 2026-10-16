import type { APIRoute } from 'astro';
import { OG_IMAGE, renderOgImage } from '../og';

/** `/og.png`, prerendered into `dist/og.png` at build. */
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderOgImage()), {
    headers: { 'Content-Type': OG_IMAGE.type },
  });
