CREATE TABLE IF NOT EXISTS study_tasks (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id integer REFERENCES chapters(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  notes text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 480),
  status varchar(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS study_tasks_user_schedule_idx ON study_tasks(user_id, scheduled_at);

CREATE TABLE IF NOT EXISTS revision_cards (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id integer NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL DEFAULT now(),
  interval_minutes integer NOT NULL DEFAULT 0 CHECK (interval_minutes >= 0),
  ease_factor_milli integer NOT NULL DEFAULT 2500 CHECK (ease_factor_milli BETWEEN 1300 AND 4000),
  repetitions integer NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
  lapses integer NOT NULL DEFAULT 0 CHECK (lapses >= 0),
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revision_cards_user_chapter_unique UNIQUE(user_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS revision_cards_user_due_idx ON revision_cards(user_id, due_at);

CREATE TABLE IF NOT EXISTS revision_reviews (
  id serial PRIMARY KEY,
  card_id integer NOT NULL REFERENCES revision_cards(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating varchar(12) NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  interval_before_minutes integer NOT NULL CHECK (interval_before_minutes >= 0),
  interval_after_minutes integer NOT NULL CHECK (interval_after_minutes >= 0),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS revision_reviews_card_history_idx ON revision_reviews(card_id, reviewed_at);

CREATE TABLE IF NOT EXISTS exams (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  question_count integer NOT NULL CHECK (question_count > 0),
  correct_count integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  score_percent integer CHECK (score_percent BETWEEN 0 AND 100),
  time_limit_minutes integer CHECK (time_limit_minutes BETWEEN 1 AND 240),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS exams_user_started_idx ON exams(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS exam_questions (
  id serial PRIMARY KEY,
  exam_id integer NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  exercise_id integer REFERENCES exercises(id) ON DELETE SET NULL,
  chapter_id integer REFERENCES chapters(id) ON DELETE SET NULL,
  position integer NOT NULL CHECK (position >= 0),
  prompt text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  selected_answer text,
  is_correct boolean,
  CONSTRAINT exam_questions_exam_position_unique UNIQUE(exam_id, position)
);

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id integer REFERENCES chapters(id) ON DELETE SET NULL,
  title varchar(180) NOT NULL DEFAULT 'Nouvelle conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assistant_conversations_user_updated_idx ON assistant_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id serial PRIMARY KEY,
  conversation_id integer NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role varchar(12) NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assistant_messages_conversation_history_idx ON assistant_messages(conversation_id, created_at);
