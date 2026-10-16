import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { SITE } from './site';

/**
 * The site's Open Graph image: name + tagline on palette P, rendered at build
 * time by `src/pages/og.png.ts` (satori → SVG → sharp → PNG). Nothing is
 * committed; edit the layout below and rebuild.
 */
export const OG_IMAGE = {
  path: '/og.png',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: `${SITE.name} — ${SITE.tagline}`,
} as const;

const fontDir = join(process.cwd(), 'src/assets/fonts/fa');
const font = async (file: string, weight: 400 | 700) => ({
  name: 'Yekan',
  data: await readFile(join(fontDir, file)),
  weight,
  style: 'normal' as const,
});

/** Satori element; plain objects keep this free of JSX. */
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type,
  props: { style, children },
});

const STAR =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#1769FF"/><path transform="translate(4 5.1)" d="M12 2.5l2 6.4 6.4 2-6.4 2-2 6.4-2-6.4-6.4-2 6.4-2z" fill="#FFFFFF"/></svg>',
  );

/*
 * Satori RTL caveat: padding on an ancestor of right-aligned Persian text
 * shifts it off the canvas, and `direction: rtl` breaks it too. So the frame
 * has no padding and each text line carries its own `paddingRight`.
 */
const INSET = 88;

/**
 * Satori lays every line out left-to-right, so trailing punctuation (the
 * tagline's «!») would jump to the right edge. A closing RLM (U+200F) keeps
 * it inside the right-to-left run, at the visual end.
 */
const rtl = (text: string) => `${text}‏`;

/** Render the OG image as PNG bytes. */
export async function renderOgImage(): Promise<Buffer> {
  const { width, height } = OG_IMAGE;
  const tree = h(
    'div',
    {
      width,
      height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      background: '#FFFFFF',
      color: '#050816',
      fontFamily: 'Yekan',
    },
    h(
      'div',
      { display: 'flex', justifyContent: 'flex-end', paddingTop: INSET, paddingRight: INSET },
      { type: 'img', props: { src: STAR, width: 96, height: 96 } },
    ),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1, justifyContent: 'center' },
      h('div', { fontSize: 104, fontWeight: 700, textAlign: 'right', paddingRight: INSET, lineHeight: 1.3 }, SITE.name),
      h(
        'div',
        { fontSize: 50, fontWeight: 400, textAlign: 'right', paddingRight: INSET, color: '#0D5BE0', lineHeight: 1.5 },
        rtl(SITE.tagline),
      ),
    ),
    h(
      'div',
      { fontSize: 30, fontWeight: 400, color: '#536078', paddingLeft: INSET, paddingBottom: 64 },
      SITE.domain,
    ),
  );
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width,
    height,
    fonts: [
      await font('IRANYekanXFaNum-Bold.woff2', 700),
      await font('IRANYekanXFaNum-Regular.woff2', 400),
    ],
  });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
