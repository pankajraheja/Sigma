// ---------------------------------------------------------------------------
// GET /api/catalog/health
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await healthService.check();
    const httpStatus = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(httpStatus).json(health);
  } catch (err) {
    next(err);
  }
});
