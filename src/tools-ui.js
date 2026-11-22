// Tools shelf UI. Called once from mount(). With every tool off, the page shows no new control.
import { TOOLS, loadTools, saveTools, cleanMessage, MAX_SHOW, buildScript, CALL_FIELDS, MAX_FIELD, beforeHangUp } from './tools.js';
import { MSG } from './messages.js';

export function mountTools(doc, storage) {
  const $ = (id) => doc.getElementById(id);
  const open = (d) => { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); };
  const shut = (d) => { if (d.close) d.close(); else d.removeAttribute('open'); };
  let enabled = loadTools(storage);
  const openBtn = $('open-tools'); const list = $('tools-list'); const tdlg = $('tools-dialog');

  // Settings: one checkbox per tool, all unchecked by default.
  const set = $('tools-set');
  for (const t of TOOLS) {
    const label = doc.createElement('label'); const box = doc.createElement('input');
    box.type = 'checkbox'; box.name = 'tool'; box.value = t.id; box.checked = enabled.includes(t.id);
    label.append(box, ` ${t.name}`);
    const hint = doc.createElement('span'); hint.className = 'hint'; hint.textContent = t.blurb;
    const wrap = doc.createElement('div'); wrap.append(label, hint);
    set.append(wrap);
    box.addEventListener('change', () => {
      enabled = TOOLS.map((x) => x.id).filter((id) => (id === t.id ? box.checked : enabled.includes(id)));
      saveTools(storage, enabled); refresh();
    });
  }

  function refresh() {
    openBtn.hidden = enabled.length === 0;
    list.replaceChildren(...TOOLS.filter((t) => enabled.includes(t.id)).map((t) => {
      const b = doc.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.textContent = t.name;
      b.addEventListener('click', () => { shut(tdlg); openers[t.id](); });
      return b;
    }));
  }
  const toTools = () => openBtn.focus();

  // Show this. The text lives in the textarea and one variable only. Closing clears both.
  const sd = $('show-dialog'); const text = $('show-text'); const big = $('show-big');
  const editBox = $('show-edit'); const viewBox = $('show-view');
  text.maxLength = MAX_SHOW;
  const showEdit = (label) => {
    viewBox.hidden = true; editBox.hidden = false;
    $('show-h').textContent = MSG.showTitle;
    doc.querySelector('label[for="show-text"]').textContent = label;
    text.focus();
  };
  const clear = () => { text.value = ''; big.textContent = ''; };
  $('show-go').addEventListener('click', () => {
    const msg = cleanMessage(text.value);
    if (!msg) { text.focus(); return; }
    big.textContent = msg; text.value = ''; editBox.hidden = true; viewBox.hidden = false; big.focus(); // read the message first
  });
  $('show-change').addEventListener('click', () => { text.value = big.textContent; big.textContent = ''; showEdit(MSG.showLabel); });
  $('show-turn').addEventListener('click', () => { big.textContent = ''; text.value = ''; showEdit(MSG.showTurnLabel); });
  const finishShow = () => { clear(); toTools(); };
  for (const id of ['show-close', 'show-close2']) $(id).addEventListener('click', () => { shut(sd); if (!sd.close) finishShow(); }); // old browsers: no close event
  sd.addEventListener('close', finishShow); // Esc fires close too
  doc.defaultView?.addEventListener('pagehide', clear);
  $('tools-close').addEventListener('click', () => shut(tdlg));
  tdlg.addEventListener('close', () => { if (!sd.open && !cd.open) toTools(); });

  // Call panel. Same rules: memory only, cleared on close, focus returns to the Tools button.
  const cd = $('call-dialog'); const cbig = $('call-big'); const inputs = {};
  $('call-fields').replaceChildren(...CALL_FIELDS.map((f) => {
    const l = doc.createElement('label'); l.htmlFor = `call-${f.id}`; l.textContent = f.label;
    const i = doc.createElement('input'); i.type = 'text'; i.id = `call-${f.id}`; i.maxLength = MAX_FIELD; i.autocomplete = 'off'; inputs[f.id] = i;
    const w = doc.createElement('div'); w.append(l, i); return w;
  }));
  const callEdit = () => { $('call-view').hidden = true; $('call-edit').hidden = false; inputs.who.focus(); };
  const callClear = () => { $('call-view').hidden = true; $('call-edit').hidden = false; for (const i of Object.values(inputs)) i.value = ''; cbig.textContent = ''; $('call-slow').checked = false; $('call-writing').checked = true; };
  $('call-go').addEventListener('click', () => {
    cbig.textContent = buildScript({ ...Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value])), slow: $('call-slow').checked, writing: $('call-writing').checked });
    $('call-before').replaceChildren(...beforeHangUp($('call-writing').checked).map((t) => { const li = doc.createElement('li'); li.textContent = t; return li; }));
    $('call-edit').hidden = true; $('call-view').hidden = false; cbig.focus();
  });
  $('call-change').addEventListener('click', () => { cbig.textContent = ''; callEdit(); });
  const finishCall = () => { callClear(); toTools(); };
  for (const id of ['call-close', 'call-close2']) $(id).addEventListener('click', () => { shut(cd); if (!cd.close) finishCall(); });
  cd.addEventListener('close', finishCall);
  doc.defaultView?.addEventListener('pagehide', callClear);

  const openers = {
    call: () => { callClear(); callEdit(); open(cd); inputs.who.focus(); },
    show: () => { clear(); showEdit(MSG.showLabel); open(sd); text.focus(); } };
  openBtn.addEventListener('click', () => open(tdlg));
  refresh();
}
