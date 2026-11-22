// Tools shelf. Every tool is off until the user turns it on. The list lives on this device only.
export const TOOLS = [
  { id: 'show', name: 'Show this', blurb: 'Type a message and show it in very large letters to another person.' },
];
export const MAX_SHOW = 500;
const KEY = 'dehazer.tools';

export function loadTools(storage) {
  let raw = [];
  try { raw = JSON.parse(storage.getItem(KEY) || '[]'); } catch { raw = []; }
  if (!Array.isArray(raw)) return [];
  return TOOLS.map((t) => t.id).filter((id) => raw.includes(id)); // registry order, no repeats, no unknown ids
}
export function saveTools(storage, ids) {
  try { storage.setItem(KEY, JSON.stringify(ids)); } catch { /* blocked storage: choice lasts until reload */ }
}
// The typed message is never stored. This only cleans it.
export function cleanMessage(s) { return typeof s === 'string' ? s.trim().slice(0, MAX_SHOW) : ''; }
