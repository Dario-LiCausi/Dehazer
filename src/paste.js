// Split pasted text into one item per line. Local only. Strips list marks.
export const MAX_PASTE = 100;
const MARK = /^(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d{1,3}[.)]\s+)/;

export function splitLines(text) {
  return String(text ?? '').split(/\r?\n/)
    .map((l) => l.trim().replace(MARK, '').trim())
    .filter(Boolean)
    .slice(0, MAX_PASTE);
}
