// Item store. All data logic lives here. The backend only saves and loads.
// Item { id, text, state: "active" | "later" | "done", pos, created, updated }
// Order = pos, set once when the item is added. Only the user changes it. Never re-sort.

export const STATES = ['active', 'later', 'done'];
export const MAX_TEXT = 2000;
export const NEXT_COUNT = 5;

// Next 5: the first five active items in the order they were added. Pure: no re-sorting, no scoring.
export function nextFive(items) {
  return items.filter((i) => i.state === 'active').slice(0, NEXT_COUNT);
}

// randomUUID exists only on secure pages (https or localhost). getRandomValues works everywhere.
export function makeId() {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function createStore(backend, opts = {}) {
  const now = opts.now ?? (() => Date.now());
  const newId = opts.newId ?? makeId;

  // Writes that pick a new pos run one after another, so fast saves keep their order.
  let chain = Promise.resolve();
  const serial = (fn) => { const run = chain.then(fn); chain = run.catch(() => {}); return run; };

  async function list() {
    const items = await backend.getAll();
    return items.sort((a, b) => a.pos - b.pos);
  }

  function add(text) { return serial(() => addNow(text)); }
  async function addNow(text) {
    const clean = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!clean) return null; // Empty capture is ignored, never an error.
    const items = await backend.getAll();
    const pos = items.reduce((m, i) => Math.max(m, i.pos), 0) + 1;
    const t = now();
    const item = { id: newId(), text: clean, state: 'active', pos, created: t, updated: t };
    await backend.put(item);
    return item;
  }

  function setState(id, state) { return serial(() => setStateNow(id, state)); }
  async function setStateNow(id, state) {
    if (!STATES.includes(state)) throw new Error(`bad state: ${state}`);
    const item = await backend.get(id);
    if (!item) return null;
    const next = { ...item, state, updated: now() };
    await backend.put(next);
    return next;
  }

  // remove returns the old item so the UI can offer undo.
  function remove(id) { return serial(() => removeNow(id)); }
  async function removeNow(id) {
    const item = await backend.get(id);
    if (!item) return null;
    await backend.delete(id);
    return item;
  }

  // restore puts a removed item back at its old place (same pos).
  function restore(item) { return serial(() => restoreNow(item)); }
  async function restoreNow(item) {
    if (!item || (await backend.get(item.id))) return null;
    // If a newer item took this place, go to the end instead of sharing it (no tie, no hidden re-sort).
    const all = await backend.getAll();
    const pos = all.some((i) => i.pos === item.pos) ? all.reduce((m, i) => Math.max(m, i.pos), 0) + 1 : item.pos;
    const back = { ...item, pos, updated: now() };
    await backend.put(back);
    return back;
  }

  // edit changes the text only. Place and state stay. Blank text changes nothing.
  function edit(id, text) { return serial(() => editNow(id, text)); }
  async function editNow(id, text) {
    const clean = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!clean) return null;
    const item = await backend.get(id);
    if (!item) return null;
    const next = { ...item, text: clean, updated: now() };
    await backend.put(next);
    return next;
  }

  // move swaps pos with the nearest item of the same state. The user is the only one who reorders.
  function move(id, dir) { return serial(() => moveNow(id, dir)); }
  async function moveNow(id, dir) {
    const all = await list();
    const me = all.find((i) => i.id === id);
    if (!me) return false;
    const same = all.filter((i) => i.state === me.state);
    const at = same.findIndex((i) => i.id === id);
    const other = same[dir === 'up' ? at - 1 : at + 1];
    if (!other) return false;
    const t = now();
    await backend.put({ ...me, pos: other.pos, updated: t });
    await backend.put({ ...other, pos: me.pos, updated: t });
    return true;
  }

  // addMany saves several texts in order (paste).
  function addMany(texts) { return serial(async () => {
    const out = [];
    for (const t of texts) { const it = await addNow(t); if (it) out.push(it); }
    return out;
  }); }

  // importItems adds parsed lines ({id, text, state}) at the end, in file order.
  // An id that already exists is skipped, so importing the same file twice adds nothing.
  function importItems(parsed) { return serial(() => importNow(parsed)); }
  async function importNow(parsed) {
    const have = new Set((await backend.getAll()).map((i) => i.id));
    let pos = (await backend.getAll()).reduce((m, i) => Math.max(m, i.pos), 0);
    let added = 0; let skipped = 0;
    for (const p of parsed) {
      const text = String(p.text ?? '').trim().slice(0, MAX_TEXT);
      if (!text || !STATES.includes(p.state) || (p.id && have.has(p.id))) { skipped++; continue; }
      const t = now();
      const id = p.id || newId();
      have.add(id);
      await backend.put({ id, text, state: p.state, pos: ++pos, created: t, updated: t });
      added++;
    }
    return { added, skipped };
  }

  return { list, add, addMany, edit, move, setState, remove, restore, importItems };
}

// Backend for tests and for browsers without IndexedDB (data is lost on reload).
export function createMemoryBackend() {
  const m = new Map();
  return {
    async getAll() { return [...m.values()].map((i) => ({ ...i })); },
    async get(id) { const i = m.get(id); return i ? { ...i } : undefined; },
    async put(item) { m.set(item.id, { ...item }); },
    async delete(id) { m.delete(id); },
  };
}
