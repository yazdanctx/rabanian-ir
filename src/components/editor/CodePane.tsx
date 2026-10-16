interface Props {
  value: string;
  onChange: (value: string) => void;
  /** DOM id of the element naming the pane (the active tab). */
  labelledBy: string;
}

/**
 * The Code Pane: where one of the three files is typed. Code is LTR
 * everywhere. A plain textarea until CodeMirror replaces it (ticket 02).
 */
export default function CodePane({ value, onChange, labelledBy }: Props) {
  return (
    <textarea
      dir="ltr"
      aria-labelledby={labelledBy}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      className="editor-code"
    />
  );
}
