const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
const PENDING_KEY = 'oqod_pending';

let currentUser     = null;
let currentQuestion = null;

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
const elFeedList      = $('feed-list');
const elFeedCount     = $('feed-count');
const elNavEmail      = $('nav-email');
const elNavHistory    = $('nav-history');
const elNavLogout     = $('nav-logout');

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
  const { data, error } = await db
    .from('questions').select('*').eq('date', TODAY).maybeSingle();

  if (error || !data) { hide(elLoading); show(elEmpty); return false; }

  currentQuestion = data;
  elDateLabel.textContent = formatDate(TODAY);
  elQuestionText.textContent = data.content;
  hide(elLoading);
  show(elQuestionWrap);
  return true;
}

async function hasAnsweredToday() {
  if (!currentUser || !currentQuestion) return false;
  const { data } = await db.from('answers').select('id')
    .eq('question_id', currentQuestion.id).eq('user_id', currentUser.id).maybeSingle();
  return !!data;
}

async function submitAnswer(content) {
  if (!currentQuestion || !currentUser) return;
  const { error } = await db.from('answers').insert({
    question_id: currentQuestion.id,
    user_id: currentUser.id,
    content: content.trim(),
  });
  // 23505 = unique violation (already answered) — treat as success
  if (error && error.code !== '23505') {
    alert('답변 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    return;
  }
  await showFeed();
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
  const { data: answers } = await db.from('answers').select('content, created_at')
    .eq('question_id', currentQuestion.id).order('created_at', { ascending: false });

  elFeedList.innerHTML = '';
  if (!answers || answers.length === 0) {
    elFeedList.innerHTML = '<p class="feed-empty">아직 답변이 없습니다.</p>';
    elFeedCount.textContent = '';
  } else {
    elFeedCount.textContent = `${answers.length}개`;
    answers.forEach(a => {
      const item = document.createElement('div');
      item.className = 'feed-item';
      item.innerHTML = `
        <p class="feed-content">${escapeHtml(a.content)}</p>
        <span class="feed-time">${formatTime(a.created_at)}</span>`;
      elFeedList.appendChild(item);
    });
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
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) {
      try {
        const pending = JSON.parse(raw);
        if (pending.date === TODAY && pending.questionId === currentQuestion.id) {
          localStorage.removeItem(PENDING_KEY);
          await submitAnswer(pending.content);
          return;
        }
      } catch (_) { /* ignore */ }
      localStorage.removeItem(PENDING_KEY);
    }
    if (await hasAnsweredToday()) { await showFeed(); return; }
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

  if (!currentUser) {
    localStorage.setItem(PENDING_KEY, JSON.stringify({
      date: TODAY, questionId: currentQuestion?.id, content,
    }));
    showAuthState(content);
    return;
  }

  elSubmitBtn.disabled = true;
  elSubmitBtn.textContent = '제출 중…';
  await submitAnswer(content);
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
  const raw = localStorage.getItem(PENDING_KEY);
  if (raw) {
    try {
      const { content } = JSON.parse(raw);
      if (content) { elAnswerInput.value = content; elCharCount.textContent = content.length; }
    } catch (_) { /* ignore */ }
  }
});

elNavLogout.addEventListener('click', async () => {
  await db.auth.signOut();
  localStorage.removeItem(PENDING_KEY);
  window.location.reload();
});

init();
