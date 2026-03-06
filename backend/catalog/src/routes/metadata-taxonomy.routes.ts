// ---------------------------------------------------------------------------
// Metadata-Taxonomy Routes (read-only)
//
// Mounted at:  /api/metadata/taxonomy
//
//   GET  /schemes                                     — list all schemes
//   GET  /schemes/:schemeKey                          — full scheme + buckets + term tree
//   GET  /schemes/:schemeKey/buckets                  — buckets for a scheme
//   GET  /schemes/:schemeKey/buckets/:bucketKey/terms — terms (tree) for a bucket
//   GET  /terms/search?q=...&scheme=&bucket=&limit=   — search by label / alias
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { metadataTaxonomyService } from '../services/metadata-taxonomy.service.js';

export const metadataTaxonomyRouter = Router();

// ── GET /schemes ─────────────────────────────────────────────────────────────
metadataTaxonomyRouter.get(
  '/schemes',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await metadataTaxonomyService.listSchemes();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /schemes/:schemeKey ──────────────────────────────────────────────────
metadataTaxonomyRouter.get(
  '/schemes/:schemeKey',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const detail = await metadataTaxonomyService.getSchemeDetail(
        req.params['schemeKey']!,
      );
      if (!detail) {
        res
          .status(404)
          .json({ error: 'NOT_FOUND', message: 'Taxonomy scheme not found.' });
        return;
      }
      res.json({ data: detail });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /schemes/:schemeKey/buckets ──────────────────────────────────────────
metadataTaxonomyRouter.get(
  '/schemes/:schemeKey/buckets',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await metadataTaxonomyService.listBuckets(
        req.params['schemeKey']!,
      );
      if (!result) {
        res
          .status(404)
          .json({ error: 'NOT_FOUND', message: 'Taxonomy scheme not found.' });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /schemes/:schemeKey/buckets/:bucketKey/terms ─────────────────────────
metadataTaxonomyRouter.get(
  '/schemes/:schemeKey/buckets/:bucketKey/terms',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await metadataTaxonomyService.listTerms(
        req.params['schemeKey']!,
        req.params['bucketKey']!,
      );
      if (!result) {
        res
          .status(404)
          .json({
            error: 'NOT_FOUND',
            message: 'Scheme or bucket not found.',
          });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /terms/search?q=...&scheme=&bucket=&limit= ──────────────────────────
metadataTaxonomyRouter.get(
  '/terms/search',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = (req.query['q'] as string) ?? '';
      if (!q.trim()) {
        res.json({ data: [] });
        return;
      }
      const opts: { limit?: number; schemeKey?: string; bucketKey?: string } = {};
      if (req.query['scheme']) opts.schemeKey = req.query['scheme'] as string;
      if (req.query['bucket']) opts.bucketKey = req.query['bucket'] as string;
      if (req.query['limit'])  opts.limit = Math.min(Number(req.query['limit']), 200);

      const result = await metadataTaxonomyService.searchTerms(q, opts);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
