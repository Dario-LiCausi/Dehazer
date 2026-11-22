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
  // Without transact a failed second write could leave half a paste or two items at one place.
  if (typeof backend?.transact !== 'function') throw new Error('createStore: the backend needs a transact method');
  const now = opts.now ?? (() => Date.now());
  const newId = opts.newId ?? makeId;

  // Writes that pick a new pos run one after another, so fast saves keep their order.
  let chain = Promise.resolve();
  const serial = (fn) => { const run = chain.then(fn); chain = run.catch(() => {}); return run; };

  // One read-then-write step runs inside one transaction when the backend can do that.
  // Then two browser tabs cannot interleave and pick the same pos.
  const atomic = (fn) => backend.transact(fn);

  async function list() {
    const items = await backend.getAll();
    return items.sort((a, b) => a.pos - b.pos);
  }

  function add(text) { return serial(() => atomic((b) => addNow(b, text))); }
  const topPos = async (b) => (await b.getAll()).reduce((m, i) => Math.max(m, i.pos), 0);
  async function addNow(b, text, pos) {
    const clean = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!clean) return null; // Empty capture is ignored, never an error.
    const at = pos ?? (await topPos(b)) + 1;
    const t = now();
    const item = { id: newId(), text: clean, state: 'active', pos: at, created: t, updated: t };
    await b.put(item);
    return item;
  }

  function setState(id, state) { return serial(() => atomic((b) => setStateNow(b, id, state))); }
  async function setStateNow(b, id, state) {
    if (!STATES.includes(state)) throw new Error(`bad state: ${state}`);
    const item = await b.get(id);
    if (!item) return null;
    const next = { ...item, state, updated: now() };
    await b.put(next);
    return next;
  }

  // remove returns the old item so the UI can offer undo.
  function remove(id) { return serial(() => atomic((b) => removeNow(b, id))); }
  async function removeNow(b, id) {
    const item = await b.get(id);
    if (!item) return null;
    await b.delete(id);
    return item;
  }

  // restore puts a removed item back at its old place (same pos).
  function restore(item) { return serial(() => atomic((b) => restoreNow(b, item))); }
  async function restoreNow(b, item) {
    if (!item || (await b.get(item.id))) return null;
    // If a newer item took this place, go to the end instead of sharing it (no tie, no hidden re-sort).
    const all = await b.getAll();
    const pos = all.some((i) => i.pos === item.pos) ? all.reduce((m, i) => Math.max(m, i.pos), 0) + 1 : item.pos;
    const back = { ...item, pos, updated: now() };
    await b.put(back);
    return back;
  }

  // edit changes the text only. Place and state stay. Blank text changes nothing.
  function edit(id, text) { return serial(() => atomic((b) => editNow(b, id, text))); }
  async function editNow(b, id, text) {
    const clean = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!clean) return null;
    const item = await b.get(id);
    if (!item) return null;
    const next = { ...item, text: clean, updated: now() };
    await b.put(next);
    return next;
  }

  // move swaps pos with the nearest item of the same state. The user is the only one who reorders.
  function move(id, dir) { return serial(() => atomic((b) => moveNow(b, id, dir))); }
  async function moveNow(b, id, dir) {
    const all = (await b.getAll()).sort((x, y) => x.pos - y.pos);
    const me = all.find((i) => i.id === id);
    if (!me) return false;
    const same = all.filter((i) => i.state === me.state);
    const at = same.findIndex((i) => i.id === id);
    const other = same[dir === 'up' ? at - 1 : at + 1];
    if (!other) return false;
    const t = now();
    await b.put({ ...me, pos: other.pos, updated: t });
    await b.put({ ...other, pos: me.pos, updated: t });
    return true;
  }

  // addMany saves several texts in order (paste).
  // All lines of one paste go in one transaction: all saved or none.
  function addMany(texts) { return serial(() => atomic(async (b) => {
    const out = [];
    let pos = await topPos(b); // read once, then count up: one read for the whole paste
    for (const t of texts) { const it = await addNow(b, t, pos + 1); if (it) { pos++; out.push(it); } }
    return out;
  })); }

  // importItems adds parsed lines ({id, text, state}) at the end, in file order.
  // An id that already exists is skipped, so importing the same file twice adds nothing.
  // The whole import is one transaction: all added or none, so a retry cannot duplicate.
  function importItems(parsed) { return serial(() => atomic((b) => importNow(b, parsed))); }
  async function importNow(b, parsed) {
    const all = await b.getAll();
    const have = new Set(all.map((i) => i.id));
    let pos = all.reduce((m, i) => Math.max(m, i.pos), 0);
    let added = 0; let skipped = 0;
    for (const p of parsed) {
      const text = String(p.text ?? '').trim().slice(0, MAX_TEXT);
      if (!text || !STATES.includes(p.state) || (p.id && have.has(p.id))) { skipped++; continue; }
      const t = now();
      const id = p.id || newId();
      have.add(id);
      await b.put({ id, text, state: p.state, pos: ++pos, created: t, updated: t });
      added++;
    }
    return { added, skipped };
  }

  return { list, add, addMany, edit, move, setState, remove, restore, importItems };
}

// Backend for tests and for browsers without IndexedDB (data is lost on reload).
export function createMemoryBackend() {
  let m = new Map();
  let lock = Promise.resolve();
  const copy = (src) => new Map([...src].map(([k, v]) => [k, { ...v }]));
  // A view is bound to one map. A transaction view is closed when the transaction ends,
  // like IndexedDB, so a callback that kept it cannot write later and skip the lock.
  const view = (map, state = { open: true }) => {
    const live = () => { if (!state.open) throw new Error('transaction finished'); return map; };
    return {
      async getAll() { return [...live().values()].map((i) => ({ ...i })); },
      async get(id) { const i = live().get(id); return i ? { ...i } : undefined; },
      async put(item) { live().set(item.id, { ...item }); },
      async delete(id) { live().delete(id); },
    };
  };
  return {
    // Plain reads and writes wait for a running transaction, like IndexedDB does.
    async getAll() { await lock; return view(m).getAll(); },
    async get(id) { await lock; return view(m).get(id); },
    async put(item) { await lock; return view(m).put(item); },
    async delete(id) { await lock; return view(m).delete(id); },
    // Same job as an IndexedDB read-write transaction: one at a time, on a private copy,
    // published only if fn finishes. If fn throws, nothing is kept.
    transact(fn) {
      const run = lock.then(async () => {
        const work = copy(m);
        const state = { open: true };
        try {
          const out = await fn(view(work, state));
          m = work;
          return out;
        } finally { state.open = false; }
      });
      lock = run.catch(() => {});
      return run;
    },
  };
}
