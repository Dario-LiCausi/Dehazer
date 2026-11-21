// IndexedDB backend. Same four methods as the memory backend.
const DB = 'dehazer';
const STORE = 'items';

function open(factory) {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function createIdbBackend(factory = globalThis.indexedDB) {
  let dbp;
  const db = () => (dbp ??= open(factory));
  const store = async (mode) => (await db()).transaction(STORE, mode).objectStore(STORE);
  return {
    async getAll() { return wrap((await store('readonly')).getAll()); },
    async get(id) { return wrap((await store('readonly')).get(id)); },
    async put(item) { await wrap((await store('readwrite')).put(item)); },
    async delete(id) { await wrap((await store('readwrite')).delete(id)); },
  };
}

// Ask the browser to keep the data. Some browsers say no. That is fine.
export async function askPersist() {
  try { return await globalThis.navigator?.storage?.persist?.(); } catch { return false; }
}
