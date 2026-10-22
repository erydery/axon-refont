import { Router } from 'express';
import { and, asc, desc, eq, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import {
  chapters,
  courses,
  examQuestions,
  exams,
  exercises,
  revisionCards,
  revisionReviews,
  studyTasks,
  unfollowedCourses,
  userAnswers,
  userProgress,
  users,
} from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveUserLevelId } from '../lib/course-access.js';

export const studyRouter = Router();
studyRouter.use(requireAuth);

export async function canAccessChapter(userId: number, chapterId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.optionId) return false;
  const levelId = await resolveUserLevelId(user);
  const courseFilter = levelId
    ? and(eq(courses.optionId, user.optionId), eq(courses.levelId, levelId))
    : eq(courses.optionId, user.optionId);
  const [row] = await db
    .select({ chapterId: chapters.id })
    .from(chapters)
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .leftJoin(
      unfollowedCourses,
      and(eq(unfollowedCourses.userId, userId), eq(unfollowedCourses.courseId, courses.id)),
    )
    .where(and(eq(chapters.id, chapterId), courseFilter, isNull(unfollowedCourses.courseId)))
    .limit(1);
  return Boolean(row);
}

// ── Planning réel, persistant et associé aux chapitres du cursus ─────────────
const taskInput = z.object({
  title: z.string().trim().min(2).max(255),
  chapterId: z.number().int().positive().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
});

studyRouter.get('/planning', async (req, res, next) => {
  try {
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date(Date.now() - 30 * 86400000);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date(Date.now() + 90 * 86400000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to)
      return res.status(400).json({ error: 'Période de planning invalide.' });
    const rows = await db
      .select({ task: studyTasks, chapterTitle: chapters.title, courseTitle: courses.title })
      .from(studyTasks)
      .leftJoin(chapters, eq(studyTasks.chapterId, chapters.id))
      .leftJoin(courses, eq(chapters.courseId, courses.id))
      .where(
        and(
          eq(studyTasks.userId, req.user!.id),
          gte(studyTasks.scheduledAt, from),
          lt(studyTasks.scheduledAt, to),
        ),
      )
      .orderBy(asc(studyTasks.scheduledAt))
      .limit(300);
    res.json(
      rows.map(({ task, chapterTitle, courseTitle }) => ({ ...task, chapterTitle, courseTitle })),
    );
  } catch (error) {
    next(error);
  }
});

studyRouter.post('/planning', async (req, res, next) => {
  try {
    const data = taskInput.parse(req.body);
    if (data.chapterId && !(await canAccessChapter(req.user!.id, data.chapterId)))
      return res
        .status(403)
        .json({ error: 'Ce chapitre ne fait pas partie de votre cursus actif.' });
    const [task] = await db
      .insert(studyTasks)
      .values({ ...data, chapterId: data.chapterId ?? null, userId: req.user!.id })
      .returning();
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

studyRouter.patch('/planning/:taskId', async (req, res, next) => {
  try {
    const taskId = z.coerce.number().int().positive().parse(req.params.taskId);
    const patch = z
      .object({
        title: z.string().trim().min(2).max(255).optional(),
        chapterId: z.number().int().positive().nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
        scheduledAt: z.coerce.date().optional(),
        durationMinutes: z.number().int().min(5).max(480).optional(),
        status: z.enum(['planned', 'completed', 'cancelled']).optional(),
      })
      .refine((v) => Object.keys(v).length > 0)
      .parse(req.body);
    if (patch.chapterId && !(await canAccessChapter(req.user!.id, patch.chapterId)))
      return res
        .status(403)
        .json({ error: 'Ce chapitre ne fait pas partie de votre cursus actif.' });
    const [task] = await db
      .update(studyTasks)
      .set({
        ...patch,
        updatedAt: new Date(),
        ...(patch.status === 'completed'
          ? { completedAt: new Date() }
          : patch.status === 'planned'
            ? { completedAt: null }
            : {}),
      })
      .where(and(eq(studyTasks.id, taskId), eq(studyTasks.userId, req.user!.id)))
      .returning();
    if (!task) return res.status(404).json({ error: 'Séance introuvable.' });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

studyRouter.delete('/planning/:taskId', async (req, res, next) => {
  try {
    const taskId = z.coerce.number().int().positive().parse(req.params.taskId);
    const [deleted] = await db
      .delete(studyTasks)
      .where(and(eq(studyTasks.id, taskId), eq(studyTasks.userId, req.user!.id)))
      .returning({ id: studyTasks.id });
    if (!deleted) return res.status(404).json({ error: 'Séance introuvable.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// ── Révisions espacées : chaque validation crée une carte réelle et historique ─
studyRouter.get('/revisions', async (req, res, next) => {
  try {
    const user = req.user!;
    if (!user.optionId)
      return res.json({ now: new Date().toISOString(), cards: [], available: [] });
    const levelId = await resolveUserLevelId(user);
    const courseCriteria = levelId
      ? and(eq(courses.optionId, user.optionId), eq(courses.levelId, levelId))
      : eq(courses.optionId, user.optionId);
    const completedChapters = await db
      .select({ chapterId: chapters.id })
      .from(userProgress)
      .innerJoin(chapters, eq(userProgress.chapterId, chapters.id))
      .innerJoin(courses, eq(chapters.courseId, courses.id))
      .leftJoin(
        unfollowedCourses,
        and(eq(unfollowedCourses.userId, user.id), eq(unfollowedCourses.courseId, courses.id)),
      )
      .where(
        and(
          eq(userProgress.userId, user.id),
          eq(userProgress.isCompleted, true),
          isNull(unfollowedCourses.courseId),
          courseCriteria,
        ),
      );
    if (completedChapters.length)
      await db
        .insert(revisionCards)
        .values(completedChapters.map(({ chapterId }) => ({ userId: user.id, chapterId })))
        .onConflictDoNothing();

    const cards = await db.query.revisionCards.findMany({
      where: eq(revisionCards.userId, user.id),
      with: { chapter: { with: { course: true } } },
      orderBy: [asc(revisionCards.dueAt)],
    });
    const available = await db
      .select({
        chapterId: chapters.id,
        chapterTitle: chapters.title,
        courseId: courses.id,
        courseTitle: courses.title,
      })
      .from(chapters)
      .innerJoin(courses, eq(chapters.courseId, courses.id))
      .leftJoin(
        unfollowedCourses,
        and(eq(unfollowedCourses.userId, user.id), eq(unfollowedCourses.courseId, courses.id)),
      )
      .where(and(courseCriteria, isNull(unfollowedCourses.courseId)))
      .orderBy(asc(courses.title), asc(chapters.order));
    res.json({
      now: new Date().toISOString(),
      cards: cards.map((card) => ({
        id: card.id,
        dueAt: card.dueAt,
        intervalMinutes: card.intervalMinutes,
        repetitions: card.repetitions,
        lapses: card.lapses,
        lastReviewedAt: card.lastReviewedAt,
        chapter: card.chapter,
        course: card.chapter?.course,
      })),
      available,
    });
  } catch (error) {
    next(error);
  }
});

studyRouter.post('/revisions', async (req, res, next) => {
  try {
    const { chapterId } = z.object({ chapterId: z.number().int().positive() }).parse(req.body);
    if (!(await canAccessChapter(req.user!.id, chapterId)))
      return res
        .status(403)
        .json({ error: 'Ce chapitre ne fait pas partie de votre cursus actif.' });
    const [card] = await db
      .insert(revisionCards)
      .values({ userId: req.user!.id, chapterId })
      .onConflictDoNothing()
      .returning();
    if (card) return res.status(201).json(card);
    const [existing] = await db
      .select()
      .from(revisionCards)
      .where(and(eq(revisionCards.userId, req.user!.id), eq(revisionCards.chapterId, chapterId)))
      .limit(1);
    res.json(existing);
  } catch (error) {
    next(error);
  }
});

studyRouter.post('/revisions/:cardId/review', async (req, res, next) => {
  try {
    const cardId = z.coerce.number().int().positive().parse(req.params.cardId);
    const { rating } = z
      .object({ rating: z.enum(['again', 'hard', 'good', 'easy']) })
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const [card] = await tx
        .select()
        .from(revisionCards)
        .where(and(eq(revisionCards.id, cardId), eq(revisionCards.userId, req.user!.id)))
        .limit(1);
      if (!card) return null;
      const before = card.intervalMinutes;
      const ease = card.easeFactor / 1000;
      let after: number;
      let nextEase = ease;
      let repetitions = card.repetitions;
      let lapses = card.lapses;
      if (rating === 'again') {
        after = 10;
        repetitions = 0;
        lapses += 1;
        nextEase = Math.max(1.3, ease - 0.2);
      } else if (rating === 'hard') {
        after = before === 0 ? 1440 : Math.max(1440, Math.round(before * 1.2));
        repetitions += 1;
        nextEase = Math.max(1.3, ease - 0.15);
      } else if (rating === 'easy') {
        after = before === 0 ? 5760 : Math.max(5760, Math.round(before * (ease + 0.3)));
        repetitions += 1;
        nextEase = Math.min(4, ease + 0.15);
      } else {
        after = before === 0 ? 1440 : before === 1440 ? 8640 : Math.round(before * ease);
        repetitions += 1;
      }
      const now = new Date();
      await tx.insert(revisionReviews).values({
        cardId,
        userId: req.user!.id,
        rating,
        intervalBeforeMinutes: before,
        intervalAfterMinutes: after,
        reviewedAt: now,
      });
      const [updated] = await tx
        .update(revisionCards)
        .set({
          intervalMinutes: after,
          easeFactor: Math.round(nextEase * 1000),
          repetitions,
          lapses,
          lastReviewedAt: now,
          dueAt: new Date(now.getTime() + after * 60_000),
        })
        .where(eq(revisionCards.id, cardId))
        .returning();
      return updated;
    });
    if (!result) return res.status(404).json({ error: 'Carte de révision introuvable.' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

studyRouter.get('/revisions/history', async (req, res, next) => {
  try {
    const history = await db
      .select({ review: revisionReviews, chapterTitle: chapters.title, courseTitle: courses.title })
      .from(revisionReviews)
      .innerJoin(revisionCards, eq(revisionReviews.cardId, revisionCards.id))
      .innerJoin(chapters, eq(revisionCards.chapterId, chapters.id))
      .innerJoin(courses, eq(chapters.courseId, courses.id))
      .where(eq(revisionReviews.userId, req.user!.id))
      .orderBy(desc(revisionReviews.reviewedAt))
      .limit(100);
    res.json(
      history.map((row) => ({
        ...row.review,
        chapterTitle: row.chapterTitle,
        courseTitle: row.courseTitle,
      })),
    );
  } catch (error) {
    next(error);
  }
});

// ── Examens: questions tirées du catalogue réel, corrigées et archivées serveur ─
const safeQuestion = (question: typeof examQuestions.$inferSelect, reveal = false) => ({
  id: question.id,
  position: question.position,
  prompt: question.prompt,
  options: question.options,
  selectedAnswer: question.selectedAnswer,
  ...(reveal
    ? {
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        isCorrect: question.isCorrect,
      }
    : {}),
});

studyRouter.get('/exams', async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(exams)
      .where(eq(exams.userId, req.user!.id))
      .orderBy(desc(exams.startedAt))
      .limit(100);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

studyRouter.post('/exams', async (req, res, next) => {
  try {
    const { chapterIds, questionCount, timeLimitMinutes } = z
      .object({
        chapterIds: z.array(z.number().int().positive()).min(1).optional(),
        questionCount: z.number().int().min(3).max(40).default(10),
        timeLimitMinutes: z.number().int().min(1).max(240).nullable().optional(),
      })
      .parse(req.body);
    const user = req.user!;
    if (!user.optionId)
      return res
        .status(400)
        .json({ error: 'Complétez d’abord votre filière et votre niveau dans votre cursus.' });
    const levelId = await resolveUserLevelId(user);
    const courseCriteria = levelId
      ? and(eq(courses.optionId, user.optionId), eq(courses.levelId, levelId))
      : eq(courses.optionId, user.optionId);
    const activeChapters = await db
      .select({ chapterId: chapters.id })
      .from(chapters)
      .innerJoin(courses, eq(chapters.courseId, courses.id))
      .leftJoin(
        unfollowedCourses,
        and(eq(unfollowedCourses.userId, user.id), eq(unfollowedCourses.courseId, courses.id)),
      )
      .where(and(courseCriteria, isNull(unfollowedCourses.courseId)));
    const activeIds = new Set(activeChapters.map((row) => row.chapterId));
    const selectedIds = chapterIds ?? [...activeIds];
    if (!selectedIds.length || selectedIds.some((id) => !activeIds.has(id)))
      return res
        .status(400)
        .json({ error: 'Sélectionnez des chapitres appartenant à votre cursus actif.' });
    const pool = await db
      .select({ exercise: exercises, chapterTitle: chapters.title })
      .from(exercises)
      .innerJoin(chapters, eq(exercises.chapterId, chapters.id))
      .where(inArray(exercises.chapterId, selectedIds));
    const valid = pool.filter(
      ({ exercise }) =>
        Array.isArray(exercise.options) &&
        exercise.options.length >= 2 &&
        exercise.options.includes(exercise.answer),
    );
    if (valid.length < 3)
      return res.status(422).json({
        error:
          'Il faut au moins 3 QCM réels avec une correction et des choix valides pour créer un examen.',
      });
    const shuffled = valid
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(questionCount, valid.length));
    const title =
      selectedIds.length === 1
        ? `Examen · ${shuffled[0].chapterTitle}`
        : `Examen blanc · ${new Date().toLocaleDateString('fr-FR')}`;
    const exam = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(exams)
        .values({
          userId: user.id,
          title,
          questionCount: shuffled.length,
          timeLimitMinutes: timeLimitMinutes ?? null,
        })
        .returning();
      const questions = await tx
        .insert(examQuestions)
        .values(
          shuffled.map(({ exercise }, position) => ({
            examId: created.id,
            exerciseId: exercise.id,
            chapterId: exercise.chapterId,
            position,
            prompt: exercise.question,
            options: exercise.options,
            correctAnswer: exercise.answer,
            explanation: exercise.explanation,
          })),
        )
        .returning();
      return { ...created, questions: questions.map((question) => safeQuestion(question)) };
    });
    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
});

studyRouter.get('/exams/:examId', async (req, res, next) => {
  try {
    const examId = z.coerce.number().int().positive().parse(req.params.examId);
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.userId, req.user!.id)))
      .limit(1);
    if (!exam) return res.status(404).json({ error: 'Examen introuvable.' });
    const questions = await db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
      .orderBy(asc(examQuestions.position));
    res.json({
      ...exam,
      questions: questions.map((question) => safeQuestion(question, exam.status === 'completed')),
    });
  } catch (error) {
    next(error);
  }
});

studyRouter.put('/exams/:examId/answers/:questionId', async (req, res, next) => {
  try {
    const examId = z.coerce.number().int().positive().parse(req.params.examId);
    const questionId = z.coerce.number().int().positive().parse(req.params.questionId);
    const { selectedAnswer } = z
      .object({ selectedAnswer: z.string().max(2000).nullable() })
      .parse(req.body);
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.userId, req.user!.id)))
      .limit(1);
    if (!exam || exam.status !== 'in_progress')
      return res.status(409).json({ error: 'Cet examen n’est plus modifiable.' });
    if (
      exam.timeLimitMinutes &&
      Date.now() > exam.startedAt.getTime() + exam.timeLimitMinutes * 60_000
    )
      return res.status(409).json({ error: 'Le temps imparti est écoulé.' });
    const [question] = await db
      .update(examQuestions)
      .set({ selectedAnswer })
      .where(and(eq(examQuestions.id, questionId), eq(examQuestions.examId, examId)))
      .returning({ id: examQuestions.id });
    if (!question) return res.status(404).json({ error: 'Question introuvable.' });
    res.json({ saved: true });
  } catch (error) {
    next(error);
  }
});

studyRouter.post('/exams/:examId/submit', async (req, res, next) => {
  try {
    const examId = z.coerce.number().int().positive().parse(req.params.examId);
    const result = await db.transaction(async (tx) => {
      const [exam] = await tx
        .select()
        .from(exams)
        .where(and(eq(exams.id, examId), eq(exams.userId, req.user!.id)))
        .limit(1);
      if (!exam) return { kind: 'missing' as const };
      if (exam.status === 'completed') return { kind: 'done' as const, exam };
      const questions = await tx
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.examId, examId))
        .orderBy(asc(examQuestions.position));
      const correctCount = questions.filter(
        (question) => question.selectedAnswer === question.correctAnswer,
      ).length;
      const scorePercent = Math.round((correctCount / questions.length) * 100);
      await tx
        .update(examQuestions)
        .set({ isCorrect: sql`${examQuestions.selectedAnswer} = ${examQuestions.correctAnswer}` })
        .where(eq(examQuestions.examId, examId));
      const answers = questions.filter((question) => question.exerciseId !== null);
      if (answers.length)
        await tx.insert(userAnswers).values(
          answers.map((question) => ({
            userId: req.user!.id,
            exerciseId: question.exerciseId!,
            isCorrect: question.selectedAnswer === question.correctAnswer,
            score: question.selectedAnswer === question.correctAnswer ? 10 : 0,
          })),
        );
      const [finished] = await tx
        .update(exams)
        .set({ status: 'completed', correctCount, scorePercent, finishedAt: new Date() })
        .where(eq(exams.id, examId))
        .returning();
      return {
        kind: 'done' as const,
        exam: finished,
        questions: questions.map((question) => ({
          ...question,
          isCorrect: question.selectedAnswer === question.correctAnswer,
        })),
      };
    });
    if (result.kind === 'missing') return res.status(404).json({ error: 'Examen introuvable.' });
    const questions =
      (result.kind === 'done' && 'questions' in result
        ? result.questions
        : await db
            .select()
            .from(examQuestions)
            .where(eq(examQuestions.examId, examId))
            .orderBy(asc(examQuestions.position))) ?? [];
    res.json({
      ...result.exam,
      questions: questions.map((question) => safeQuestion(question, true)),
    });
  } catch (error) {
    next(error);
  }
});
