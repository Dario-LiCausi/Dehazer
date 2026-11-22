// Cue schedule. Pure functions, no clock of their own. A cue comes back on day 1, 3, 7, 14 and 30,
// then every 30 days. The save day is day 1. Days count from the local start of the day the cue was saved.
export const CUE_DAYS = [1, 3, 7, 14, 30];
export const CUE_REPEAT = 30; // days between cues after the last fixed day

const startOfDay = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
export function sameDay(a, b) { return startOfDay(a).getTime() === startOfDay(b).getTime(); }

// step = how many times the cue was shown so far. Returns the time (ms) the next show is due.
export function nextDue(created, step) {
  const last = CUE_DAYS[CUE_DAYS.length - 1];
  const day = step < CUE_DAYS.length ? CUE_DAYS[step] : last + CUE_REPEAT * (step - CUE_DAYS.length + 1);
  const s = startOfDay(created);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + day - 1).getTime();
}

const isCue = (i) => i.kind === 'cue' && i.state === 'active';

// One cue at most. A cue shown today stays all day. Else the active cue with the earliest due time that has come.
export function pickCue(items, now) {
  const cues = items.filter(isCue);
  const today = cues.filter((i) => i.shown && sameDay(i.shown, now)).sort((a, b) => a.pos - b.pos);
  if (today.length) return today[0];
  const due = cues.filter((i) => (i.due ?? 0) <= now).sort((a, b) => (a.due ?? 0) - (b.due ?? 0) || a.pos - b.pos);
  return due[0] ?? null;
}
