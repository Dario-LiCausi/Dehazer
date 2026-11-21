// Item store. All data logic lives here. The backend only saves and loads.
// Item { id, text, state: "active" | "later" | "done", pos, created, updated }
// Order = pos, set once when the item is added. Only the user changes it. Never re-sort.

export const STATES = ['active', 'later', 'done'];
export const MAX_TEXT = 2000;

export function createStore(backend, opts = {}) {
  const now = opts.now ?? (() => Date.now());
  const newId = opts.newId ?? (() => globalThis.crypto.randomUUID());

  async function list() {
    const items = await backend.getAll();
    return items.sort((a, b) => a.pos - b.pos);
  }

  async function add(text) {
    const clean = String(text ?? '').trim().slice(0, MAX_TEXT);
    if (!clean) return null; // Empty capture is ignored, never an error.
    const items = await backend.getAll();
    const pos = items.reduce((m, i) => Math.max(m, i.pos), 0) + 1;
    const t = now();
    const item = { id: newId(), text: clean, state: 'active', pos, created: t, updated: t };
    await backend.put(item);
    return item;
  }

  async function setState(id, state) {
    if (!STATES.includes(state)) throw new Error(`bad state: ${state}`);
    const item = await backend.get(id);
    if (!item) return null;
    const next = { ...item, state, updated: now() };
    await backend.put(next);
    return next;
  }

  // remove returns the old item so the UI can offer undo.
  async function remove(id) {
    const item = await backend.get(id);
    if (!item) return null;
    await backend.delete(id);
    return item;
  }

  // restore puts a removed item back at its old place (same pos).
  async function restore(item) {
    if (!item || (await backend.get(item.id))) return null;
    await backend.put({ ...item, updated: now() });
    return item;
  }

  return { list, add, setState, remove, restore };
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
