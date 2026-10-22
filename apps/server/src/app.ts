import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { attachUser } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { catalogRouter } from './routes/catalog.routes.js';
import { learningRouter } from './routes/learning.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { studyRouter } from './routes/study.routes.js';
import { assistantRouter } from './routes/assistant.routes.js';

export function createApp() {
  const app = express();
  const origin = process.env.CLIENT_URL ?? 'http://localhost:5173';
  app.use(
    cors({ origin: [origin, 'http://localhost:5173', 'http://localhost:5174'], credentials: true }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(attachUser);
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/study', studyRouter);
  app.use('/api/assistant', assistantRouter);
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'axon-api' }));
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError)
      return res.status(400).json({ error: 'Données invalides', details: err.issues });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  });
  return app;
}
