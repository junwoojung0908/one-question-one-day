const $ = id => document.getElementById(id);

const elNavEmail      = $('nav-email');
const elNavLogout     = $('nav-logout');
const elLoading       = $('state-loading');
const elMineSection   = $('mine-section');
const elMineContent   = $('mine-content');
const elOthersWrap    = $('others-wrap');
const elOthersToggle  = $('others-toggle');
const elOthersTogTxt  = $('others-toggle-text');
const elOthersContent = $('others-content');

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const ADMIN_EMAIL = 'junwoojung0908@gmail.com';

let questionMap  = {};
let currentUser  = null;
let othersLoaded = false;
let othersOpen   = false;

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

async function loadQuestions() {
  try {
    const res  = await fetch('questions.json');
    const list = await res.json();
    questionMap = Object.fromEntries(list.map(q => [q.date, q.content]));
  } catch (_) {}
}

// ── 내 기록 ────────────────────────────────────────────────────

async function renderMine() {
  if (!currentUser) {
    elMineContent.innerHTML = `<p class="history-empty">${t('login_for_rec')}
      <a href="index.html" style="color:inherit;text-decoration:underline;text-underline-offset:3px">${t('go_today')}</a></p>`;
    show(elMineSection);
    return;
  }

  const { data: answers, error } = await db
    .from('answers')
    .select('content, created_at, question_date')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    elMineContent.innerHTML = `<p class="history-empty">${t('load_err')}</p>`;
    show(elMineSection);
    return;
  }

  if (!answers || answers.length === 0) {
    elMineContent.innerHTML = `<p class="history-empty">${t('mine_empty')}</p>`;
    show(elMineSection);
    return;
  }

  const groups = new Map();
  answers.forEach(row => {
    const date = row.question_date ?? row.created_at.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(row);
  });

  elMineContent.innerHTML = [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, rows]) => rows.map(row => `
      <div class="history-card">
        ${questionMap[date] ? `<p class="history-question-text">${escapeHtml(questionMap[date])}</p><hr class="history-divider">` : ''}
        <p class="history-answer-text">${escapeHtml(row.content)}</p>
        <span class="feed-time">${formatDate(date)}</span>
      </div>`).join('')).join('');

  show(elMineSection);
}

// ── 다른 사람들의 답변 ─────────────────────────────────────────

async function loadOthers() {
  elOthersContent.innerHTML = `<p class="loading-text" style="padding:1rem 0">${t('others_loading')}</p>`;

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  let query = db.from('answers')
    .select('id, content, created_at, question_date')
    .order('question_date', { ascending: false })
    .order('created_at',    { ascending: false });

  // 로그인한 경우 본인 답변 제외
  if (currentUser) query = query.neq('user_id', currentUser.id);

  const { data: answers, error } = await query;

  if (error || !answers || answers.length === 0) {
    elOthersContent.innerHTML = `<p class="history-empty">${t('all_empty')}</p>`;
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

  elOthersContent.innerHTML = html;

  if (isAdmin) {
    elOthersContent.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('del_confirm'))) return;
        const { error } = await db.from('answers').delete().eq('id', btn.dataset.id);
        if (error) { alert(t('del_err') + error.message); return; }
        btn.closest('.feed-item').remove();
      });
    });
  }

  othersLoaded = true;
}

// ── 토글 ──────────────────────────────────────────────────────

elOthersToggle.addEventListener('click', async () => {
  if (!othersLoaded) await loadOthers();

  othersOpen = !othersOpen;
  if (othersOpen) {
    show(elOthersContent);
    elOthersTogTxt.textContent = t('others_close');
    elOthersToggle.querySelector('.toggle-arrow').textContent = '↑';
  } else {
    hide(elOthersContent);
    elOthersTogTxt.textContent = t('others_btn');
    elOthersToggle.querySelector('.toggle-arrow').textContent = '↓';
  }
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
  await renderMine();

  hide(elLoading);
  show(elOthersWrap);
}

init();
