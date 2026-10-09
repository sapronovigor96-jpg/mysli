'use strict';
// «Мысли»: записи хранятся только в телефоне (localStorage).

const KEY = 'mysli.notes.v1';
const DRAFT = 'mysli.draft.v1';
const app = document.getElementById('app');

const ICON = {
  plus: '<svg viewBox="0 0 10 10"><rect x="4" y="0" width="2" height="10"/><rect x="0" y="4" width="10" height="2"/></svg>',
  back: '<svg viewBox="0 0 10 10"><rect x="1" y="4" width="8" height="2"/><rect x="2" y="3" width="2" height="1"/><rect x="3" y="2" width="2" height="1"/><rect x="2" y="6" width="2" height="1"/><rect x="3" y="7" width="2" height="1"/></svg>',
  check: '<svg viewBox="0 0 10 10"><rect x="0" y="5" width="2" height="2"/><rect x="2" y="7" width="2" height="2"/><rect x="4" y="5" width="2" height="2"/><rect x="6" y="3" width="2" height="2"/><rect x="8" y="1" width="2" height="2"/></svg>',
  save: '<svg viewBox="0 0 11 11"><rect x="5" y="0" width="1" height="6"/><rect x="3" y="4" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="0" y="7" width="1" height="4"/><rect x="10" y="7" width="1" height="4"/><rect x="0" y="10" width="11" height="1"/></svg>',
  trash: '<svg viewBox="0 0 10 10"><rect x="0" y="1" width="10" height="1"/><rect x="3" y="0" width="4" height="1"/><rect x="1" y="3" width="1" height="7"/><rect x="8" y="3" width="1" height="7"/><rect x="1" y="9" width="8" height="1"/><rect x="4" y="4" width="1" height="4"/><rect x="6" y="4" width="1" height="4"/></svg>',
};

// ---------- данные ----------
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function store(notes) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}
let notes = load();

// ---------- даты ----------
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const timeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function dayTitle(d) {
  const now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (dayKey(d) === dayKey(now)) return 'Сегодня';
  if (dayKey(d) === dayKey(y)) return 'Вчера';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}` + (d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '');
}
const fullDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${timeStr(d)}`;
function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

// ---------- мелочи ----------
function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
let toastTimer;
function toast(text) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 1800);
}

// ---------- экраны ----------
let view = { name: 'list' };
function go(v) { view = v; render(); window.scrollTo(0, 0); }

function render() {
  if (view.name === 'edit') return renderEdit();
  renderList();
}

function renderList() {
  const sorted = [...notes].sort((a, b) => b.at - a.at);
  let body = '';
  if (!sorted.length) {
    body = `
      <div class="empty">
        <img class="px" src="icons/cat.png" alt="Пиксельный котик">
        <b>Тут пока пусто</b>
        <span>Запиши первую мысль. Хватит одной строчки.</span>
      </div>`;
  } else {
    let lastDay = '';
    body = '<main class="list">';
    for (const n of sorted) {
      const d = new Date(n.at);
      if (dayKey(d) !== lastDay) {
        lastDay = dayKey(d);
        body += `<h2 class="day">${dayTitle(d)}</h2>`;
      }
      body += `<button class="note" data-id="${n.id}"><time>${timeStr(d)}</time><p>${esc(n.text)}</p></button>`;
    }
    body += '</main>';
  }
  const count = notes.length;
  app.innerHTML = `
    <div class="screen">
      <header class="top">
        ${count ? '<img class="cat px" src="icons/cat.png" alt="">' : ''}
        <div class="titles">
          <h1>Мысли</h1>
          ${count ? `<span class="sub">${count} ${plural(count, 'запись', 'записи', 'записей')}</span>` : ''}
        </div>
        ${count ? `<button class="ib lilac" id="export" aria-label="Сохранить копию в файл">${ICON.save}</button>` : ''}
      </header>
      ${body}
      <div class="dock"><button class="big" id="new">${ICON.plus} Записать мысль</button></div>
    </div>`;
  app.querySelector('#new').onclick = () => go({ name: 'edit' });
  app.querySelector('#export')?.addEventListener('click', exportNotes);
  app.querySelectorAll('.note').forEach((b) => { b.onclick = () => go({ name: 'edit', id: b.dataset.id }); });
}

function renderEdit() {
  const note = view.id ? notes.find((n) => n.id === view.id) : null;
  const when = note ? new Date(note.at) : new Date();
  const text = note ? note.text : (localStorage.getItem(DRAFT) || '');
  app.innerHTML = `
    <div class="screen">
      <header class="top">
        <button class="ib" id="back" aria-label="Назад к списку">${ICON.back}</button>
        <div class="titles">
          <h1 class="small">${note ? 'Запись' : 'Новая мысль'}</h1>
          <span class="sub">${fullDate(when)}</span>
        </div>
        ${note ? `<button class="ib danger" id="del" aria-label="Удалить запись">${ICON.trash}</button>` : ''}
      </header>
      <main class="edit">
        <textarea id="text" aria-label="Текст мысли" placeholder="Что сейчас в голове?"></textarea>
      </main>
      <div class="bar">
        <img class="cat px" src="icons/cat.png" alt="">
        <button class="big" id="save">${ICON.check} Сохранить</button>
      </div>
    </div>`;
  const ta = app.querySelector('#text');
  ta.value = text;
  // черновик новой записи не теряется, если закрыть приложение
  if (!note) ta.oninput = () => localStorage.setItem(DRAFT, ta.value);
  if (!note) setTimeout(() => ta.focus(), 50);

  app.querySelector('#back').onclick = () => {
    if (note && ta.value.trim() && ta.value !== note.text) save(note, ta.value);
    go({ name: 'list' });
  };
  app.querySelector('#save').onclick = () => {
    if (!ta.value.trim()) { toast('Пока пусто'); return; }
    save(note, ta.value);
    toast(note ? 'Сохранено' : 'Записано');
    go({ name: 'list' });
  };
  app.querySelector('#del')?.addEventListener('click', () => {
    if (!confirm('Удалить эту запись?')) return;
    notes = notes.filter((n) => n.id !== note.id);
    store(notes);
    toast('Удалено');
    go({ name: 'list' });
  });
}

function save(note, text) {
  text = text.replace(/\s+$/, '');
  if (note) {
    note.text = text;
    note.edited = Date.now();
  } else {
    notes.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now(), text });
    localStorage.removeItem(DRAFT);
  }
  store(notes);
}

// ---------- копия в файл ----------
async function exportNotes() {
  const sorted = [...notes].sort((a, b) => a.at - b.at);
  const txt = sorted.map((n) => `${fullDate(new Date(n.at))}\n${n.text}`).join('\n\n———\n\n') + '\n';
  const d = new Date();
  const name = `Мысли ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.txt`;
  const file = new File([txt], name, { type: 'text/plain' });
  // На iPhone откроется меню «Поделиться»: «Сохранить в Файлы», Telegram, почта и т. п.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); } catch (e) { /* закрыл меню */ }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- запуск ----------
render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
