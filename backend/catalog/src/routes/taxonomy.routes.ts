// ---------------------------------------------------------------------------
// Taxonomy and tag routes
//   GET /api/catalog/taxonomy            — list all terms (optional ?scheme=)
//   GET /api/catalog/taxonomy/schemes    — list all distinct schemes
//   GET /api/catalog/tags                — list tags with ?q= search
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { taxonomyService } from '../services/taxonomy.service.js';
import type { TaxonomyQuery, TagListQuery } from '../models/api.types.js';

export const taxonomyRouter = Router();
export const tagsRouter = Router();

// GET /api/catalog/taxonomy/schemes  (register before /:scheme to avoid capture)
taxonomyRouter.get('/schemes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await taxonomyService.listSchemes();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/catalog/taxonomy  (with optional ?scheme=asset_kind&include_inactive=true)
taxonomyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: TaxonomyQuery = {
      scheme: req.query['scheme'] as string | undefined,
      include_inactive: req.query['include_inactive'] === 'true',
    };
    const result = await taxonomyService.listTerms(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/catalog/tags
tagsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: Partial<TagListQuery> = {
      q: req.query['q'] as string | undefined,
      page: req.query['page'] !== undefined ? Number(req.query['page']) : undefined,
      pageSize: req.query['pageSize'] !== undefined ? Number(req.query['pageSize']) : undefined,
    };
    const result = await taxonomyService.listTags(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
