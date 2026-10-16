/**
 * The HTML Editor's three files, in tab order. Labels stay Latin: they are the
 * languages' names, not copy.
 */
export const FILES = [
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'js', label: 'JS' },
] as const;

export type FileId = (typeof FILES)[number]['id'];

/** The text of each file. */
export type Files = Record<FileId, string>;
