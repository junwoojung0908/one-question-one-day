const $ = id => document.getElementById(id);

const elNavEmail    = $('nav-email');
const elNavLogout   = $('nav-logout');
const elLoading     = $('state-loading');
const elTabAll      = $('tab-all');
const elTabMine     = $('tab-mine');
const elAllContent  = $('all-content');
const elMineContent = $('mine-content');

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(getLocale(), {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
}

const ADMIN_EMAIL = 'junwoojung0908@gmail.com';

let questionMap = {};
let currentUser = null;
let mineLoaded  = false;

// ── 질문 로드 ─────────────────────────────────────────────────

async function loadQuestions() {
  try {
    const res = await fetch('questions.json');
    const list = await res.json();
    questionMap = Object.fromEntries(list.map(q => [q.date, q.content]));
  } catch (_) {}
}

// ── 전체 기록 렌더링 ──────────────────────────────────────────

async function renderAll() {
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const { data: answers, error } = await db
    .from('answers')
    .select('id, content, created_at, question_date')
    .order('question_date', { ascending: false })
    .order('created_at',    { ascending: false });

  hide(elLoading);

  if (error || !answers || answers.length === 0) {
    elAllContent.innerHTML = `<p class="history-empty">${t('all_empty')}</p>`;
    show(elAllContent);
    return;
  }

  const groups = new Map();
  answers.forEach(row => {
    const date = row.question_date ?? row.created_at.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(row);
  });

  const html = [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => {
      const items = rows.map(row => `
        <div class="feed-item" data-id="${row.id}">
          <p class="feed-content">${escapeHtml(row.content)}</p>
          <div class="feed-item-footer">
            <span class="feed-time">${formatTime(row.created_at)}</span>
            ${isAdmin ? `<button class="admin-delete-btn" data-id="${row.id}">${t('del_btn')}</button>` : ''}
          </div>
        </div>`).join('');
      return `
        <div class="history-group">
          <p class="history-date-label">${formatDate(date)}</p>
          ${questionMap[date] ? `<p class="history-question-text">${escapeHtml(questionMap[date])}</p>` : ''}
          <div class="history-feed">${items}</div>
        </div>`;
    }).join('');

  elAllContent.innerHTML = html;
  show(elAllContent);

  if (isAdmin) {
    elAllContent.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('del_confirm'))) return;
        const id = btn.dataset.id;
        const { error } = await db.from('answers').delete().eq('id', id);
        if (error) { alert(t('del_err') + error.message); return; }
        btn.closest('.feed-item').remove();
      });
    });
  }
}

// ── 내 기록 렌더링 ────────────────────────────────────────────

async function renderMine() {
  if (mineLoaded) return;
  mineLoaded = true;

  if (!currentUser) {
    elMineContent.innerHTML = `<p class="history-empty">${t('login_req')}
      <a href="index.html" style="color:inherit;text-decoration:underline;text-underline-offset:3px">${t('go_today')}</a></p>`;
    show(elMineContent);
    return;
  }

  const { data: answers, error } = await db
    .from('answers')
    .select('content, created_at, question_date')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    elMineContent.innerHTML = `<p class="history-empty">${t('load_err')}</p>`;
    show(elMineContent);
    return;
  }

  if (!answers || answers.length === 0) {
    elMineContent.innerHTML = `<p class="history-empty">${t('mine_empty')}</p>`;
    show(elMineContent);
    return;
  }

  const groups = new Map();
  answers.forEach(row => {
    const date = row.question_date ?? row.created_at.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(row);
  });

  const html = [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => {
      const cards = rows.map(row => `
        <div class="history-card">
          ${questionMap[date] ? `<p class="history-question-text">${escapeHtml(questionMap[date])}</p><hr class="history-divider">` : ''}
          <p class="history-answer-text">${escapeHtml(row.content)}</p>
        </div>`).join('');
      return `
        <div class="history-group">
          <p class="history-date-label">${formatDate(date)}</p>
          ${cards}
        </div>`;
    }).join('');

  elMineContent.innerHTML = html;
  show(elMineContent);
}

// ── 탭 전환 ───────────────────────────────────────────────────

elTabAll.addEventListener('click', () => {
  elTabAll.classList.add('tab-active');
  elTabMine.classList.remove('tab-active');
  show(elAllContent);
  hide(elMineContent);
});

elTabMine.addEventListener('click', async () => {
  elTabMine.classList.add('tab-active');
  elTabAll.classList.remove('tab-active');
  hide(elAllContent);
  await renderMine();
});

// ── 로그아웃 ──────────────────────────────────────────────────

elNavLogout.addEventListener('click', async () => {
  await db.auth.signOut();
  window.location.href = 'index.html';
});

// ── Init ──────────────────────────────────────────────────────

async function init() {
  const { data: { session } } = await db.auth.getSession();
  currentUser = session?.user ?? null;

  if (currentUser) {
    elNavEmail.textContent = currentUser.email;
    show(elNavLogout);
  }

  await loadQuestions();
  await renderAll();
}

init();
