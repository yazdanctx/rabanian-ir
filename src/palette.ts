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
  /** Text and icons on a `primary` fill, and that fill under the pointer. */
  onPrimary: '#FFFFFF',
  primaryHover: '#0D5BE0',
  surface: '#F5F7FA',
  line: '#DCE3EE',
  bg: '#FFFFFF',
  white: '#FFFFFF',
  /** Spec "on dark block": the eyebrow on the ink CTA. */
  primaryOnInk: '#56A6FF',
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
