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
  return new Date(iso).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(getLocale(), {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
}

// ── Auth UI ───────────────────────────────────────────────────

function updateAuthUI() {
  if (currentUser) {
    elNavEmail.textContent = currentUser.email;
    show(elNavLogout);
  } else {
    elNavEmail.textContent = '';
    hide(elNavLogout);
  }
}

function showToast(msg) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('toast-show'));
    });
    setTimeout(() => {
      el.classList.remove('toast-show');
      setTimeout(() => { el.remove(); resolve(); }, 300);
    }, 1400);
  });
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
    alert(t('save_err'));
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
    elFeedUsers.innerHTML = `<p class="feed-empty">${t('feed_empty')}</p>`;
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
    elFeedPhilosophers.innerHTML = `<p class="feed-empty">${t('phil_empty')}</p>`;
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
  elSubmitBtn.textContent = t('submitting');

  const ok = await submitAnswer(content);
  if (ok) {
    if (!currentUser) {
      localStorage.setItem(SUBMITTED_KEY, TODAY);
    }
    await showToast(t('saved'));
    await showFeed();
  }

  elSubmitBtn.disabled = false;
  elSubmitBtn.textContent = t('submit');
});

elMagicLinkBtn.addEventListener('click', async () => {
  const email = elEmailInput.value.trim();
  if (!email) {
    elAuthMsg.textContent = t('email_req');
    elAuthMsg.classList.add('error');
    elEmailInput.focus();
    return;
  }

  elMagicLinkBtn.disabled = true;
  elMagicLinkBtn.textContent = t('sending');

  const redirectTo = window.location.href.split('?')[0].split('#')[0];
  const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });

  if (error) {
    elAuthMsg.textContent = '오류: ' + error.message;
    elAuthMsg.classList.add('error');
    elMagicLinkBtn.disabled = false;
    elMagicLinkBtn.textContent = t('send_link');
    return;
  }

  elEmailInput.disabled = true;
  elAuthMsg.classList.remove('error');
  elAuthMsg.textContent = t('link_sent');
  elMagicLinkBtn.textContent = t('sent');
});

elBackBtn.addEventListener('click', () => {
  showAnswerState();
});

elFeedLoginBtn.addEventListener('click', () => {
  showAuthState('');
});

elNavLogout.addEventListener('click', async () => {
  await db.auth.signOut();
  window.location.reload();
});

init();
