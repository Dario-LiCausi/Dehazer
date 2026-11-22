// Tools shelf. Every tool is off until the user turns it on. The list lives on this device only.
export const TOOLS = [
  { id: 'show', name: 'Show this', blurb: 'Type a message and show it in very large letters to another person.' },
  { id: 'call', name: 'Call panel', blurb: 'Fill in a few boxes before a phone call. Get a short script to read, and a list to check before you hang up.' },
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

// Call panel. Nothing here is stored: the boxes live on the page and are cleared when the panel closes.
export const MAX_FIELD = 200;
export const CALL_FIELDS = [
  { id: 'who', label: 'Who I am calling' },
  { id: 'why', label: 'Why I am calling' },
  { id: 'name', label: 'My name' },
  { id: 'phone', label: 'My phone number, for a call back' },
  { id: 'when', label: 'Best time for a call back' },
];
const field = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, MAX_FIELD) : '');
export function buildScript(f = {}) {
  const v = Object.fromEntries(CALL_FIELDS.map((x) => [x.id, field(f[x.id])]));
  const out = ['Hello.'];
  if (v.name) out.push(`My name is ${v.name}.`);
  if (v.who) out.push(`I am calling ${v.who}.`);
  if (v.why) out.push(`The reason: ${v.why}.`);
  if (f.slow === true) out.push('Please go slowly. I may need a moment to answer.');
  if (v.phone) out.push(`My number is ${v.phone}.`);
  if (v.when) out.push(`The best time to call me back is ${v.when}.`);
  if (f.writing === true) out.push('Please also send this to me in writing.');
  return out.join('\n');
}
export const beforeHangUp = (writing) => ['Say the next step back to them.', ...(writing === true ? ['Ask for it in writing, by text or email.'] : []), 'Ask for the name of the person you spoke to.'];
