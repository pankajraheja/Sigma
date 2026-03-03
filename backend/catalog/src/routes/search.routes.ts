// ---------------------------------------------------------------------------
// GET /api/catalog/search
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { discoveryService } from '../services/discovery.service.js';
import { ValidationError } from '../services/asset.service.js';
import type { SearchQuery } from '../models/api.types.js';

export const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query['q'];
    if (typeof q !== 'string' || q.trim().length === 0) {
      throw new ValidationError('Query param `q` is required and must be non-empty.');
    }

    const query: Partial<SearchQuery> & { q: string } = {
      q,
      publication_status: req.query['publication_status'] as SearchQuery['publication_status'],
      asset_kind: req.query['asset_kind'] as string | undefined,
      compliance_tag: req.query['compliance_tag'] as string | undefined,
      page: req.query['page'] !== undefined ? Number(req.query['page']) : undefined,
      pageSize: req.query['pageSize'] !== undefined ? Number(req.query['pageSize']) : undefined,
    };

    const result = await discoveryService.search(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
