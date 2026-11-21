// A gentle weekly note to export. Never a warning. Shown only when there is something to save.
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const KEY = 'dehazer.lastExport';

export function backupDue(lastExport, now, itemCount) {
  if (!itemCount) return false;
  if (!lastExport) return true;
  return now - lastExport >= WEEK_MS;
}
export function readLastExport(storage) {
  try { const v = Number(storage.getItem(KEY)); return Number.isFinite(v) && v > 0 ? v : 0; } catch { return 0; }
}
export function writeLastExport(storage, t) {
  try { storage.setItem(KEY, String(t)); } catch { /* storage may be blocked: the note just shows again */ }
}
