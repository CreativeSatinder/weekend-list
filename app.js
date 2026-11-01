'use strict';

/* =========================================================
   Weekend List — shopping list + to-dos
   Data lives on the device in localStorage. With family sharing
   switched on (config.js), lists also sync through Firebase.
   ========================================================= */

const STORAGE_KEY = 'weekend-list-v1';

// Stores and family members are editable in the app (••• → Edit stores / Edit family)
// and shared with the family. These are just the starting defaults — rename them to your own stores.
const DEFAULT_STORES = [
  { id: 'store1', name: 'Store 1', color: 'blue', order: 0 },
  { id: 'store2', name: 'Store 2', color: 'red', order: 1 },
  { id: 'store3', name: 'Store 3', color: 'green', order: 2 },
  { id: 'any', name: 'Anywhere', color: 'grey', order: 3 },
];
const DEFAULT_PEOPLE = [
  { id: 'satinder', name: 'Satinder', color: 'forest', order: 0 },
  { id: 'mum', name: 'Mum', color: 'pink', order: 1 },
  { id: 'dolly', name: 'Dolly', color: 'amber', order: 2 },
  { id: 'ishman', name: 'Ishman', color: 'indigo', order: 3 },
  { id: 'trishveen', name: 'Trishveen', color: 'purple', order: 4 },
];
// Colour choices (each is a CSS variable --pal-<name> with light and dark versions).
const PALETTE = ['red', 'orange', 'amber', 'green', 'forest', 'teal', 'blue', 'indigo', 'purple', 'pink', 'brown', 'grey'];
const col = (x) => `var(--pal-${x && x.color ? x.color : 'grey'})`;

const UNKNOWN = { id: '', name: '?', color: 'grey' };
// A missing store (deleted on another phone) falls back to the last one, usually "Anywhere".
const storeById = (id) => state.stores.find((s) => s.id === id) || state.stores[state.stores.length - 1] || UNKNOWN;
const personById = (id) => state.people.find((p) => p.id === id) || UNKNOWN;
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/* ---------- State ---------- */

const defaultState = () => ({
  items: [],   // { id, name, qty, store, note, done, addedBy, createdAt, doneAt }
  tasks: [],   // { id, title, notes, due, person, done, addedBy, createdAt, doneAt }
  stores: DEFAULT_STORES.map((s) => ({ ...s })), // { id, name, color, order }
  people: DEFAULT_PEOPLE.map((p) => ({ ...p })), // { id, name, color, order }
  history: {}, // lowercased name -> { name, store, count }  (per phone, not shared)
  ui: {
    tab: 'shop', filter: 'all', addStore: 'any', addUrgent: false, addDue: '', personFilter: 'all', addPerson: 'satinder',
    me: '',       // who uses this phone (a person id)
    family: null, // family sharing code, when joined
  },
});

// Point filters and "add to" choices away from stores/people that no longer exist.
function fixUiRefs() {
  const ui = state.ui;
  const hasStore = (id) => state.stores.some((s) => s.id === id);
  const hasPerson = (id) => state.people.some((p) => p.id === id);
  if (ui.filter !== 'all' && !hasStore(ui.filter)) ui.filter = 'all';
  if (!hasStore(ui.addStore)) ui.addStore = storeById('').id;
  if (ui.personFilter !== 'all' && !hasPerson(ui.personFilter)) ui.personFilter = 'all';
  if (!hasPerson(ui.addPerson)) ui.addPerson = hasPerson(ui.me) ? ui.me : (state.people[0] || UNKNOWN).id;
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    const base = defaultState();
    const s = { ...base, ...data, ui: { ...base.ui, ...(data.ui || {}) } };
    // "Me" became Satinder when lists became shareable.
    s.tasks.forEach((t) => { if (!t.person || t.person === 'me') t.person = 'satinder'; });
    if (s.ui.addPerson === 'me') s.ui.addPerson = 'satinder';
    if (s.ui.personFilter === 'me') s.ui.personFilter = 'satinder';
    if (!s.stores.length) s.stores = base.stores;
    if (!s.people.length) s.people = base.people;
    return s;
  } catch {
    return defaultState();
  }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

function commit() { fixUiRefs(); save(); render(); sync.push(); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- Dates ---------- */

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => isoDate(new Date());
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
// Next occurrence of weekday (0 = Sun … 6 = Sat), today counts.
const nextDow = (dow) => addDays((dow - new Date().getDay() + 7) % 7);

function dueLabel(iso) {
  if (!iso) return '';
  const diff = Math.round((parseIso(iso) - parseIso(today())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = parseIso(iso);
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Weekend days that fall on today/tomorrow are dropped as duplicates.
const DUE_OPTIONS = () => [
  { label: 'No date', value: '' },
  { label: 'Today', value: today() },
  { label: 'Tomorrow', value: addDays(1) },
  { label: 'Saturday', value: nextDow(6) },
  { label: 'Sunday', value: nextDow(0) },
].filter((o, i, all) => all.findIndex((x) => x.value === o.value) === i);

/* ---------- DOM helpers ---------- */

const $ = (sel) => document.querySelector(sel);

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const svg = (paths) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = paths;
  return s;
};
const ICON_CHECK = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
const ICON_EDIT = '<path d="M9 6l6 6-6 6"/>';
const ICON_PENCIL = '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>';
const ICON_UP = '<path d="M12 19V5M6 11l6-6 6 6"/>';
const ICON_X = '<path d="M6 6l12 12M18 6L6 18"/>';

/* ---------- Toast with undo ---------- */

let toastTimer;
function toast(msg, undo) {
  const el = $('#toast');
  el.replaceChildren(h('span', {}, msg));
  if (undo) {
    el.append(h('button', { type: 'button', onclick: () => { undo(); hideToast(); } }, 'Undo'));
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, undo ? 5000 : 2200);
}
function hideToast() { $('#toast').classList.remove('show'); }

function snapshot() {
  const copy = JSON.parse(JSON.stringify({ items: state.items, tasks: state.tasks }));
  return () => { state.items = copy.items; state.tasks = copy.tasks; commit(); };
}

/* ---------- Adding ---------- */

// "2 milk", "milk x2", "3x eggs" -> { qty, name }
function parseQty(text) {
  let m = text.match(/^(\d{1,3})\s*x?\s+(.+)$/i);
  if (m) return { qty: +m[1], name: m[2] };
  m = text.match(/^(.+?)\s+x\s*(\d{1,3})$/i);
  if (m) return { qty: +m[2], name: m[1] };
  return { qty: 1, name: text };
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function addItem(text) {
  const { qty, name: rawName } = parseQty(text);
  const name = capitalise(rawName.trim());
  const key = name.toLowerCase();
  const store = state.ui.addStore;

  const existing = state.items.find((i) => !i.done && i.name.toLowerCase() === key && i.store === store);
  if (existing) {
    existing.qty += qty;
    toast(`${existing.name} × ${existing.qty}`);
  } else {
    state.items.push({ id: uid(), name, qty, store, urgent: !!state.ui.addUrgent, note: '', done: false, addedBy: state.ui.me, createdAt: Date.now() });
  }
  const hist = state.history[key] || { name, store, count: 0 };
  hist.count += 1; hist.store = store; hist.name = name;
  state.history[key] = hist;
  commit();
}

function addTask(text) {
  state.tasks.push({
    id: uid(), title: capitalise(text.trim()), notes: '', due: state.ui.addDue || '',
    person: state.ui.addPerson, done: false, addedBy: state.ui.me, createdAt: Date.now(),
  });
  commit();
}

// "added by Dolly" on shared lists, for things someone else added.
const addedByLabel = (x) => {
  if (!state.ui.family || !x.addedBy || x.addedBy === state.ui.me) return '';
  const p = personById(x.addedBy);
  return p.id ? `added by ${p.name}` : '';
};

/* ---------- Rendering ---------- */

function render() {
  const { tab } = state.ui;
  document.querySelectorAll('.tab').forEach((t) => {
    if (t.dataset.tab === tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  $('#shopView').hidden = tab !== 'shop';
  $('#taskView').hidden = tab !== 'tasks';
  $('#title').textContent = tab === 'shop' ? 'Shop' : 'To-do';

  const toBuy = state.items.filter((i) => !i.done).length;
  const dueNow = state.tasks.filter((t) => !t.done && t.due && t.due <= today()).length;
  $('#shopBadge').textContent = toBuy || '';
  $('#taskBadge').textContent = dueNow || '';

  if (tab === 'shop') renderShop(); else renderTasks();
  renderComposer();
  renderHistory();
  renderSyncPill();
}

// Filter chips along the top: stores on the shopping tab, people on the to-do tab.
// Picking a specific chip also makes it the default for new entries.
function renderChips(kind, options, open, keyOf, filterKey, addKey) {
  const counts = {};
  open.forEach((x) => { counts[keyOf(x)] = (counts[keyOf(x)] || 0) + 1; });

  const chip = (id, label, color, n) => h('button', {
    class: 'chip', role: 'tab', type: 'button',
    'aria-selected': String(state.ui[filterKey] === id),
    style: color ? `--c:${color}` : null,
    onclick: () => {
      state.ui[filterKey] = id;
      if (id !== 'all') state.ui[addKey] = id;
      commit();
    },
  }, color ? h('span', { class: 'dot' }) : null, label, h('span', { class: 'n' }, n || 0));

  $('#storeChips').replaceChildren(
    chip('all', 'All', null, open.length),
    ...options.map((o) => chip(o.id, o.name, col(o), counts[o.id])),
    h('button', { class: 'chip chip-edit', type: 'button', onclick: () => openListEditor(kind) }, svg(ICON_PENCIL), kind === 'stores' ? 'Manage stores' : 'Manage people'),
  );
}

function itemRow(item, showStore) {
  const s = storeById(item.store);
  const meta = [item.note, addedByLabel(item)].filter(Boolean).join(' · ');
  return h('li', { class: `row${item.done ? ' done' : ''}${item.urgent && !item.done ? ' urgent' : ''}`, style: `--c:${col(s)}` },
    h('button', { class: 'check', type: 'button', 'aria-label': item.done ? 'Untick' : 'Tick', onclick: () => toggleItem(item.id) }, svg(ICON_CHECK)),
    h('button', { class: 'row-main', type: 'button', onclick: () => toggleItem(item.id) },
      h('span', { class: 'row-title' }, item.name),
      meta ? h('span', { class: 'row-meta' }, meta) : null,
    ),
    item.urgent && !item.done ? h('span', { class: 'urgency-dot' }) : null,
    showStore ? h('span', { class: 'store-tag', style: `--c:${col(s)}` }, s.name) : null,
    item.qty > 1 ? h('span', { class: 'qty' }, `×${item.qty}`) : null,
    h('button', { class: 'icon-btn edit', type: 'button', 'aria-label': `Edit ${item.name}`, onclick: () => editItem(item.id) }, svg(ICON_EDIT)),
  );
}

function renderShop() {
  renderChips('stores', state.stores, state.items.filter((i) => !i.done), (i) => i.store, 'filter', 'addStore');
  // Insert Urgent chip after “All”
  const urgentCount = state.items.filter((i) => !i.done && i.urgent).length;
  const urgentChip = h('button', {
    class: 'chip', role: 'tab', type: 'button', style: '--c:var(--pal-red)',
    'aria-selected': String(state.ui.filter === 'urgent'),
    onclick: () => { state.ui.filter = state.ui.filter === 'urgent' ? 'all' : 'urgent'; commit(); },
  }, h('span', { class: 'dot' }), 'Urgent', h('span', { class: 'n' }, urgentCount));
  const storeChips = $('#storeChips');
  storeChips.insertBefore(urgentChip, storeChips.children[1]);

  const view = $('#shopView');
  const { filter } = state.ui;
  const visible = state.items.filter((i) => filter === 'urgent' ? i.urgent : (filter === 'all' || i.store === filter));
  const open = visible.filter((i) => !i.done);
  const done = visible.filter((i) => i.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

  $('#subtitle').textContent = visible.length
    ? `${open.length} to buy${done.length ? ` · ${done.length} in the trolley` : ''}`
    : '';

  if (!visible.length) {
    const where = filter === 'all' || filter === 'urgent' ? '' : ` for ${storeById(filter).name}`;
    view.replaceChildren(h('div', { class: 'empty' },
      h('b', {}, filter === 'urgent' ? 'No urgent items' : `Nothing on the list${where}`),
      filter === 'urgent' ? 'Mark items as Urgent when adding or editing them.' : 'Pick a store below, then type an item. Try “2 milk” or “bananas x6”.',
      h('br'), h('br'),
      h('button', { class: 'link-btn', type: 'button', style: 'font-size:14px', onclick: () => openListEditor('stores') }, '⚙ Rename your stores →')));
    return;
  }

  const groups = [];
  if (filter === 'urgent') {
    for (const s of state.stores) {
      const its = open.filter((i) => i.store === s.id);
      if (its.length) groups.push({ title: s.name, color: col(s), items: its });
    }
  } else if (filter === 'all') {
    for (const s of state.stores) {
      const its = open.filter((i) => i.store === s.id);
      if (its.length) groups.push({ title: s.name, color: col(s), items: its });
    }
  } else if (open.length) {
    groups.push({ title: 'To buy', color: col(storeById(filter)), items: open });
  }

  const nodes = groups.map((g) => h('div', { class: 'group' },
    h('div', { class: 'group-head', style: `--c:${g.color}` }, h('span', { class: 'dot' }), g.title, h('span', { class: 'spacer' }), String(g.items.length)),
    h('ul', { class: 'list' }, g.items.map((i) => itemRow(i, filter === 'urgent'))),
  ));

  if (done.length) {
    nodes.push(h('div', { class: 'group' },
      h('div', { class: 'group-head' }, 'In the trolley', h('span', { class: 'spacer' }),
        h('button', { class: 'link-btn', type: 'button', onclick: () => clearDoneItems(done.map((i) => i.id)) }, 'Clear')),
      h('ul', { class: 'list' }, done.map((i) => itemRow(i, filter === 'all' || filter === 'urgent'))),
    ));
  }
  view.replaceChildren(...nodes);
}

function taskRow(task, showPerson) {
  const overdue = !task.done && task.due && task.due < today();
  const p = personById(task.person);
  const meta = [task.due ? dueLabel(task.due) : '', task.notes ? task.notes.split('\n')[0] : '', addedByLabel(task)].filter(Boolean).join(' · ');
  return h('li', { class: `row${task.done ? ' done' : ''}`, style: `--c:${col(p)}` },
    h('button', { class: 'check', type: 'button', 'aria-label': task.done ? 'Mark not done' : 'Mark done', onclick: () => toggleTask(task.id) }, svg(ICON_CHECK)),
    h('button', { class: 'row-main', type: 'button', onclick: () => editTask(task.id) },
      h('span', { class: 'row-title' }, task.title),
      meta ? h('span', { class: `row-meta${overdue ? ' overdue' : ''}` }, meta) : null,
    ),
    showPerson ? h('span', { class: 'person-tag' }, p.name) : null,
  );
}

function renderTasks() {
  const view = $('#taskView');
  const t = today();
  const { personFilter } = state.ui;
  const personOf = (x) => x.person || 'satinder';
  renderChips('people', state.people, state.tasks.filter((x) => !x.done), personOf, 'personFilter', 'addPerson');

  const visible = state.tasks.filter((x) => personFilter === 'all' || personOf(x) === personFilter);
  const open = visible.filter((x) => !x.done);
  const done = visible.filter((x) => x.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  const byDue = (a, b) => (a.due || '').localeCompare(b.due || '') || a.createdAt - b.createdAt;
  const row = (x) => taskRow(x, personFilter === 'all');

  const overdue = open.filter((x) => x.due && x.due < t).sort(byDue);
  $('#subtitle').textContent = visible.length
    ? `${open.length} to do${overdue.length ? ` · ${overdue.length} overdue` : ''}`
    : '';

  if (!visible.length) {
    const who = personFilter === 'all' ? '' : ` for ${personById(personFilter).name}`;
    view.replaceChildren(h('div', { class: 'empty' },
      h('b', {}, `No to-dos${who}`),
      'Choose who it’s for and when (optional), then type a task below.'));
    return;
  }

  const groups = [
    { title: 'Overdue', items: overdue },
    { title: 'Today', items: open.filter((x) => x.due === t).sort(byDue) },
    { title: 'Coming up', items: open.filter((x) => x.due && x.due > t).sort(byDue) },
    { title: 'Anytime', items: open.filter((x) => !x.due).sort(byDue) },
  ].filter((g) => g.items.length);

  const nodes = groups.map((g) => h('div', { class: 'group' },
    h('div', { class: 'group-head' }, g.title, h('span', { class: 'spacer' }), String(g.items.length)),
    h('ul', { class: 'list' }, g.items.map(row)),
  ));

  if (done.length) {
    nodes.push(h('div', { class: 'group' },
      h('div', { class: 'group-head' }, 'Done', h('span', { class: 'spacer' }),
        h('button', { class: 'link-btn', type: 'button', onclick: () => clearDoneTasks(done.map((x) => x.id)) }, 'Clear')),
      h('ul', { class: 'list' }, done.map(row)),
    ));
  }
  view.replaceChildren(...nodes);
}

function renderComposer() {
  const opts = $('#composerOpts');
  const input = $('#addInput');
  if (state.ui.tab === 'shop') {
    input.placeholder = `Add to ${storeById(state.ui.addStore).name}… (e.g. 2 milk)`;
    input.setAttribute('list', 'history');
    opts.replaceChildren(
      h('div', { class: 'opt-row' }, state.stores.map((s) => h('button', {
        class: 'opt', type: 'button', style: `--c:${col(s)}`,
        'aria-pressed': String(state.ui.addStore === s.id),
        onclick: () => { state.ui.addStore = s.id; commit(); input.focus(); },
      }, s.name))),
      h('div', { class: 'opt-row' },
        h('button', { class: 'opt', type: 'button', style: '--c:var(--pal-red)', 'aria-pressed': String(!!state.ui.addUrgent), onclick: () => { state.ui.addUrgent = !state.ui.addUrgent; commit(); input.focus(); } }, 'Urgent'),
      ),
    );
  } else {
    input.placeholder = `Add a to-do for ${personById(state.ui.addPerson).name}…`;
    input.removeAttribute('list');
    // Drop a stale date choice (e.g. "Today" picked yesterday).
    const choices = DUE_OPTIONS();
    if (!choices.some((c) => c.value === state.ui.addDue)) state.ui.addDue = '';
    opts.replaceChildren(
      h('div', { class: 'opt-row', 'aria-label': 'Who for' }, state.people.map((p) => h('button', {
        class: 'opt', type: 'button', style: `--c:${col(p)}`, 'aria-pressed': String(state.ui.addPerson === p.id),
        onclick: () => { state.ui.addPerson = p.id; commit(); input.focus(); },
      }, p.name))),
      h('div', { class: 'opt-row', 'aria-label': 'When' }, choices.map((c) => h('button', {
        class: 'opt', type: 'button', 'aria-pressed': String(state.ui.addDue === c.value),
        onclick: () => { state.ui.addDue = c.value; commit(); input.focus(); },
      }, c.label))),
    );
  }
}

function renderHistory() {
  const onList = new Set(state.items.filter((i) => !i.done).map((i) => i.name.toLowerCase()));
  const entries = Object.entries(state.history)
    .filter(([k]) => !onList.has(k))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 200);
  $('#history').replaceChildren(...entries.map(([, v]) => h('option', { value: v.name })));
}

/* ---------- Actions ---------- */

function toggleItem(id) {
  const it = state.items.find((i) => i.id === id);
  if (!it) return;
  it.done = !it.done;
  it.doneAt = it.done ? Date.now() : null;
  if (navigator.vibrate) navigator.vibrate(8);
  commit();
}

function toggleTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  commit();
}

function clearDoneItems(ids) {
  const undo = snapshot();
  const set = new Set(ids);
  state.items = state.items.filter((i) => !set.has(i.id));
  commit();
  toast(`Cleared ${ids.length} item${ids.length > 1 ? 's' : ''}`, undo);
}

function clearDoneTasks(ids) {
  const undo = snapshot();
  const set = new Set(ids);
  const n = ids.length;
  state.tasks = state.tasks.filter((t) => !set.has(t.id));
  commit();
  toast(`Cleared ${n} to-do${n > 1 ? 's' : ''}`, undo);
}

/* ---------- Edit sheets ---------- */

const sheet = $('#sheet');
const sheetForm = $('#sheetForm');

function openSheet(children, onSave) {
  sheetForm.replaceChildren(h('div', { class: 'grabber' }), ...children);
  sheetForm.onsubmit = (e) => {
    const action = e.submitter && e.submitter.value;
    if (action === 'save') onSave();
  };
  sheet.showModal();
}

function editItem(id) {
  const it = state.items.find((i) => i.id === id);
  if (!it) return;
  let qty = it.qty;
  let store = it.store;
  let urgent = !!it.urgent;

  const nameIn = h('input', { type: 'text', value: it.name, required: true });
  const noteIn = h('input', { type: 'text', value: it.note || '', placeholder: 'Brand, size, on special…' });
  const qtyOut = h('output', {}, qty);
  const storeSeg = h('div', { class: 'seg' });
  const drawStores = () => storeSeg.replaceChildren(...state.stores.map((s) => h('button', {
    class: 'opt', type: 'button', style: `--c:${col(s)}`, 'aria-pressed': String(store === s.id),
    onclick: () => { store = s.id; drawStores(); },
  }, s.name)));
  drawStores();

  openSheet([
    h('h2', {}, 'Edit item'),
    h('label', { class: 'field' }, h('span', {}, 'Item'), nameIn),
    h('div', { class: 'field' }, h('span', {}, 'Quantity'),
      h('div', { class: 'stepper' },
        h('button', { type: 'button', 'aria-label': 'Less', onclick: () => { qty = Math.max(1, qty - 1); qtyOut.textContent = qty; } }, '−'),
        qtyOut,
        h('button', { type: 'button', 'aria-label': 'More', onclick: () => { qty += 1; qtyOut.textContent = qty; } }, '+'))),
    h('div', { class: 'field' }, h('span', {}, 'Store'), storeSeg),
    h('div', { class: 'field' }, h('span', {}, 'Priority'),
      h('div', { class: 'seg' },
        h('button', { class: 'opt', type: 'button', style: '--c:var(--pal-red)', 'aria-pressed': String(urgent), onclick: function() { urgent = !urgent; this.setAttribute('aria-pressed', String(urgent)); } }, 'Urgent'),
      )),
    h('label', { class: 'field' }, h('span', {}, 'Note'), noteIn),
    h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn danger', value: 'delete', formnovalidate: true, onclick: () => deleteItem(id) }, 'Delete'),
      h('button', { class: 'btn', value: 'cancel', formnovalidate: true }, 'Cancel'),
      h('button', { class: 'btn primary', value: 'save' }, 'Save')),
  ], () => {
    // Look it up again: a family member's change may have arrived while the sheet was open.
    const cur = state.items.find((i) => i.id === id);
    if (!cur) return;
    cur.name = capitalise(nameIn.value.trim()) || cur.name;
    cur.note = noteIn.value.trim();
    cur.qty = qty;
    cur.store = store;
    cur.urgent = urgent;
    commit();
  });
}

function deleteItem(id) {
  const undo = snapshot();
  const it = state.items.find((i) => i.id === id);
  state.items = state.items.filter((i) => i.id !== id);
  commit();
  if (it) toast(`Deleted ${it.name}`, undo);
}

function editTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  const titleIn = h('input', { type: 'text', value: t.title, required: true });
  const notesIn = h('textarea', { placeholder: 'Notes' });
  notesIn.value = t.notes || '';
  const dueIn = h('input', { type: 'date', value: t.due || '' });
  const quick = h('div', { class: 'seg' }, DUE_OPTIONS().map((c) => h('button', {
    class: 'opt', type: 'button', onclick: () => { dueIn.value = c.value; },
  }, c.label)));
  let person = t.person || 'satinder';
  const personSeg = h('div', { class: 'seg' });
  const drawPeople = () => personSeg.replaceChildren(...state.people.map((p) => h('button', {
    class: 'opt', type: 'button', style: `--c:${col(p)}`, 'aria-pressed': String(person === p.id),
    onclick: () => { person = p.id; drawPeople(); },
  }, p.name)));
  drawPeople();

  openSheet([
    h('h2', {}, 'Edit to-do'),
    h('label', { class: 'field' }, h('span', {}, 'Task'), titleIn),
    h('div', { class: 'field' }, h('span', {}, 'For'), personSeg),
    h('div', { class: 'field' }, h('span', {}, 'When'), quick, dueIn),
    h('label', { class: 'field' }, h('span', {}, 'Notes'), notesIn),
    h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn danger', value: 'delete', formnovalidate: true, onclick: () => deleteTask(id) }, 'Delete'),
      h('button', { class: 'btn', value: 'cancel', formnovalidate: true }, 'Cancel'),
      h('button', { class: 'btn primary', value: 'save' }, 'Save')),
  ], () => {
    const cur = state.tasks.find((x) => x.id === id);
    if (!cur) return;
    cur.title = capitalise(titleIn.value.trim()) || cur.title;
    cur.notes = notesIn.value.trim();
    cur.due = dueIn.value || '';
    cur.person = person;
    commit();
  });
}

function deleteTask(id) {
  const undo = snapshot();
  const t = state.tasks.find((x) => x.id === id);
  state.tasks = state.tasks.filter((x) => x.id !== id);
  commit();
  if (t) toast(`Deleted “${t.title}”`, undo);
}

/* ---------- Edit stores / family members ---------- */

function openListEditor(kind) {
  const isStores = kind === 'stores';
  const noun = isStores ? 'store' : 'person';
  // Work on a copy; nothing changes until Save.
  const rows = state[kind].map((x) => ({ ...x }));
  let paletteFor = null; // row whose colour choices are showing
  const listEl = h('div', { class: 'editor-list' });

  const draw = (focusId) => {
    listEl.replaceChildren(...rows.map((r, i) => {
      const nameIn = h('input', { type: 'text', value: r.name, placeholder: isStores ? 'Store name' : 'Name', 'aria-label': `${noun} name` });
      nameIn.addEventListener('input', () => { r.name = nameIn.value; });
      if (r.id === focusId) setTimeout(() => nameIn.focus(), 50);
      return h('div', { class: 'editor-item' },
        h('div', { class: 'editor-row' },
          h('button', {
            type: 'button', class: 'swatch', style: `--c:${col(r)}`, 'aria-label': 'Change colour',
            onclick: () => { paletteFor = paletteFor === r.id ? null : r.id; draw(); },
          }),
          nameIn,
          h('button', {
            type: 'button', class: 'icon-btn mini', 'aria-label': 'Move up', disabled: i === 0,
            onclick: () => { [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; draw(); },
          }, svg(ICON_UP)),
          h('button', {
            type: 'button', class: 'icon-btn mini', 'aria-label': `Remove ${r.name || noun}`,
            onclick: () => {
              if (rows.length === 1) { toast(`You need at least one ${noun}`); return; }
              rows.splice(i, 1); draw();
            },
          }, svg(ICON_X)),
        ),
        paletteFor === r.id ? h('div', { class: 'palette' }, PALETTE.map((c) => h('button', {
          type: 'button', class: 'swatch', style: `--c:var(--pal-${c})`, 'aria-label': c, 'aria-pressed': String(r.color === c),
          onclick: () => { r.color = c; paletteFor = null; draw(); },
        }))) : null,
      );
    }));
  };
  draw();

  const addRow = () => {
    const used = new Set(rows.map((r) => r.color));
    const r = { id: uid(), name: '', color: PALETTE.find((c) => !used.has(c)) || 'grey' };
    rows.push(r);
    draw(r.id);
  };

  openSheet([
    h('h2', {}, isStores ? 'Stores' : 'Family members'),
    h('p', { class: 'hint' }, `Tap a colour dot to change it.${state.ui.family ? ' Changes are shared with the family.' : ''}`),
    listEl,
    h('button', { class: 'btn', type: 'button', onclick: addRow }, isStores ? '+ Add store' : '+ Add person'),
    h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn', value: 'cancel', formnovalidate: true }, 'Cancel'),
      h('button', { class: 'btn primary', value: 'save' }, 'Save')),
  ], () => {
    const before = new Map(state[kind].map((x) => [x.id, x]));
    const kept = rows
      .map((r) => ({ ...r, name: r.name.trim() || (before.get(r.id) || {}).name || '' }))
      .filter((r) => r.name)
      .map((r, i) => ({ ...r, order: i }));
    if (!kept.length) { toast(`You need at least one ${noun}`); return; }

    // Anything that belonged to a removed store/person moves somewhere that still exists.
    const keptIds = new Set(kept.map((r) => r.id));
    let moved = 0;
    if (isStores) {
      const to = kept[kept.length - 1];
      state.items.forEach((it) => { if (!keptIds.has(it.store)) { it.store = to.id; moved += 1; } });
      if (moved) toast(`${moved} item${moved > 1 ? 's' : ''} moved to ${to.name}`);
    } else {
      const to = kept.find((p) => p.id === state.ui.me) || kept[0];
      state.tasks.forEach((t) => { if (!keptIds.has(t.person)) { t.person = to.id; moved += 1; } });
      if (moved) toast(`${moved} to-do${moved > 1 ? 's' : ''} moved to ${to.name}`);
    }
    state[kind] = kept;
    commit();
  });
}

// Tap outside a sheet to close it.
for (const d of [sheet, $('#menu')]) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close('cancel'); });
}

/* ---------- Menu: share / backup / restore ---------- */

function shoppingText() {
  const lines = [];
  for (const s of state.stores) {
    const its = state.items.filter((i) => !i.done && i.store === s.id);
    if (!its.length) continue;
    lines.push(`${s.name}:`);
    its.forEach((i) => lines.push(`• ${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}${i.note ? ` (${i.note})` : ''}`));
    lines.push('');
  }
  return lines.join('\n').trim();
}

async function shareList() {
  const text = shoppingText();
  if (!text) { toast('Shopping list is empty'); return; }
  try {
    if (navigator.share) { await navigator.share({ title: 'Shopping list', text }); return; }
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
  } catch (e) {
    if (e && e.name !== 'AbortError') toast('Could not share');
  }
}

async function exportData() {
  const json = JSON.stringify({ app: 'weekend-list', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
  const name = `weekend-list-backup-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Weekend List backup' });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  h('a', { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('#importFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.items) || !Array.isArray(data.tasks)) throw new Error('bad file');
    const whose = state.ui.family ? 'the family’s shared lists (for everyone)' : 'your current lists';
    if (!confirm(`Replace ${whose} with this backup (${data.items.length} items, ${data.tasks.length} to-dos)?`)) return;
    const undo = snapshot();
    state.items = data.items;
    state.tasks = data.tasks;
    state.history = data.history || state.history;
    commit();
    toast('Backup restored', undo);
  } catch {
    toast('That file is not a Weekend List backup');
  }
});

$('#menuBtn').addEventListener('click', () => $('#menu').showModal());
$('#menu').addEventListener('close', () => {
  const v = $('#menu').returnValue;
  $('#menu').returnValue = '';
  if (v === 'family') openFamilySheet();
  else if (v === 'editStores') openListEditor('stores');
  else if (v === 'editPeople') openListEditor('people');
  else if (v === 'share') shareList();
  else if (v === 'export') exportData();
  else if (v === 'import') $('#importFile').click();
  else if (v === 'clearHistory') { state.history = {}; commit(); toast('Suggestions cleared'); }
});

/* ---------- Family sharing (Firebase) ----------
   Each family has a secret code. Lists live in Firestore at
   families/{code}/items and families/{code}/tasks. The app keeps working
   from its local copy and Firestore's offline cache when there's no signal. */

const FIREBASE_SDK = (m) => `https://www.gstatic.com/firebasejs/10.12.2/firebase-${m}.js`;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L mix-ups

function newFamilyCode() {
  const r = crypto.getRandomValues(new Uint32Array(12));
  const s = Array.from(r, (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
function normaliseCode(text) {
  const s = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length === 12 ? `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}` : null;
}

// Stable JSON (sorted keys) so local and Firestore copies compare equal.
const stableJson = (o) => JSON.stringify(o, Object.keys(o).sort());
const idMap = (arr) => new Map(arr.map((x) => [x.id, stableJson(x)]));

// The last family copy this phone saw, kept across restarts so changes made
// before sync connects (or with no signal) are still sent later.
const SYNCED_KEY = 'weekend-list-synced';
function saveSynced() {
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify({
      family: state.ui.family,
      ...Object.fromEntries(SHARED.map((n) => [n, [...sync.synced[n]]])),
    }));
  } catch { /* ignore */ }
}
function loadSynced() {
  try {
    const s = JSON.parse(localStorage.getItem(SYNCED_KEY));
    if (s && s.family === state.ui.family) {
      // Lists missing from an older save count as already in sync, so this phone's
      // starting stores/people never overwrite ones the family has edited.
      return Object.fromEntries(SHARED.map((n) => [n, s[n] ? new Map(s[n]) : idMap(state[n])]));
    }
  } catch { /* ignore */ }
  return null;
}

// What's shared with the family: everything except this phone's own settings and suggestions.
const SHARED = ['items', 'tasks', 'stores', 'people'];
const allSynced = () => Object.fromEntries(SHARED.map((n) => [n, idMap(state[n])]));
const noneSynced = () => Object.fromEntries(SHARED.map((n) => [n, new Map()]));

const sync = {
  fs: null,       // Firestore module
  db: null,
  unsubs: [],
  synced: null,   // { items: Map(id -> json), tasks, stores, people } as last seen in the family list
  status: 'off',  // off | connecting | live | offline | error

  get configured() { return !!window.WEEKEND_FIREBASE; },
  get enabled() { return this.configured && !!state.ui.family; },

  async init() {
    if (this.db) return;
    const [fbApp, auth, fs] = await Promise.all(
      [import(FIREBASE_SDK('app')), import(FIREBASE_SDK('auth')), import(FIREBASE_SDK('firestore'))]);
    // Reuse the app if an earlier attempt got partway (e.g. sign-in failed offline).
    const app = fbApp.getApps().length ? fbApp.getApp() : fbApp.initializeApp(window.WEEKEND_FIREBASE);
    const a = auth.getAuth(app);
    await new Promise((res) => { const off = auth.onAuthStateChanged(a, () => { off(); res(); }); });
    if (!a.currentUser) await auth.signInAnonymously(a);
    this.fs = fs;
    try {
      this.db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache() });
    } catch {
      this.db = fs.getFirestore(app);
    }
  },

  col(name) { return this.fs.collection(this.db, 'families', state.ui.family, name); },

  async start() {
    if (!this.enabled) { this.setStatus('off'); return; }
    this.setStatus('connecting');
    try {
      await this.init();
    } catch (e) {
      console.warn('Sync unavailable', e);
      this.setStatus(navigator.onLine ? 'error' : 'offline');
      return;
    }
    this.stop();
    this.synced = loadSynced() || allSynced();
    this.push(); // anything changed while we weren't connected
    for (const name of SHARED) {
      const isList = name === 'stores' || name === 'people';
      this.unsubs.push(this.fs.onSnapshot(this.col(name), { includeMetadataChanges: true }, (snap) => {
        if (isList && snap.empty) {
          // No stores/people in the family yet: this phone's become the family's.
          if (!snap.metadata.fromCache) { this.synced[name] = new Map(); this.push(); }
          return;
        }
        state[name] = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
          .sort(isList ? byOrder : (a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        this.synced[name] = idMap(state[name]);
        fixUiRefs();
        saveSynced();
        this.setStatus(snap.metadata.fromCache ? 'offline' : 'live');
        save();
        render();
      }, (err) => { console.warn(err); this.setStatus('error'); }));
    }
  },

  stop() { this.unsubs.forEach((u) => u()); this.unsubs = []; },

  // Send whatever changed locally since the last family snapshot.
  push() {
    if (!this.enabled || !this.db || !this.synced) return;
    const ops = [];
    for (const name of SHARED) {
      const now = idMap(state[name]);
      const prev = this.synced[name];
      for (const [id, json] of now) if (prev.get(id) !== json) ops.push({ name, id, data: JSON.parse(json) });
      for (const id of prev.keys()) if (!now.has(id)) ops.push({ name, id, data: null });
      this.synced[name] = now;
    }
    if (!ops.length) return;
    saveSynced();
    for (let i = 0; i < ops.length; i += 400) { // Firestore batches max out at 500
      const batch = this.fs.writeBatch(this.db);
      for (const { name, id, data } of ops.slice(i, i + 400)) {
        const ref = this.fs.doc(this.col(name), id);
        if (data) batch.set(ref, data); else batch.delete(ref);
      }
      batch.commit().catch((e) => { console.warn(e); toast('Couldn’t sync a change'); });
    }
  },

  async create(me) {
    await this.init();
    const code = newFamilyCode();
    await this.fs.setDoc(this.fs.doc(this.db, 'families', code), { createdAt: Date.now(), createdBy: me });
    this.joinAs(code, me, true, true);
  },

  async join(code, me, keepLocal) {
    await this.init();
    const snap = await this.fs.getDoc(this.fs.doc(this.db, 'families', code));
    if (!snap.exists()) throw new Error('not-found');
    this.joinAs(code, me, keepLocal, false);
  },

  // upload: add this phone's items and to-dos to the family list.
  // isNew: a brand-new family also takes this phone's stores and people.
  joinAs(code, me, upload, isNew) {
    state.ui.family = code;
    state.ui.me = me;
    state.ui.addPerson = me;
    if (!upload) {
      state.items = [];
      state.tasks = [];
    }
    this.synced = isNew ? noneSynced()
      : { ...noneSynced(), stores: idMap(state.stores), people: idMap(state.people) };
    this.push();
    save();
    render();
    this.start();
  },

  leave() {
    this.stop();
    this.synced = null;
    try { localStorage.removeItem(SYNCED_KEY); } catch { /* ignore */ }
    state.ui.family = null;
    this.setStatus('off');
    commit();
  },

  setStatus(s) { this.status = s; renderSyncPill(); },
};

const SYNC_LABELS = { connecting: 'Syncing…', live: 'Shared', offline: 'Offline', error: 'Sync issue' };

function renderSyncPill() {
  const pill = $('#syncPill');
  pill.hidden = !state.ui.family;
  pill.dataset.status = sync.status;
  pill.querySelector('span').textContent = SYNC_LABELS[sync.status] || 'Not synced';
}

function inviteText(code) {
  const url = location.origin + location.pathname;
  return `Join our family Weekend List 🛒\n\n`
    + `1. Open ${url} in Safari (iPhone) or Chrome (Android) and add it to your Home Screen\n`
    + `2. Open the app from the Home Screen, tap ••• → Family sharing\n`
    + `3. Choose who you are, tap Join, and enter this code:\n\n${code}`;
}

function openFamilySheet() {
  if (!sync.configured) {
    openSheet([
      h('h2', {}, 'Family sharing'),
      h('p', { class: 'hint' }, 'Sharing isn’t switched on yet. It needs a free Firebase project to be connected (see the README).'),
      h('div', { class: 'sheet-actions' }, h('button', { class: 'btn', value: 'cancel' }, 'Close')),
    ], () => {});
    return;
  }

  let me = state.ui.me;
  const peopleSeg = h('div', { class: 'seg' });
  const drawPeople = () => peopleSeg.replaceChildren(...state.people.map((p) => h('button', {
    class: 'opt', type: 'button', style: `--c:${col(p)}`, 'aria-pressed': String(me === p.id),
    onclick: () => { me = p.id; drawPeople(); },
  }, p.name)));
  drawPeople();
  const whoField = h('div', { class: 'field' }, h('span', {}, 'Who uses this phone?'), peopleSeg);
  const needMe = () => { if (!me) toast('Choose who uses this phone first'); return !!me; };

  if (state.ui.family) {
    const code = state.ui.family;
    openSheet([
      h('h2', {}, 'Family sharing'),
      h('p', { class: 'hint' }, 'This phone shares its lists with everyone using this family code:'),
      h('div', { class: 'code-box' }, code),
      h('button', {
        class: 'btn primary', type: 'button',
        onclick: async () => {
          try {
            if (navigator.share) await navigator.share({ text: inviteText(code) });
            else { await navigator.clipboard.writeText(inviteText(code)); toast('Invite copied'); }
          } catch { /* share sheet dismissed */ }
        },
      }, 'Invite family'),
      whoField,
      h('div', { class: 'sheet-actions' },
        h('button', {
          class: 'btn danger', type: 'button',
          onclick: () => {
            if (!confirm('Stop sharing on this phone? Your lists stay here, but won’t update with the family any more.')) return;
            sheet.close();
            sync.leave();
            toast('Left the family list');
          },
        }, 'Leave'),
        h('button', { class: 'btn primary', value: 'save' }, 'Done')),
    ], () => {
      if (me && me !== state.ui.me) { state.ui.me = me; state.ui.addPerson = me; commit(); }
    });
    return;
  }

  const codeIn = h('input', { type: 'text', placeholder: 'XXXX-XXXX-XXXX', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false' });
  const hasLocal = state.items.length + state.tasks.length > 0;
  const keepIn = h('input', { type: 'checkbox', checked: hasLocal });

  const run = async (label, fn) => {
    sheet.close();
    toast(label);
    try {
      await fn();
      toast('You’re on the family list');
    } catch (e) {
      console.warn(e);
      toast(e.message === 'not-found' ? 'No family list with that code'
        : navigator.onLine ? 'Couldn’t connect. Check the Firebase setup.' : 'You need to be online for this');
    }
  };

  openSheet([
    h('h2', {}, 'Family sharing'),
    h('p', { class: 'hint' }, 'Share one shopping list and to-do list with the family. Changes show up on everyone’s phone.'),
    whoField,
    h('div', { class: 'field' }, h('span', {}, 'First phone in the family?'),
      h('button', {
        class: 'btn primary', type: 'button',
        onclick: () => { if (needMe()) run('Creating family list…', () => sync.create(me)); },
      }, 'Start a family list')),
    h('div', { class: 'field' }, h('span', {}, 'Got a code from someone?'),
      codeIn,
      hasLocal ? h('label', { class: 'check-row' }, keepIn, 'Add what’s already on this phone to the family list') : null,
      h('button', {
        class: 'btn', type: 'button',
        onclick: () => {
          if (!needMe()) return;
          const code = normaliseCode(codeIn.value);
          if (!code) { toast('Codes look like ABCD-EFGH-JKMN'); return; }
          run('Joining…', () => sync.join(code, me, keepIn.checked));
        },
      }, 'Join')),
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn', value: 'cancel' }, 'Cancel')),
  ], () => {});
}

$('#syncPill').addEventListener('click', openFamilySheet);
window.addEventListener('online', () => { if (sync.enabled && !sync.db) sync.start(); });

/* ---------- Wiring ---------- */

document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  state.ui.tab = t.dataset.tab;
  commit();
  window.scrollTo({ top: 0 });
}));

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#addInput');
  const text = input.value.trim();
  if (!text) return;
  if (state.ui.tab === 'shop') addItem(text); else addTask(text);
  input.value = '';
  input.focus();
});

// Picking a suggestion that was last bought at a particular store switches to that store.
$('#addInput').addEventListener('input', (e) => {
  if (state.ui.tab !== 'shop' || state.ui.filter !== 'all') return;
  const hit = state.history[e.target.value.trim().toLowerCase()];
  if (hit && hit.store !== state.ui.addStore && e.inputType !== 'insertText') {
    state.ui.addStore = hit.store;
    save();
    renderComposer();
  }
});

// Re-render when returning to the app (dates like "Today" may have changed).
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

/* ---------- Theme toggle ---------- */

const THEME_KEY = 'weekend-theme';
const ICON_SUN  = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
const ICON_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

function resolveTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  const btn = $('#themeBtn');
  if (!btn) return;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
  btn.replaceChildren(s);
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

$('#themeBtn').addEventListener('click', () => applyTheme(resolveTheme() === 'dark' ? 'light' : 'dark'));
applyTheme(resolveTheme());

render();
sync.start();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
