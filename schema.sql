-- ============================================================
-- one question one day — Supabase schema
-- ============================================================
-- 1. Run this in the Supabase SQL editor
-- 2. In Auth > URL Configuration, add your GitHub Pages URL
--    to "Redirect URLs":
--    https://junwoojung0908.github.io/one-question-one-day/index.html
-- ============================================================

-- Questions table
CREATE TABLE questions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE        UNIQUE NOT NULL,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_public" ON questions
  FOR SELECT USING (true);

CREATE POLICY "answers_select_public" ON answers
  FOR SELECT USING (true);

CREATE POLICY "answers_insert_own" ON answers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Sample questions ──────────────────────────────────────────

INSERT INTO questions (date, content) VALUES
  (CURRENT_DATE,      '지금 이 순간, 당신의 마음속에 가장 크게 자리 잡고 있는 것은 무엇인가요?'),
  (CURRENT_DATE + 1,  '당신에게 "좋은 삶"이란 어떤 모습인가요?'),
  (CURRENT_DATE + 2,  '지금의 나를 만들어 준 가장 결정적인 선택은 무엇이었나요?'),
  (CURRENT_DATE + 3,  '두려움이 없다면 당장 무엇을 하고 싶나요?'),
  (CURRENT_DATE + 4,  '나에게 가장 의미 있는 관계는 어떤 관계인가요?'),
  (CURRENT_DATE + 5,  '당신이 정말 소중히 여기지만, 충분히 돌보지 못하고 있는 것은 무엇인가요?'),
  (CURRENT_DATE + 6,  '10년 후의 나에게 지금 전하고 싶은 말은 무엇인가요?');
