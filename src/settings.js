// Settings live on this device only. Every value is checked on load. Defaults are calm.
export const DEFAULTS = { theme: 'system', size: 'normal', font: 'easy', backupNote: false, look: 'warm' };
const ALLOWED = { theme: ['system', 'light', 'dark'], size: ['normal', 'large', 'larger'], font: ['system', 'easy'], look: ['warm', 'v06', 'plain'] };
const KEY = 'dehazer.settings';

export function loadSettings(storage) {
  let raw = {};
  try { raw = JSON.parse(storage.getItem(KEY) || '{}') || {}; } catch { raw = {}; }
  const out = { ...DEFAULTS };
  for (const k of Object.keys(ALLOWED)) if (ALLOWED[k].includes(raw[k])) out[k] = raw[k];
  if (typeof raw.backupNote === 'boolean') out.backupNote = raw.backupNote;
  return out;
}
export function saveSettings(storage, s) {
  try { storage.setItem(KEY, JSON.stringify(s)); } catch { /* blocked storage: setting lasts until reload */ }
}

// Puts settings on <html> as data attributes. CSS reads them. "system" follows the device.
export function applySettings(win, s) {
  const root = win.document.documentElement;
  const dark = s.theme === 'dark' || (s.theme === 'system' && win.matchMedia?.('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.size = s.size;
  root.dataset.font = s.font;
  root.dataset.look = s.look;
}
