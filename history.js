const $ = id => document.getElementById(id);

const elNavEmail  = $('nav-email');
const elNavLogout = $('nav-logout');
const elLoading   = $('state-loading');
const elContent   = $('content');

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

async function renderHistory(answers) {
  hide(elLoading);

  if (!answers || answers.length === 0) {
    elContent.innerHTML = '<p class="history-empty">아직 답변한 질문이 없습니다.</p>';
    return;
  }

  let questions = [];
  try {
    const res = await fetch('questions.json');
    questions = await res.json();
  } catch (_) { /* 질문 텍스트 없어도 날짜/답변은 표시 */ }

  const questionMap = Object.fromEntries(questions.map(q => [q.date, q.content]));

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

  elContent.innerHTML = html;
}

async function init() {
  const { data: { session } } = await db.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    hide(elLoading);
    elContent.innerHTML = `<p class="history-empty">로그인이 필요합니다.
      <a href="index.html" style="color:inherit;text-decoration:underline;text-underline-offset:3px">오늘의 질문으로</a></p>`;
    return;
  }

  elNavEmail.textContent = user.email;
  show(elNavLogout);

  const { data: answers, error } = await db
    .from('answers')
    .select('id, content, created_at, question_date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    hide(elLoading);
    elContent.innerHTML = '<p class="history-empty">불러오는 중 오류가 발생했습니다.</p>';
    return;
  }

  renderHistory(answers);
}

elNavLogout.addEventListener('click', async () => {
  await db.auth.signOut();
  window.location.href = 'index.html';
});

init();
