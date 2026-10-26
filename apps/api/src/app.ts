import cors from 'cors';
import express from 'express';
import type { HealthDTO } from '@muskai/shared';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './routes/auth.routes';
import { generationsRouter } from './routes/generations.routes';
import { modelsRouter } from './routes/models.routes';
import { reelsRouter, usersRouter } from './routes/reels.routes';
import { hasFfmpeg } from './services/stitch.service';

export function createApp(): express.Express {
  const app = express();

  // Credentials (the session cookie) require an explicit origin — never '*'.
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / curl requests have no Origin header.
        if (!origin || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  // Liveness — deliberately does not touch the DB or DashScope, and reports
  // key *presence* only (never the key itself).
  app.get('/health', async (_req, res) => {
    const body: HealthDTO = {
      status: 'ok',
      dashscopeKeyConfigured: config.hasDashscopeKey,
      ffmpegAvailable: await hasFfmpeg(),
    };
    res.json(body);
  });

  app.use('/api/auth', authRouter);
  app.use('/api/generations', generationsRouter);
  app.use('/api/models', modelsRouter);
  app.use('/api/reels', reelsRouter);
  app.use('/api/users', usersRouter);

  // Generated media. Files live under storage/<generationId>/…
  app.use('/files', express.static(config.storageDir, { fallthrough: false }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
