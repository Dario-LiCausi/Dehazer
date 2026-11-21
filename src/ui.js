// Draws the list. Never re-sorts: it shows what store.list() returns.
import { MSG, UNDO_MS } from './messages.js';

export function mount(doc, store) {
  const form = doc.getElementById('capture');
  const input = doc.getElementById('text');
  const status = doc.getElementById('status');
  const ul = doc.getElementById('items');
  const empty = doc.getElementById('empty');
  let undoTimer;

  const say = (msg) => { status.textContent = msg; };

  async function render() {
    const items = await store.list();
    ul.replaceChildren(...items.map(row));
    empty.hidden = items.length > 0;
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
    const item = await store.add(input.value);
    if (item) { input.value = ''; say(MSG.saved); await render(); }
    input.focus();
  });

  return render();
}
