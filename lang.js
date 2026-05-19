(function () {
  const LANG_KEY = 'oqod_lang';

  const STRINGS = {
    ko: {
      nav_history:    '내 답변',
      nav_logout:     '로그아웃',
      nav_today:      '오늘의 질문',
      loading:        '질문을 불러오는 중…',
      no_question:    '오늘의 질문을 준비 중입니다.',
      answer_ph:      '오늘의 질문에 답해보세요…',
      submit:         '제출하기',
      submitting:     '제출 중…',
      preview_label:  '작성한 답변',
      auth_desc1:     '답변을 저장하려면 이메일 인증이 필요합니다.',
      auth_desc2:     '메일함의 링크를 클릭하면 답변이 자동으로 제출됩니다.',
      email_ph:       '이메일 주소',
      send_link:      '인증 메일 받기',
      sending:        '발송 중…',
      sent:           '발송 완료',
      back:           '← 답변 수정하기',
      tab_users:      '모두의 답변',
      tab_phil:       '철학자의 답변',
      feed_empty:     '아직 답변이 없습니다.',
      phil_empty:     '준비된 철학자 답변이 없습니다.',
      login_prompt:   '로그인하면 답변이 저장되고 내 기록을 볼 수 있어요.',
      login_btn:      '로그인하기 →',
      h_loading:      '불러오는 중…',
      my_records:     '내 기록',
      login_for_rec:  '로그인하면 내 답변 기록을 볼 수 있어요.',
      mine_empty:     '아직 답변한 질문이 없습니다.',
      others_btn:     '다른 사람들의 답변 보기',
      others_close:   '다른 사람들의 답변 접기',
      others_loading: '불러오는 중…',
      all_ans_btn:    '전체 답변 보기',
      all_ans_close:  '전체 답변 접기',
      all_empty:      '아직 답변이 없습니다.',
      login_req:      '로그인이 필요합니다.',
      go_today:       '오늘의 질문으로',
      load_err:       '불러오는 중 오류가 발생했습니다.',
      del_btn:        '삭제',
      del_confirm:    '이 답변을 삭제할까요?',
      del_err:        '삭제 실패: ',
      email_req:      '이메일 주소를 입력해주세요.',
      link_sent:      '인증 메일을 보냈습니다. 메일함에서 링크를 클릭하세요.',
      save_err:       '답변 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
      saved:          '저장됐습니다 ✓',
    },
    en: {
      nav_history:    'My Answers',
      nav_logout:     'Logout',
      nav_today:      "Today's Question",
      loading:        'Loading question…',
      no_question:    "Today's question is being prepared.",
      answer_ph:      "Answer today's question…",
      submit:         'Submit',
      submitting:     'Submitting…',
      preview_label:  'Your answer',
      auth_desc1:     'Email verification is required to save your answer.',
      auth_desc2:     'Click the link in your inbox to submit automatically.',
      email_ph:       'Email address',
      send_link:      'Send magic link',
      sending:        'Sending…',
      sent:           'Sent',
      back:           '← Edit answer',
      tab_users:      "Everyone's answers",
      tab_phil:       "Philosophers' answers",
      feed_empty:     'No answers yet.',
      phil_empty:     'No philosopher answers available.',
      login_prompt:   'Log in to save your answer and view your history.',
      login_btn:      'Log in →',
      h_loading:      'Loading…',
      my_records:     'My Records',
      login_for_rec:  'Log in to view your answer history.',
      mine_empty:     'No answered questions yet.',
      others_btn:     "See others' answers",
      others_close:   "Hide others' answers",
      others_loading: 'Loading…',
      all_ans_btn:    'See all answers',
      all_ans_close:  'Hide answers',
      all_empty:      'No answers yet.',
      login_req:      'Login required.',
      go_today:       "Go to today's question",
      load_err:       'An error occurred while loading.',
      del_btn:        'Delete',
      del_confirm:    'Delete this answer?',
      del_err:        'Delete failed: ',
      email_req:      'Please enter your email address.',
      link_sent:      'Magic link sent. Click the link in your inbox.',
      save_err:       'An error occurred. Please try again.',
      saved:          'Saved ✓',
    },
    ja: {
      nav_history:    'マイ回答',
      nav_logout:     'ログアウト',
      nav_today:      '今日の質問',
      loading:        '質問を読み込み中…',
      no_question:    '今日の質問を準備中です。',
      answer_ph:      '今日の質問に答えてみましょう…',
      submit:         '送信',
      submitting:     '送信中…',
      preview_label:  '入力した回答',
      auth_desc1:     '回答を保存するにはメール認証が必要です。',
      auth_desc2:     'メールのリンクをクリックすると自動的に送信されます。',
      email_ph:       'メールアドレス',
      send_link:      '認証メールを送る',
      sending:        '送信中…',
      sent:           '送信完了',
      back:           '← 回答を編集する',
      tab_users:      'みんなの回答',
      tab_phil:       '哲学者の回答',
      feed_empty:     'まだ回答がありません。',
      phil_empty:     '哲学者の回答はまだありません。',
      login_prompt:   'ログインすると回答が保存され、履歴を確認できます。',
      login_btn:      'ログイン →',
      h_loading:      '読み込み中…',
      my_records:     'マイ記録',
      login_for_rec:  'ログインしてマイ回答履歴を確認しましょう。',
      mine_empty:     'まだ回答した質問がありません。',
      others_btn:     '他の人の回答を見る',
      others_close:   '他の人の回答を閉じる',
      others_loading: '読み込み中…',
      all_ans_btn:    '全回答を見る',
      all_ans_close:  '回答を閉じる',
      all_empty:      'まだ回答がありません。',
      login_req:      'ログインが必要です。',
      go_today:       '今日の質問へ',
      load_err:       '読み込み中にエラーが発生しました。',
      del_btn:        '削除',
      del_confirm:    'この回答を削除しますか？',
      del_err:        '削除失敗: ',
      email_req:      'メールアドレスを入力してください。',
      link_sent:      '認証メールを送りました。メールのリンクをクリックしてください。',
      save_err:       'エラーが発生しました。もう一度お試しください。',
      saved:          '保存しました ✓',
    },
  };

  const LOCALES = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' };

  let currentLang = localStorage.getItem(LANG_KEY) || 'ko';

  window.getLang   = () => currentLang;
  window.getLocale = () => LOCALES[currentLang] || 'ko-KR';
  window.t = key => {
    const s = STRINGS[currentLang] || STRINGS.ko;
    return s[key] !== undefined ? s[key] : (STRINGS.ko[key] || key);
  };

  window.setLang = function (lang) {
    if (!STRINGS[lang] || lang === currentLang) return;
    localStorage.setItem(LANG_KEY, lang);
    window.location.reload();
  };

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = window.t(el.dataset.i18n);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
    // Mark active lang option
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('lang-active', btn.dataset.lang === currentLang);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyI18n();

    // Dropdown toggle
    const toggleBtn = document.getElementById('lang-toggle');
    const menu      = document.getElementById('lang-menu');
    if (toggleBtn && menu) {
      toggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', () => menu.classList.remove('open'));
      menu.addEventListener('click', e => e.stopPropagation());
      menu.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', () => window.setLang(btn.dataset.lang));
      });
    }
  });
})();
