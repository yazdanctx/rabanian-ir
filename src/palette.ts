/**
 * Palette P (spec: .scratch/landing-page/spec.md) for code that cannot read
 * CSS variables, such as the OG image renderer. Markup uses the Tailwind
 * tokens in `src/styles/global.css` instead. Every `--color-<kebab-key>` there
 * has its entry here with the same hex; tests/theme.test.ts keeps them equal.
 */
export const PALETTE = {
  ink: '#050816',
  muted: '#536078',
  primary: '#1769FF',
  primaryText: '#0D5BE0',
  primarySoft: '#EAF1FF',
  surface: '#F5F7FA',
  line: '#DCE3EE',
  bg: '#FFFFFF',
  white: '#FFFFFF',
  /** Spec "on dark block": the eyebrow on the ink CTA. */
  primaryOnInk: '#56A6FF',
  /** HTML Editor: strings in the Code Pane. */
  codeString: '#1237C8',
  /** HTML Editor: the console strip's warnings and errors. */
  warn: '#B54708',
  error: '#B42318',
} as const;
