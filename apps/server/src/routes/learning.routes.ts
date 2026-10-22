import { Router } from 'express';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import {
  chapters,
  courses,
  options,
  unfollowedCourses,
  userAnswers,
  userProgress,
  users,
} from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveUserLevelId } from '../lib/course-access.js';
export const learningRouter = Router();
learningRouter.use(requireAuth);
learningRouter.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const user = req.user!;
    const hidden = await db
      .select({ courseId: unfollowedCourses.courseId })
      .from(unfollowedCourses)
      .where(eq(unfollowedCourses.userId, userId));
    const hiddenIds = hidden.map((row) => row.courseId);
    const answerRows = await db.select().from(userAnswers).where(eq(userAnswers.userId, userId));
    const progressRows = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    const levelId = await resolveUserLevelId(user);
    const courseFilter =
      user.optionId === null
        ? undefined
        : levelId
          ? and(eq(courses.optionId, user.optionId), eq(courses.levelId, levelId))
          : eq(courses.optionId, user.optionId);
    const allCourses = courseFilter
      ? await db.query.courses.findMany({
          where: courseFilter,
          with: { chapters: { orderBy: asc(chapters.order) } },
        })
      : [];
    const visibleCourses = allCourses.filter((course) => !hiddenIds.includes(course.id));
    const progressByChapter = new Map(progressRows.map((item) => [item.chapterId, item]));
    const coursesWithProgress = visibleCourses.map((course) => ({
      ...course,
      chapters: course.chapters.map((chapter) => ({
        ...chapter,
        isCompleted: progressByChapter.get(chapter.id)?.isCompleted ?? false,
      })),
    }));
    const [option] = user.optionId
      ? await db.select().from(options).where(eq(options.id, user.optionId)).limit(1)
      : [];
    res.json({
      user,
      option: option ?? null,
      courses: coursesWithProgress,
      answers: answerRows,
      progress: progressRows,
    });
  } catch (error) {
    next(error);
  }
});
learningRouter.put('/onboarding', async (req, res, next) => {
  try {
    const data = z
      .object({
        optionId: z.number().int().positive(),
        levelId: z.number().int().positive(),
        selectedCourseIds: z.array(z.number().int().positive()).min(1),
      })
      .parse(req.body);
    const userId = req.user!.id;
    const available = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.optionId, data.optionId), eq(courses.levelId, data.levelId)));
    if (!available.length)
      return res
        .status(400)
        .json({ error: 'Aucun cours disponible pour cette filière et ce niveau.' });
    const validIds = new Set(available.map((row) => row.id));
    if (data.selectedCourseIds.some((id) => !validIds.has(id)))
      return res.status(400).json({ error: 'Sélection de cours invalide.' });
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          optionId: data.optionId,
          levelId: String(data.levelId),
          hasOnboarded: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      await tx.delete(unfollowedCourses).where(eq(unfollowedCourses.userId, userId));
      const hiddenIds = available
        .filter((row) => !data.selectedCourseIds.includes(row.id))
        .map((row) => row.id);
      if (hiddenIds.length)
        await tx
          .insert(unfollowedCourses)
          .values(hiddenIds.map((courseId) => ({ userId, courseId })));
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
learningRouter.post('/courses/:courseId/follow', async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) return res.status(404).json({ error: 'Cours introuvable.' });
    await db
      .delete(unfollowedCourses)
      .where(
        and(eq(unfollowedCourses.userId, req.user!.id), eq(unfollowedCourses.courseId, courseId)),
      );
    await db
      .update(users)
      .set({
        optionId: course.optionId,
        levelId: course.levelId === null ? null : String(course.levelId),
        hasOnboarded: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
learningRouter.delete('/courses/:courseId/follow', async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = req.user!.id;
    await db.insert(unfollowedCourses).values({ userId, courseId }).onConflictDoNothing();
    const chapterIds = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.courseId, courseId));
    if (chapterIds.length)
      await db.delete(userProgress).where(
        and(
          eq(userProgress.userId, userId),
          inArray(
            userProgress.chapterId,
            chapterIds.map((row) => row.id),
          ),
        ),
      );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
learningRouter.get('/courses/:courseId/chapters/:chapterId', async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const chapterId = Number(req.params.chapterId);
    const chapter = await db.query.chapters.findFirst({
      where: and(eq(chapters.id, chapterId), eq(chapters.courseId, courseId)),
      with: { course: { with: { chapters: { orderBy: asc(chapters.order) } } }, exercises: true },
    });
    if (!chapter) return res.status(404).json({ error: 'Chapitre introuvable.' });
    let content: Record<string, any> = {};
    try {
      content = JSON.parse(chapter.content || '{}');
    } catch {
      content = {};
    }
    res.json({ ...chapter, content, chapters: chapter.course?.chapters ?? [] });
  } catch (error) {
    next(error);
  }
});
learningRouter.post('/chapters/:chapterId/complete', async (req, res, next) => {
  try {
    const chapterId = Number(req.params.chapterId);
    const userId = req.user!.id;
    const [chapter] = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);
    if (!chapter) return res.status(404).json({ error: 'Chapitre introuvable.' });
    const results = z
      .array(
        z.object({ exerciseId: z.number().int().positive().optional(), isCorrect: z.boolean() }),
      )
      .default([])
      .parse(req.body.results ?? []);
    const storedResults = results.filter(
      (result): result is { exerciseId: number; isCorrect: boolean } => Boolean(result.exerciseId),
    );
    await db.transaction(async (tx) => {
      if (storedResults.length)
        await tx.insert(userAnswers).values(
          storedResults.map((row) => ({
            userId,
            exerciseId: row.exerciseId,
            isCorrect: row.isCorrect,
            score: row.isCorrect ? 10 : 0,
          })),
        );
      await tx
        .insert(userProgress)
        .values({ userId, chapterId, isCompleted: true, completedAt: new Date() })
        .onConflictDoUpdate({
          target: [userProgress.userId, userProgress.chapterId],
          set: { isCompleted: true, completedAt: new Date() },
        });
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
