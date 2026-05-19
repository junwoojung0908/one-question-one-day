const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
const PENDING_KEY   = 'oqod_pending';
const SUBMITTED_KEY = 'oqod_submitted';

let currentUser        = null;
let currentQuestion    = null;
let philosopherAnswers = [];

const $ = id => document.getElementById(id);

const elDateLabel     = $('date-label');
const elLoading       = $('state-loading');
const elEmpty         = $('state-empty');
const elQuestionWrap  = $('question-wrap');
const elQuestionText  = $('question-text');
const elStateAnswer   = $('state-answer');
const elStateAuth     = $('state-auth');
const elStateFeed     = $('state-feed');
const elAnswerInput   = $('answer-input');
const elCharCount     = $('char-count');
const elSubmitBtn     = $('submit-btn');
const elAnswerPreview = $('answer-preview');
const elEmailInput    = $('email-input');
const elMagicLinkBtn  = $('magic-link-btn');
const elAuthMsg       = $('auth-msg');
const elBackBtn       = $('back-btn');
const elFeedUsers        = $('feed-users');
const elFeedPhilosophers = $('feed-philosophers');
const elFeedCount        = $('feed-count');
const elTabUsers         = $('tab-users');
const elTabPhilosophers  = $('tab-philosophers');
const elNavEmail         = $('nav-email');
const elNavHistory       = $('nav-history');
const elNavLogout        = $('nav-logout');
const elFeedLoginPrompt  = $('feed-login-prompt');
const elFeedLoginBtn     = $('feed-login-btn');

// ── Helpers ───────────────────────────────────────────────────

const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

// ── Auth UI ───────────────────────────────────────────────────

function updateAuthUI() {
  if (currentUser) {
    elNavEmail.textContent = currentUser.email;
    show(elNavHistory);
    show(elNavLogout);
  } else {
    elNavEmail.textContent = '';
    hide(elNavHistory);
    hide(elNavLogout);
  }
}

// ── Data ──────────────────────────────────────────────────────

async function loadQuestion() {
  let questions;
  try {
    const res = await fetch('questions.json?v=' + Date.now());
    questions = await res.json();
  } catch (_) {
    hide(elLoading); show(elEmpty); return false;
  }

  const q = questions.find(q => q.date === TODAY);
  if (!q) { hide(elLoading); show(elEmpty); return false; }

  currentQuestion    = { id: q.date, date: q.date, content: q.content };
  philosopherAnswers = q.philosophers ?? [];
  elDateLabel.textContent = formatDate(TODAY);
  elQuestionText.textContent = q.content;
  hide(elLoading);
  show(elQuestionWrap);
  return true;
}

async function hasAnsweredToday() {
  if (!currentUser) return false;
  const { data } = await db.from('answers').select('id')
    .eq('question_date', TODAY).eq('user_id', currentUser.id).maybeSingle();
  return !!data;
}

async function submitAnswer(content) {
  const { error } = await db.from('answers').insert({
    question_date: TODAY,
    user_id: currentUser ? currentUser.id : null,
    content: content.trim(),
  });
  // 23505 = unique violation (already answered) — treat as success
  if (error && error.code !== '23505') {
    alert('답변 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    return false;
  }
  return true;
}

// ── State transitions ─────────────────────────────────────────

function showAnswerState() {
  hide(elStateAuth); hide(elStateFeed);
  show(elStateAnswer);
  elAnswerInput.focus();
}

function showAuthState(draftContent) {
  hide(elStateAnswer); hide(elStateFeed);
  elAnswerPreview.textContent = draftContent;
  elAuthMsg.textContent = '';
  elAuthMsg.classList.remove('error');
  elEmailInput.disabled = false;
  elMagicLinkBtn.disabled = false;
  elMagicLinkBtn.textContent = '인증 메일 받기';
  show(elStateAuth);
}

async function showFeed() {
  hide(elStateAnswer); hide(elStateAuth);

  // 사용자 답변 로드
  const { data: answers } = await db.from('answers').select('content, created_at')
    .eq('question_date', TODAY).order('created_at', { ascending: false });

  elFeedUsers.innerHTML = '';
  if (!answers || answers.length === 0) {
    elFeedUsers.innerHTML = '<p class="feed-empty">아직 답변이 없습니다.</p>';
    elFeedCount.textContent = '';
  } else {
    elFeedCount.textContent = answers.length;
    answers.forEach(a => {
      const item = document.createElement('div');
      item.className = 'feed-item';
      item.innerHTML = `
        <p class="feed-content">${escapeHtml(a.content)}</p>
        <span class="feed-time">${formatTime(a.created_at)}</span>`;
      elFeedUsers.appendChild(item);
    });
  }

  // 철학자 답변 렌더링
  elFeedPhilosophers.innerHTML = '';
  if (philosopherAnswers.length === 0) {
    elFeedPhilosophers.innerHTML = '<p class="feed-empty">준비된 철학자 답변이 없습니다.</p>';
  } else {
    philosopherAnswers.forEach(p => {
      const item = document.createElement('div');
      item.className = 'feed-item philosopher-item';
      item.innerHTML = `
        ${p.quote ? `<p class="philosopher-quote">${escapeHtml(p.quote)}</p>` : ''}
        <p class="feed-content">${escapeHtml(p.answer)}</p>
        <span class="philosopher-meta">
          <span class="philosopher-name">${escapeHtml(p.name)}</span>
          <span class="philosopher-era">${escapeHtml(p.era)}</span>
        </span>`;
      elFeedPhilosophers.appendChild(item);
    });
  }

  // 탭 초기화 (사용자 답변 탭 활성)
  elTabUsers.classList.add('tab-active');
  elTabPhilosophers.classList.remove('tab-active');
  show(elFeedUsers);
  hide(elFeedPhilosophers);

  // 로그인 프롬프트
  if (currentUser) {
    hide(elFeedLoginPrompt);
  } else {
    show(elFeedLoginPrompt);
  }

  show(elStateFeed);
}

// ── Init ──────────────────────────────────────────────────────

async function init() {
  const { data: { session } } = await db.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();

  const hasQuestion = await loadQuestion();
  if (!hasQuestion) return;

  if (currentUser) {
    localStorage.removeItem(PENDING_KEY); // 익명 재저장 방지: 그냥 제거
    if (await hasAnsweredToday()) { await showFeed(); return; }
  } else {
    // 익명 사용자가 오늘 이미 제출했으면 피드로
    if (localStorage.getItem(SUBMITTED_KEY) === TODAY) {
      await showFeed(); return;
    }
  }

  showAnswerState();
}

// ── Events ────────────────────────────────────────────────────

elAnswerInput.addEventListener('input', () => {
  elCharCount.textContent = elAnswerInput.value.length;
});

elSubmitBtn.addEventListener('click', async () => {
  const content = elAnswerInput.value.trim();
  if (!content) { elAnswerInput.focus(); return; }

  elSubmitBtn.disabled = true;
  elSubmitBtn.textContent = '제출 중…';

  const ok = await submitAnswer(content);
  if (ok) {
    if (!currentUser) {
      localStorage.setItem(SUBMITTED_KEY, TODAY); // 오늘 제출 표시
    }
    await showFeed();
  }

  elSubmitBtn.disabled = false;
  elSubmitBtn.textContent = '제출하기';
});

elMagicLinkBtn.addEventListener('click', async () => {
  const email = elEmailInput.value.trim();
  if (!email) {
    elAuthMsg.textContent = '이메일 주소를 입력해주세요.';
    elAuthMsg.classList.add('error');
    elEmailInput.focus();
    return;
  }

  elMagicLinkBtn.disabled = true;
  elMagicLinkBtn.textContent = '발송 중…';

  const redirectTo = window.location.href.split('?')[0].split('#')[0];
  const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });

  if (error) {
    elAuthMsg.textContent = '오류: ' + error.message;
    elAuthMsg.classList.add('error');
    elMagicLinkBtn.disabled = false;
    elMagicLinkBtn.textContent = '인증 메일 받기';
    return;
  }

  elEmailInput.disabled = true;
  elAuthMsg.classList.remove('error');
  elAuthMsg.textContent = '인증 메일을 보냈습니다. 메일함에서 링크를 클릭하세요.';
  elMagicLinkBtn.textContent = '발송 완료';
});

elBackBtn.addEventListener('click', () => {
  showAnswerState();
});

elTabUsers.addEventListener('click', () => {
  elTabUsers.classList.add('tab-active');
  elTabPhilosophers.classList.remove('tab-active');
  show(elFeedUsers);
  hide(elFeedPhilosophers);
});

elTabPhilosophers.addEventListener('click', () => {
  elTabPhilosophers.classList.add('tab-active');
  elTabUsers.classList.remove('tab-active');
  show(elFeedPhilosophers);
  hide(elFeedUsers);
});

elFeedLoginBtn.addEventListener('click', () => {
  showAuthState('');
});

elNavLogout.addEventListener('click', async () => {
  await db.auth.signOut();
  window.location.reload();
});

init();
