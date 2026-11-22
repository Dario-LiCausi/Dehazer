// "What changed" note. Shown once after an update. A new user is never greeted by it.
export const VERSION = '0.3.0';
const KEY = 'dehazer.seenVersion';

export function whatsNewDue(storage) {
  try {
    const seen = storage.getItem(KEY);
    if (!seen) { storage.setItem(KEY, VERSION); return false; }
    return seen !== VERSION;
  } catch { return false; }
}
export function markSeen(storage) {
  try { storage.setItem(KEY, VERSION); } catch { /* shows again next time */ }
}
