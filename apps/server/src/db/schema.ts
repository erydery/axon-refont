import { pgTable, serial, text, varchar, timestamp, integer, boolean, jsonb, primaryKey, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(), email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }), hasOnboarded: boolean('has_onboarded').default(false).notNull(), interests: jsonb('interests').default([]),
  optionId: integer('option_id').references(() => options.id), levelId: varchar('level_id', { length: 80 }),
  createdAt: timestamp('created_at').defaultNow(), updatedAt: timestamp('updated_at').defaultNow(),
});
export const levels = pgTable('levels', { id: serial('id').primaryKey(), name: varchar('name', { length: 50 }).notNull(), order: integer('order').default(0) });
export const sectors = pgTable('sectors', { id: serial('id').primaryKey(), name: varchar('name', { length: 100 }).notNull(), slug: varchar('slug', { length: 100 }).unique().notNull() });
export const options = pgTable('options', { id: serial('id').primaryKey(), name: varchar('name', { length: 100 }).notNull(), slug: varchar('slug', { length: 100 }).unique().notNull(), sectorId: integer('sector_id').references(() => sectors.id, { onDelete: 'cascade' }) });
export const courses = pgTable('courses', { id: serial('id').primaryKey(), title: text('title').notNull(), optionId: integer('option_id').references(() => options.id, { onDelete: 'cascade' }), levelId: integer('level_id').references(() => levels.id), createdAt: timestamp('created_at').defaultNow() });
export const chapters = pgTable('chapters', { id: serial('id').primaryKey(), title: varchar('title').notNull(), content: text('content').notNull(), description: text('description'), order: integer('order').default(0), courseId: integer('course_id').references(() => courses.id), createdAt: varchar('createdAt'), position: integer('position').default(0) });
export const exercises = pgTable('exercises', { id: serial('id').primaryKey(), chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }), question: text('question').notNull(), options: text('options').array().notNull(), answer: text('answer').notNull(), explanation: text('explanation') });
export const userProgress = pgTable('user_progress', { id: serial('id').primaryKey(), userId: integer('user_id').references(() => users.id).notNull(), chapterId: integer('chapter_id').references(() => chapters.id).notNull(), isCompleted: boolean('is_completed').default(false).notNull(), completedAt: timestamp('completed_at') }, (t) => ({ uniqueProgress: unique().on(t.userId, t.chapterId) }));
export const userAnswers = pgTable('user_answers', { id: serial('id').primaryKey(), userId: integer('user_id').references(() => users.id).notNull(), exerciseId: integer('exercise_id').references(() => exercises.id), isCorrect: boolean('is_correct').notNull(), score: integer('score').default(0), attemptedAt: timestamp('attempted_at').defaultNow() });
export const unfollowedCourses = pgTable('unfollowed_courses', { userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull() }, (t) => ({ pk: primaryKey({ columns: [t.userId, t.courseId] }) }));

// ── Fonctions d’étude persistantes ───────────────────────────────────────────
export const studyTasks = pgTable('study_tasks', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'set null' }), title: varchar('title', { length: 255 }).notNull(),
  notes: text('notes'), scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(), durationMinutes: integer('duration_minutes').notNull().default(30),
  status: varchar('status', { length: 20 }).notNull().default('planned'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => ({ userScheduleIdx: index('study_tasks_user_schedule_idx').on(t.userId, t.scheduledAt) }));

export const revisionCards = pgTable('revision_cards', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: integer('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull().defaultNow(), intervalMinutes: integer('interval_minutes').notNull().default(0),
  easeFactor: integer('ease_factor_milli').notNull().default(2500), repetitions: integer('repetitions').notNull().default(0),
  lapses: integer('lapses').notNull().default(0), lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userChapterUnique: unique('revision_cards_user_chapter_unique').on(t.userId, t.chapterId), userDueIdx: index('revision_cards_user_due_idx').on(t.userId, t.dueAt) }));

export const revisionReviews = pgTable('revision_reviews', {
  id: serial('id').primaryKey(), cardId: integer('card_id').notNull().references(() => revisionCards.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), rating: varchar('rating', { length: 12 }).notNull(),
  intervalBeforeMinutes: integer('interval_before_minutes').notNull(), intervalAfterMinutes: integer('interval_after_minutes').notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ cardHistoryIdx: index('revision_reviews_card_history_idx').on(t.cardId, t.reviewedAt) }));

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(), status: varchar('status', { length: 20 }).notNull().default('in_progress'),
  questionCount: integer('question_count').notNull(), correctCount: integer('correct_count').notNull().default(0), scorePercent: integer('score_percent'),
  timeLimitMinutes: integer('time_limit_minutes'), startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
}, (t) => ({ userStartedIdx: index('exams_user_started_idx').on(t.userId, t.startedAt) }));

export const examQuestions = pgTable('exam_questions', {
  id: serial('id').primaryKey(), examId: integer('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id').references(() => exercises.id, { onDelete: 'set null' }),
  chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'set null' }), position: integer('position').notNull(),
  prompt: text('prompt').notNull(), options: jsonb('options').notNull(), correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'), selectedAnswer: text('selected_answer'), isCorrect: boolean('is_correct'),
}, (t) => ({ examPositionUnique: unique('exam_questions_exam_position_unique').on(t.examId, t.position) }));

export const assistantConversations = pgTable('assistant_conversations', {
  id: serial('id').primaryKey(), userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: integer('chapter_id').references(() => chapters.id, { onDelete: 'set null' }), title: varchar('title', { length: 180 }).notNull().default('Nouvelle conversation'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ userUpdatedIdx: index('assistant_conversations_user_updated_idx').on(t.userId, t.updatedAt) }));

export const assistantMessages = pgTable('assistant_messages', {
  id: serial('id').primaryKey(), conversationId: integer('conversation_id').notNull().references(() => assistantConversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 12 }).notNull(), content: text('content').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ conversationHistoryIdx: index('assistant_messages_conversation_history_idx').on(t.conversationId, t.createdAt) }));

export const usersRelations = relations(users, ({ one, many }) => ({ option: one(options, { fields: [users.optionId], references: [options.id] }), level: one(levels, { fields: [users.levelId], references: [levels.id] }), progress: many(userProgress), answers: many(userAnswers), studyTasks: many(studyTasks), revisionCards: many(revisionCards), exams: many(exams), assistantConversations: many(assistantConversations) }));
export const sectorsRelations = relations(sectors, ({ many }) => ({ options: many(options) }));
export const optionsRelations = relations(options, ({ one, many }) => ({ sector: one(sectors, { fields: [options.sectorId], references: [sectors.id] }), courses: many(courses), users: many(users) }));
export const levelsRelations = relations(levels, ({ many }) => ({ users: many(users), courses: many(courses) }));
export const coursesRelations = relations(courses, ({ one, many }) => ({ option: one(options, { fields: [courses.optionId], references: [options.id] }), level: one(levels, { fields: [courses.levelId], references: [levels.id] }), chapters: many(chapters) }));
export const chaptersRelations = relations(chapters, ({ one, many }) => ({ course: one(courses, { fields: [chapters.courseId], references: [courses.id] }), exercises: many(exercises), progress: many(userProgress) }));
export const exercisesRelations = relations(exercises, ({ one }) => ({ chapter: one(chapters, { fields: [exercises.chapterId], references: [chapters.id] }) }));
export const userProgressRelations = relations(userProgress, ({ one }) => ({ user: one(users, { fields: [userProgress.userId], references: [users.id] }), chapter: one(chapters, { fields: [userProgress.chapterId], references: [chapters.id] }) }));
export const userAnswersRelations = relations(userAnswers, ({ one }) => ({ user: one(users, { fields: [userAnswers.userId], references: [users.id] }), exercise: one(exercises, { fields: [userAnswers.exerciseId], references: [exercises.id] }) }));
export const studyTasksRelations = relations(studyTasks, ({ one }) => ({ user: one(users, { fields: [studyTasks.userId], references: [users.id] }), chapter: one(chapters, { fields: [studyTasks.chapterId], references: [chapters.id] }) }));
export const revisionCardsRelations = relations(revisionCards, ({ one, many }) => ({ user: one(users, { fields: [revisionCards.userId], references: [users.id] }), chapter: one(chapters, { fields: [revisionCards.chapterId], references: [chapters.id] }), reviews: many(revisionReviews) }));
export const revisionReviewsRelations = relations(revisionReviews, ({ one }) => ({ card: one(revisionCards, { fields: [revisionReviews.cardId], references: [revisionCards.id] }), user: one(users, { fields: [revisionReviews.userId], references: [users.id] }) }));
export const examsRelations = relations(exams, ({ one, many }) => ({ user: one(users, { fields: [exams.userId], references: [users.id] }), questions: many(examQuestions) }));
export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({ exam: one(exams, { fields: [examQuestions.examId], references: [exams.id] }), chapter: one(chapters, { fields: [examQuestions.chapterId], references: [chapters.id] }), exercise: one(exercises, { fields: [examQuestions.exerciseId], references: [exercises.id] }) }));
export const assistantConversationsRelations = relations(assistantConversations, ({ one, many }) => ({ user: one(users, { fields: [assistantConversations.userId], references: [users.id] }), chapter: one(chapters, { fields: [assistantConversations.chapterId], references: [chapters.id] }), messages: many(assistantMessages) }));
export const assistantMessagesRelations = relations(assistantMessages, ({ one }) => ({ conversation: one(assistantConversations, { fields: [assistantMessages.conversationId], references: [assistantConversations.id] }) }));

export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, 'passwordHash'>;
