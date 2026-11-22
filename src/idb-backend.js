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
    // Run fn inside ONE read-write transaction. IndexedDB runs such transactions one at a time,
    // also across tabs, so read-then-write steps cannot interleave. If fn throws, nothing is kept.
    // fn must await only the four methods it is given (else the browser ends the transaction early).
    async transact(fn) {
      const tx = (await db()).transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      // Settle only on the final events. A request error bubbles to tx.onerror BEFORE the abort,
      // when tx.error is still empty, so tx.onerror is not used.
      const done = new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error('transaction aborted'));
      });
      done.catch(() => {}); // the real wait is below
      const inner = {
        getAll: () => wrap(os.getAll()),
        get: (id) => wrap(os.get(id)),
        put: async (item) => { await wrap(os.put(item)); },
        delete: async (id) => { await wrap(os.delete(id)); },
      };
      let out;
      try { out = await fn(inner); } catch (e) {
        try { tx.abort(); } catch { /* already finished */ }
        await done.catch(() => {}); // rollback is finished before the next queued write starts
        throw e;
      }
      await done;
      return out;
    },
  };
}

// Ask the browser to keep the data. Some browsers say no. That is fine.
export async function askPersist() {
  try { return await globalThis.navigator?.storage?.persist?.(); } catch { return false; }
}
