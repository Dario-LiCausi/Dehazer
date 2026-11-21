import { createStore, createMemoryBackend } from './store.js';
import { createIdbBackend, askPersist } from './idb-backend.js';
import { mount } from './ui.js';
import { MSG } from './messages.js';

const hasIdb = typeof indexedDB !== 'undefined';
const store = createStore(hasIdb ? createIdbBackend() : createMemoryBackend());
if (!hasIdb) {
  const n = document.getElementById('notice');
  n.textContent = MSG.storageFallback; n.hidden = false;
}
askPersist();
mount(document, store, {
  storage: (() => { try { return window.localStorage; } catch { return undefined; } })(),
  download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
});
