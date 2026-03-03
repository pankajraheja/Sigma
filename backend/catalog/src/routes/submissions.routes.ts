// ---------------------------------------------------------------------------
// GET /api/catalog/submissions/:id/published-asset
//
// Cross-module lookup: given a governance submission ID, return the catalog
// asset that was promoted from that submission.
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { publicationService } from '../services/publication.service.js';

export const submissionsRouter = Router();

submissionsRouter.get(
  '/:id/published-asset',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await publicationService.getPublishedAssetForSubmission(
        req.params['id'] ?? '',
      );
      res.json({ data: asset });
    } catch (err) {
      next(err);
    }
  },
);
