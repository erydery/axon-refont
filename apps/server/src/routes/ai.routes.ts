import { Router } from 'express';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
export const aiRouter = Router();
aiRouter.use(requireAuth);
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const groqModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { messages, chapterTitle, chapterContent } = z
      .object({
        messages: z
          .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(8000) }))
          .max(30),
        chapterTitle: z.string(),
        chapterContent: z.unknown(),
      })
      .parse(req.body);
    if (!groq)
      return res
        .status(503)
        .json({ error: 'Assistant IA indisponible : configurez GROQ_API_KEY dans le serveur.' });
    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: 'system',
          content: `Tu es l'assistant pédagogique Axon. Aide l'étudiant sur le chapitre « ${chapterTitle} ». Contenu du chapitre : ${JSON.stringify(chapterContent).slice(0, 24000)}. Réponds de manière concise, précise et en Markdown.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });
    res.json({ content: completion.choices[0]?.message?.content ?? '' });
  } catch (error) {
    next(error);
  }
});
aiRouter.post('/answer', async (req, res, next) => {
  try {
    const { enonce, solution, userResponse } = z
      .object({
        enonce: z.string(),
        solution: z.string(),
        userResponse: z.string().min(1).max(10000),
      })
      .parse(req.body);
    if (!groq)
      return res
        .status(503)
        .json({ error: 'Correction IA indisponible : configurez GROQ_API_KEY dans le serveur.' });
    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: [
        {
          role: 'system',
          content:
            'Tu es Axon, un correcteur pédagogique. Compare la réponse avec la solution, donne une note sur 10 et un feedback motivant de 3 phrases maximum. Retourne un JSON avec note (nombre de 0 à 10) et feedback (texte). La note doit impérativement être numérique.',
        },
        {
          role: 'user',
          content: `Énoncé : ${enonce}\nSolution : ${solution}\nRéponse : ${userResponse}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const note = Number(result.note);
    if (!Number.isFinite(note))
      return res
        .status(502)
        .json({ error: 'Le correcteur IA a renvoyé une note non numérique. Réessayez.' });
    res.json({ note: Math.min(10, Math.max(0, note)), feedback: String(result.feedback ?? '') });
  } catch (error) {
    next(error);
  }
});
