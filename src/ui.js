// Draws the page. Never re-sorts: it shows what store.list() returns. The user reorders with Move up / Move down.
import { MSG, UNDO_MS } from './messages.js';
import { nextFive, MAX_TEXT } from './store.js';
import { toMarkdown, parseMarkdown, MAX_IMPORT } from './markdown.js';
import { backupDue, readLastExport, writeLastExport } from './backup.js';
import { splitLines, MAX_PASTE } from './paste.js';
import { loadSettings, saveSettings, applySettings } from './settings.js';
import { whatsNewDue, markSeen } from './whatsnew.js';

const MAX_FILE = 10 * 1024 * 1024; // bytes

// env: { storage, now, win, download(name, text), readFile(file) } so tests and the browser can differ.
export function mount(doc, store, env = {}) {
  const now = env.now ?? (() => Date.now());
  const storage = env.storage ?? { getItem: () => null, setItem() {} };
  const $ = (id) => doc.getElementById(id);
  const form = $('capture'); const input = $('text'); const status = $('status');
  const ul = $('items'); const empty = $('empty');
  const next5 = $('next5'); const nextEmpty = $('next-empty'); const backup = $('backup');
  let undoTimer; let view = 'active'; let editing = false;
  let settings = loadSettings(storage);
  const win = env.win ?? doc.defaultView;
  if (win) applySettings(win, settings);

  const say = (msg) => { clearTimeout(undoTimer); status.textContent = msg; };

  function button(label, onClick, cls = '') {
    const b = doc.createElement('button');
    b.type = 'button'; b.textContent = label; if (cls) b.className = cls; b.addEventListener('click', onClick);
    return b;
  }

  async function render(passive = false) {
    const items = await store.list();
    if (passive && editing) return; // a background redraw must never replace an open edit
    const next = nextFive(items);

    // Now card: one item, same place every day.
    const now1 = next[0];
    $('now-text').textContent = now1 ? now1.text : ''; // textContent: no HTML injection
    $('now-text').hidden = !now1;
    $('now-empty').hidden = !!now1;
    $('now-actions').hidden = !now1;
    $('now-done').onclick = now1 && (() => changeState(now1, 'done', MSG.done));
    $('now-later').onclick = now1 && (() => changeState(now1, 'later', MSG.later));

    next5.replaceChildren(...next.slice(1).map((it) => { const li = doc.createElement('li'); li.textContent = it.text; return li; }));
    $('next-section').hidden = next.length < 2;

    const shown = items.filter((i) => i.state === view);
    ul.replaceChildren(...shown.map((it, n) => row(it, n, shown.length)));
    empty.textContent = { active: MSG.nowEmpty, later: MSG.laterEmpty, done: MSG.doneEmpty }[view];
    empty.hidden = shown.length > 0;
    for (const b of doc.querySelectorAll('[data-view]')) {
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
      if (b.dataset.view === 'later') b.textContent = `${MSG.viewLater} (${items.filter((i) => i.state === 'later').length})`; // quiet count, no badge, no colour
    }

    // First time there is data: start the week now, so the note never greets a new user.
    if (items.length && !readLastExport(storage)) writeLastExport(storage, now());
    backup.hidden = !(settings.backupNote && backupDue(readLastExport(storage), now(), items.length));
  }

  // State change with a 30 s undo that puts the old state back.
  async function changeState(item, state, msg) {
    const before = item.state;
    await store.setState(item.id, state);
    await render();
    offerUndo(msg, async () => { await store.setState(item.id, before); say(MSG.restored); await render(); });
  }

  function row(item, n, count) {
    const li = doc.createElement('li');
    li.dataset.state = item.state;
    const span = doc.createElement('span');
    span.className = 'text'; span.textContent = item.text;
    const main = doc.createElement('div'); main.className = 'actions';
    if (item.state === 'active') {
      main.append(button(MSG.doneButton, () => changeState(item, 'done', MSG.done)), button(MSG.notNowButton, () => changeState(item, 'later', MSG.later)));
    } else {
      main.append(button(MSG.bringBack, async () => { await store.setState(item.id, 'active'); say(MSG.broughtBack); await render(); }));
    }
    const more = doc.createElement('details'); more.className = 'more';
    const sum = doc.createElement('summary'); sum.textContent = MSG.moreButton;
    const sec = doc.createElement('div'); sec.className = 'actions';
    sec.append(
      button(MSG.editButton, () => startEdit(li, span, item)),
      button(MSG.upButton, async () => { if (await store.move(item.id, 'up')) say(MSG.movedUp); await render(); focusRow(item.id, MSG.upButton); }),
      button(MSG.downButton, async () => { if (await store.move(item.id, 'down')) say(MSG.movedDown); await render(); focusRow(item.id, MSG.downButton); }),
      button(MSG.deleteButton, async () => { const gone = await store.remove(item.id); await render(); offerUndo(MSG.deleted, async () => { await store.restore(gone); say(MSG.restored); await render(); input.focus(); }); }),
    );
    sec.children[1].disabled = n === 0; sec.children[2].disabled = n === count - 1;
    more.append(sum, sec);
    li.dataset.id = item.id;
    li.append(span, main, more);
    return li;
  }

  // After a move the list is redrawn. Put focus back on the same button so keyboard users keep their place.
  function focusRow(id, label) {
    const li = [...ul.children].find((x) => x.dataset.id === id);
    if (!li) return;
    const d = li.querySelector('details'); d.open = true;
    const b = [...d.querySelectorAll('button')].find((x) => x.textContent === label && !x.disabled) ?? d.querySelector('button:not([disabled])');
    b?.focus();
  }

  // Edit in place: Enter saves, Esc cancels.
  function startEdit(li, span, item) {
    const f = doc.createElement('input');
    f.type = 'text'; f.value = item.text; f.maxLength = 2000; f.setAttribute('aria-label', MSG.editButton);
    let finished = false; editing = true;
    const finish = async (save) => {
      if (finished) return; finished = true; editing = false;
      if (save && f.value.trim() && f.value.trim() !== item.text) { await store.edit(item.id, f.value); say(MSG.edited); }
      await render();
      [...ul.children].find((x) => x.dataset.id === item.id)?.querySelector('summary')?.focus();
    };
    f.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    f.addEventListener('blur', () => finish(true));
    span.replaceWith(f); f.focus(); f.select();
  }

  function offerUndo(msg, undoFn) {
    clearTimeout(undoTimer);
    status.textContent = `${msg} `;
    status.append(button(MSG.undo, async () => { clearTimeout(undoTimer); await undoFn(); }));
    undoTimer = setTimeout(() => { status.textContent = ''; }, UNDO_MS);
  }

  // Capture: one line = one item. Several lines (paste) = several items. Enter saves, Shift+Enter makes a new line.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Clear first: text typed while the save runs must not be wiped. Put it back if the save fails.
    const typed = input.value;
    input.value = '';
    try {
      const lines = splitLines(typed);
      if (lines.length > MAX_PASTE) { input.value = typed; say(MSG.pasteTooMany); input.focus(); return; }
      if (lines.some((l) => l.length > MAX_TEXT)) { input.value = typed; say(MSG.pasteTooLong); input.focus(); return; }
      const saved = await store.addMany(lines);
      if (saved.length) { say(saved.length === 1 ? MSG.saved : MSG.added(saved.length)); await render(); }
    } catch { input.value = input.value ? `${typed} ${input.value}` : typed; say(MSG.saveFailed); }
    input.focus();
  });

  for (const b of doc.querySelectorAll('[data-view]')) {
    b.addEventListener('click', () => { view = b.dataset.view; render(); });
  }

  $('export').addEventListener('click', async () => {
    const items = await store.list();
    const day = new Date(now()).toISOString().slice(0, 10);
    env.download?.(`dehazer-${day}.md`, toMarkdown(items));
    writeLastExport(storage, now());
    say(MSG.exported); await render();
  });

  const fileInput = $('import');
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

  // Settings dialog. Each choice is kept at once, on this device only.
  const dlg = $('settings'); const sform = $('settings-form');
  function fillSettings() {
    for (const k of ['theme', 'size', 'font']) {
      const r = sform.querySelector(`input[name="${k}"][value="${settings[k]}"]`); if (r) r.checked = true;
    }
    sform.elements.backupNote.checked = settings.backupNote;
  }
  $('open-settings').addEventListener('click', () => {
    fillSettings();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  sform.addEventListener('change', () => {
    const next = { ...settings, backupNote: sform.elements.backupNote.checked };
    for (const k of ['theme', 'size', 'font']) next[k] = sform.elements[k].value || settings[k];
    settings = next; saveSettings(storage, settings);
    if (win) applySettings(win, settings);
    render();
  });
  sform.addEventListener('submit', () => { if (!dlg.showModal) dlg.removeAttribute('open'); });

  // "What changed": once after an update, never for a new user.
  if (whatsNewDue(storage)) {
    $('wn-body').textContent = MSG.newBody;
    $('whatsnew').hidden = false;
    $('wn-ok').addEventListener('click', () => { markSeen(storage); $('whatsnew').hidden = true; input.focus(); });
  }

  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) render(true); }); // never redraw under an open edit

  return render();
}
