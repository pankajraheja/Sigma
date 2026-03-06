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
import { chatRouter } from './chat.routes.js';
import { metadataTaxonomyRouter } from './metadata-taxonomy.routes.js';

export function registerRoutes(app: Express): void {
  const prefix = config.apiPrefix; // default: /api/catalog

  app.use(`${prefix}/health`, healthRouter);
  app.use(`${prefix}/assets`, assetsRouter);
  app.use(`${prefix}/search`, searchRouter);
  app.use(`${prefix}/taxonomy`, taxonomyRouter);
  app.use(`${prefix}/tags`, tagsRouter);
  app.use(`${prefix}/submissions`, submissionsRouter);

  // ── Sigma Chat — cross-module chat endpoint ────────────────────────────
  app.use('/api/chat', chatRouter);

  // ── Metadata Taxonomy (read-only, 4-table schema) ──────────────────────
  app.use('/api/metadata/taxonomy', metadataTaxonomyRouter);

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
  `POST /api/chat/query`,
  `GET  /api/chat/skills`,
  `GET  ${prefix}/health`,
  `GET  ${prefix}/assets`,
  `GET  ${prefix}/assets/:id`,
  `GET  ${prefix}/assets/:id/versions`,
  `GET  ${prefix}/assets/:id/source-refs`,
  `GET  ${prefix}/assets/:id/classifications`,
  `GET  ${prefix}/assets/:id/tags`,
  `GET  ${prefix}/assets/:id/similar`,
  `GET  ${prefix}/assets/:id/summary`,
  `GET  ${prefix}/assets/:id/recommendations`,
  `GET  ${prefix}/assets/:id/enrichment-suggestions`,
  `GET  ${prefix}/search`,
  `GET  ${prefix}/tags`,
  `GET  ${prefix}/taxonomy`,
  `GET  ${prefix}/taxonomy/schemes`,
  `GET  ${prefix}/taxonomy/concept-schemes`,
  `POST ${prefix}/taxonomy/concept-schemes`,
  `PTCH ${prefix}/taxonomy/concept-schemes/:code`,
  `GET  ${prefix}/taxonomy/terms/:id`,
  `POST ${prefix}/taxonomy/terms`,
  `PTCH ${prefix}/taxonomy/terms/:id`,
  `DEL  ${prefix}/taxonomy/terms/:id`,
  `GET  ${prefix}/submissions/:id/published-asset`,
  // metadata taxonomy (read-only)
  `GET  /api/metadata/taxonomy/schemes`,
  `GET  /api/metadata/taxonomy/schemes/:schemeKey`,
  `GET  /api/metadata/taxonomy/schemes/:schemeKey/buckets`,
  `GET  /api/metadata/taxonomy/schemes/:schemeKey/buckets/:bucketKey/terms`,
  `GET  /api/metadata/taxonomy/terms/search`,
];
