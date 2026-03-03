// ---------------------------------------------------------------------------
// Route registration — mounts all route groups under the API prefix
// ---------------------------------------------------------------------------

import type { Express } from 'express';
import { config } from '../config/index.js';
import { healthRouter } from './health.routes.js';
import { assetsRouter } from './assets.routes.js';
import { searchRouter } from './search.routes.js';
import { taxonomyRouter, tagsRouter } from './taxonomy.routes.js';
import { submissionsRouter } from './submissions.routes.js';

export function registerRoutes(app: Express): void {
  const prefix = config.apiPrefix; // default: /api/catalog

  app.use(`${prefix}/health`, healthRouter);
  app.use(`${prefix}/assets`, assetsRouter);
  app.use(`${prefix}/search`, searchRouter);
  app.use(`${prefix}/taxonomy`, taxonomyRouter);
  app.use(`${prefix}/tags`, tagsRouter);
  app.use(`${prefix}/submissions`, submissionsRouter);

  // 404 for any unmatched route under the prefix
  app.use(`${prefix}/*`, (_req, res) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'The requested catalog endpoint does not exist.',
      statusCode: 404,
    });
  });
}

// ---------------------------------------------------------------------------
// Route summary (for documentation / startup log)
// ---------------------------------------------------------------------------

export const routeSummary = (prefix: string) => [
  `GET  ${prefix}/health`,
  `GET  ${prefix}/assets`,
  `GET  ${prefix}/assets/:id`,
  `GET  ${prefix}/assets/:id/versions`,
  `GET  ${prefix}/assets/:id/source-refs`,
  `GET  ${prefix}/assets/:id/classifications`,
  `GET  ${prefix}/assets/:id/tags`,
  `GET  ${prefix}/search`,
  `GET  ${prefix}/tags`,
  `GET  ${prefix}/taxonomy`,
  `GET  ${prefix}/taxonomy/schemes`,
  `GET  ${prefix}/submissions/:id/published-asset`,
];
