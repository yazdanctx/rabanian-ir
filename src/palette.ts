/**
 * Palette Iris (spec: .scratch/landing-page/spec.md) for code that cannot read
 * CSS variables, such as the OG image renderer. Markup uses the Tailwind
 * tokens in `src/styles/global.css` instead. Every `--color-<kebab-key>` there
 * has its entry here with the same hex; tests/theme.test.ts keeps them equal.
 */
export const PALETTE = {
  ink: '#0F172A',
  muted: '#475569',
  primary: '#7C3AED',
  primaryText: '#6D28D9',
  primarySoft: '#EDE9FE',
  /** Text and icons on a `primary` fill, and that fill under the pointer. */
  onPrimary: '#FFFFFF',
  primaryHover: '#6D28D9',
  surface: '#F1F5F9',
  line: '#E2E8F0',
  bg: '#FFFFFF',
  white: '#FFFFFF',
  /** Spec "on dark block": the eyebrow on the ink CTA. */
  primaryOnInk: '#A78BFA',
  /**
   * HTML Editor: the Code Pane's syntax colours, a GitHub-light style
   * palette (comments and brackets are `muted`; plain names stay `ink`).
   */
  codeKeyword: '#CF222E',
  codeTag: '#116329',
  codeAttribute: '#0550AE',
  codeString: '#0A3069',
  codeConstant: '#0550AE',
  codeFunction: '#6F42C1',
  codeDefinition: '#953800',
  /** HTML Editor: the console strip's warnings and errors. */
  warn: '#B54708',
  error: '#B42318',
} as const;
