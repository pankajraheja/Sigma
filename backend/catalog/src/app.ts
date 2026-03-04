// ---------------------------------------------------------------------------
// Express app factory — separated from server start for testability
// ---------------------------------------------------------------------------

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { registerRoutes } from './routes/index.js';
import { initializeChatModule } from './services/chat/index.js';

export function createApp(): express.Express {
  const app = express();

  // ── Sigma Chat — register skills and grounding providers ────────────────
  initializeChatModule();

  // -------------------------------------------------------------------------
  // Security headers
  // -------------------------------------------------------------------------
  app.use(helmet());

  // -------------------------------------------------------------------------
  // CORS — allow configured origins (frontend Vite dev server by default)
  // -------------------------------------------------------------------------
  app.use(
    cors({
      origin: config.cors.origins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // -------------------------------------------------------------------------
  // Body parsing
  // -------------------------------------------------------------------------
  app.use(express.json());

  // -------------------------------------------------------------------------
  // Request logging
  // -------------------------------------------------------------------------
  if (config.env !== 'test') {
    app.use(requestLogger);
  }

  // -------------------------------------------------------------------------
  // Routes
  // -------------------------------------------------------------------------
  registerRoutes(app);

  // -------------------------------------------------------------------------
  // Error handler — must be last
  // -------------------------------------------------------------------------
  app.use(errorHandler);

  return app;
}
