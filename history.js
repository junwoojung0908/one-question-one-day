const $ = id => document.getElementById(id);

const elNavEmail    = $('nav-email');
const elNavLogout   = $('nav-logout');
const elLoading     = $('state-loading');
const elMineSection = $('mine-section');
const elMineContent = $('mine-content');

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

const ADMIN_EMAIL = 'junwoojung0908@gmail.com';

let questionMap = {};
let currentUser = null;

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

// ── 질문별 전체 답변 토글 ─────────────────────────────────────

function attachToggle(btn, date) {
  const contentEl = btn.nextElementSibling; // .all-answers-content
  const isAdmin   = currentUser?.email === ADMIN_EMAIL;
  let loaded = false;
  let open   = false;

  btn.addEventListener('click', async () => {
    if (!loaded) {
      btn.textContent = '…';
      btn.disabled = true;

      let query = db.from('answers')
        .select('id, content, created_at')
        .eq('question_date', date)
        .order('created_at', { ascending: false });

      if (currentUser) query = query.neq('user_id', currentUser.id);

      const { data: answers } = await query;
      loaded = true;
      btn.disabled = false;

      if (!answers || answers.length === 0) {
        contentEl.innerHTML = `<p class="feed-empty">${t('all_empty')}</p>`;
      } else {
        contentEl.innerHTML = answers.map(a => `
          <div class="feed-item" data-id="${a.id}">
            <p class="feed-content">${escapeHtml(a.content)}</p>
            <div class="feed-item-footer">
              <span class="feed-time">${formatTime(a.created_at)}</span>
              ${isAdmin ? `<button class="admin-delete-btn" data-id="${a.id}">${t('del_btn')}</button>` : ''}
            </div>
          </div>`).join('');

        if (isAdmin) {
          contentEl.querySelectorAll('.admin-delete-btn').forEach(del => {
            del.addEventListener('click', async () => {
              if (!confirm(t('del_confirm'))) return;
              const { error } = await db.from('answers').delete().eq('id', del.dataset.id);
              if (error) { alert(t('del_err') + error.message); return; }
              del.closest('.feed-item').remove();
            });
          });
        }

        // 버튼에 답변 수 표시
        btn.dataset.count = answers.length;
      }
    }

    open = !open;
    if (open) {
      show(contentEl);
      const count = btn.dataset.count ? ` (${btn.dataset.count})` : '';
      btn.innerHTML = `${t('all_ans_close')}${count} <span class="toggle-arrow">↑</span>`;
    } else {
      hide(contentEl);
      const count = btn.dataset.count ? ` (${btn.dataset.count})` : '';
      btn.innerHTML = `${t('all_ans_btn')}${count} <span class="toggle-arrow">↓</span>`;
    }
  });
}

// ── 내 기록 렌더링 ────────────────────────────────────────────

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

  // 날짜별 그룹
  const groups = new Map();
  answers.forEach(row => {
    const date = row.question_date ?? row.created_at.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(row);
  });

  elMineContent.innerHTML = '';

  [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([date, rows]) => {
      rows.forEach(row => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          ${questionMap[date] ? `<p class="history-question-text">${escapeHtml(questionMap[date])}</p><hr class="history-divider">` : ''}
          <p class="history-answer-text">${escapeHtml(row.content)}</p>
          <p class="history-date-label" style="margin-top:0.75rem">${formatDate(date)}</p>
          <button class="all-answers-btn">${t('all_ans_btn')} <span class="toggle-arrow">↓</span></button>
          <div class="all-answers-content hidden"></div>`;
        elMineContent.appendChild(card);

        attachToggle(card.querySelector('.all-answers-btn'), date);
      });
    });

  show(elMineSection);
}

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
}

init();
