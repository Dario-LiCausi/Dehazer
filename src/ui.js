// Draws the list. Never re-sorts: it shows what store.list() returns.
import { MSG, UNDO_MS } from './messages.js';
import { nextFive } from './store.js';
import { toMarkdown, parseMarkdown, MAX_IMPORT } from './markdown.js';
import { backupDue, readLastExport, writeLastExport } from './backup.js';

const MAX_FILE = 10 * 1024 * 1024; // bytes

// env: { storage, now, download(name, text), readFile(file) } so tests and the browser can differ.
export function mount(doc, store, env = {}) {
  const now = env.now ?? (() => Date.now());
  const storage = env.storage ?? { getItem: () => null, setItem() {} };
  const form = doc.getElementById('capture');
  const input = doc.getElementById('text');
  const status = doc.getElementById('status');
  const ul = doc.getElementById('items');
  const empty = doc.getElementById('empty');
  let undoTimer;

  const say = (msg) => { status.textContent = msg; };

  const next5 = doc.getElementById('next5');
  const nextEmpty = doc.getElementById('next-empty');
  const backup = doc.getElementById('backup');

  async function render() {
    const items = await store.list();
    ul.replaceChildren(...items.map(row));
    empty.hidden = items.length > 0;
    const next = nextFive(items);
    next5.replaceChildren(...next.map(nextRow));
    nextEmpty.hidden = next.length > 0;
    // First time there is data: start the week now, so the note never greets a new user.
    if (items.length && !readLastExport(storage)) writeLastExport(storage, now());
    backup.hidden = !backupDue(readLastExport(storage), now(), items.length);
  }

  // First item says "Now" in words. The others are only quieter (no colour-only meaning, no motion).
  function nextRow(item, n) {
    const li = doc.createElement('li');
    li.className = n === 0 ? 'now' : 'soon';
    if (n === 0) {
      const tag = doc.createElement('strong');
      tag.textContent = `${MSG.nowLabel}: `;
      li.append(tag);
    }
    li.append(doc.createTextNode(item.text)); // text node: no HTML injection
    return li;
  }

  function button(label, onClick) {
    const b = doc.createElement('button');
    b.type = 'button'; b.textContent = label; b.addEventListener('click', onClick);
    return b;
  }

  function row(item) {
    const li = doc.createElement('li');
    li.dataset.state = item.state;
    const span = doc.createElement('span');
    span.className = 'text'; span.textContent = item.text; // textContent: no HTML injection
    const actions = doc.createElement('div');
    actions.className = 'actions';
    actions.append(
      button('Done', async () => { await store.setState(item.id, 'done'); say(MSG.done); await render(); }),
      button('Later', async () => { await store.setState(item.id, 'later'); say(MSG.later); await render(); }),
      button('Delete', async () => { const gone = await store.remove(item.id); await render(); offerUndo(gone); }),
    );
    li.append(span, actions);
    return li;
  }

  function offerUndo(gone) {
    clearTimeout(undoTimer);
    status.textContent = `${MSG.deleted} `;
    const undo = button(MSG.undo, async () => {
      clearTimeout(undoTimer); await store.restore(gone); say(MSG.restored); await render(); input.focus();
    });
    status.append(undo);
    undoTimer = setTimeout(() => say(''), UNDO_MS);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Clear first: text typed while the save runs must not be wiped. Put it back if the save fails.
    const typed = input.value;
    input.value = '';
    try {
      const item = await store.add(typed);
      if (item) { say(MSG.saved); await render(); }
    } catch { input.value = input.value ? `${typed} ${input.value}` : typed; say(MSG.saveFailed); }
    input.focus();
  });

  doc.getElementById('export').addEventListener('click', async () => {
    const items = await store.list();
    const day = new Date(now()).toISOString().slice(0, 10);
    env.download?.(`dehazer-${day}.md`, toMarkdown(items));
    writeLastExport(storage, now());
    say(MSG.exported); await render();
  });

  const fileInput = doc.getElementById('import');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE) { say(MSG.importTooBig); fileInput.value = ''; return; }
    let parsed = [];
    try {
      parsed = parseMarkdown(await (env.readFile ? env.readFile(file) : file.text()));
    } catch { say(MSG.importFailed); fileInput.value = ''; return; }
    if (parsed.length > MAX_IMPORT) say(MSG.importTooBig); // nothing is written
    else if (!parsed.length) say(MSG.importNone);
    else {
      try { const r = await store.importItems(parsed); say(MSG.importDone(r.added)); }
      catch { say(MSG.importStopped); }
    }
    fileInput.value = '';
    await render();
  });

  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) render(); });

  return render();
}
