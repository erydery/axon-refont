import { Router } from 'express';
import { and, asc, desc, eq } from 'drizzle-orm';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { db } from '../db/client.js';
import {
  assistantConversations,
  assistantMessages,
  chapters,
  courses,
  userProgress,
} from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveUserLevelId } from '../lib/course-access.js';
import { canAccessChapter } from './study.routes.js';

export const assistantRouter = Router();
assistantRouter.use(requireAuth);
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const groqModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

assistantRouter.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await db
      .select()
      .from(assistantConversations)
      .where(eq(assistantConversations.userId, req.user!.id))
      .orderBy(desc(assistantConversations.updatedAt))
      .limit(50);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

assistantRouter.post('/conversations', async (req, res, next) => {
  try {
    const { chapterId, title } = z
      .object({
        chapterId: z.number().int().positive().nullable().optional(),
        title: z.string().trim().min(1).max(180).optional(),
      })
      .parse(req.body);
    if (chapterId && !(await canAccessChapter(req.user!.id, chapterId)))
      return res
        .status(403)
        .json({ error: 'Ce chapitre ne fait pas partie de votre cursus actif.' });
    const [conversation] = await db
      .insert(assistantConversations)
      .values({
        userId: req.user!.id,
        chapterId: chapterId ?? null,
        title: title ?? 'Nouvelle conversation',
      })
      .returning();
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

assistantRouter.get('/conversations/:conversationId', async (req, res, next) => {
  try {
    const conversationId = z.coerce.number().int().positive().parse(req.params.conversationId);
    const [conversation] = await db
      .select()
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.id, conversationId),
          eq(assistantConversations.userId, req.user!.id),
        ),
      )
      .limit(1);
    if (!conversation) return res.status(404).json({ error: 'Conversation introuvable.' });
    const messages = await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, conversationId))
      .orderBy(asc(assistantMessages.createdAt))
      .limit(200);
    res.json({ ...conversation, messages });
  } catch (error) {
    next(error);
  }
});

assistantRouter.post('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const conversationId = z.coerce.number().int().positive().parse(req.params.conversationId);
    const { content } = z.object({ content: z.string().trim().min(1).max(8000) }).parse(req.body);
    const [conversation] = await db
      .select()
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.id, conversationId),
          eq(assistantConversations.userId, req.user!.id),
        ),
      )
      .limit(1);
    if (!conversation) return res.status(404).json({ error: 'Conversation introuvable.' });
    if (!groq)
      return res
        .status(503)
        .json({ error: 'Assistant IA indisponible : configurez GROQ_API_KEY côté serveur.' });

    const previous = await db
      .select({ role: assistantMessages.role, content: assistantMessages.content })
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, conversationId))
      .orderBy(desc(assistantMessages.createdAt))
      .limit(18);
    const history = previous
      .reverse()
      .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

    let context =
      'Aucun chapitre précis n’est sélectionné. Réponds aux questions d’apprentissage de façon rigoureuse et indique quand une réponse ne peut pas être confirmée.';
    if (conversation.chapterId) {
      const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, conversation.chapterId),
        with: { course: true },
      });
      if (chapter && (await canAccessChapter(req.user!.id, chapter.id)))
        context = `Chapitre : ${chapter.title}. Cours : ${chapter.course?.title ?? 'Cours AXON'}. Contenu source : ${chapter.content.slice(0, 18000)}`;
    } else {
      const profile = req.user!;
      const levelId = await resolveUserLevelId(profile);
      const courseFilter =
        profile.optionId === null
          ? undefined
          : levelId
            ? and(eq(courses.optionId, profile.optionId), eq(courses.levelId, levelId))
            : eq(courses.optionId, profile.optionId);
      const courseRows = courseFilter
        ? await db.query.courses.findMany({ where: courseFilter, with: { chapters: true } })
        : [];
      const completed = await db
        .select({ chapterId: userProgress.chapterId })
        .from(userProgress)
        .where(and(eq(userProgress.userId, profile.id), eq(userProgress.isCompleted, true)));
      const completedIds = new Set(completed.map((row) => row.chapterId));
      const catalog = courseRows.flatMap((course) =>
        course.chapters.map(
          (chapter) =>
            `${course.title} — ${chapter.title}${completedIds.has(chapter.id) ? ' (terminé)' : ''}`,
        ),
      );
      context = `L’étudiant suit ces cours AXON : ${catalog.slice(0, 100).join('; ') || 'aucun cours configuré'}. N’invente pas le contenu détaillé d’un cours qui n’est pas fourni.`;
    }

    const [userMessage] = await db
      .insert(assistantMessages)
      .values({ conversationId, role: 'user', content })
      .returning();
    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: 'system',
          content: `Tu es Axon, le tuteur pédagogique de la plateforme AXON. Réponds en français, avec une explication claire, exacte et structurée en Markdown. Utilise seulement les sources disponibles et distingue les faits des conseils. Si la question concerne une correction, explique le raisonnement sans donner de fausse certitude. Contexte : ${context}`,
        },
        ...history,
        { role: 'user', content },
      ],
      temperature: 0.45,
      max_tokens: 1200,
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply)
      return res
        .status(502)
        .json({ error: 'Axon n’a pas reçu de réponse exploitable. Réessayez.' });
    const [assistantMessage] = await db
      .insert(assistantMessages)
      .values({ conversationId, role: 'assistant', content: reply })
      .returning();
    const title =
      conversation.title === 'Nouvelle conversation' ? content.slice(0, 72) : conversation.title;
    await db
      .update(assistantConversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(assistantConversations.id, conversationId));
    res.status(201).json({ userMessage, assistantMessage, title });
  } catch (error) {
    next(error);
  }
});

assistantRouter.delete('/conversations/:conversationId', async (req, res, next) => {
  try {
    const conversationId = z.coerce.number().int().positive().parse(req.params.conversationId);
    const [deleted] = await db
      .delete(assistantConversations)
      .where(
        and(
          eq(assistantConversations.id, conversationId),
          eq(assistantConversations.userId, req.user!.id),
        ),
      )
      .returning({ id: assistantConversations.id });
    if (!deleted) return res.status(404).json({ error: 'Conversation introuvable.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
