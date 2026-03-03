// ---------------------------------------------------------------------------
// Asset routes
//   GET /api/catalog/assets
//   GET /api/catalog/assets/:id
//   GET /api/catalog/assets/:id/versions
//   GET /api/catalog/assets/:id/source-refs
//   GET /api/catalog/assets/:id/classifications
//   GET /api/catalog/assets/:id/tags
//   GET /api/catalog/assets/:id/similar
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service.js';
import { discoveryService } from '../services/discovery.service.js';
import { aiService } from '../services/ai.service.js';
import type { AssetListQuery } from '../models/api.types.js';

export const assetsRouter = Router();

// GET /api/catalog/assets
assetsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: Partial<AssetListQuery> = {
      publication_status: req.query['publication_status'] as AssetListQuery['publication_status'],
      asset_kind: req.query['asset_kind'] as string | undefined,
      compliance_tag: req.query['compliance_tag'] as string | undefined,
      domain: req.query['domain'] as string | undefined,
      primary_country_id: req.query['primary_country_id'] as string | undefined,
      opco_id: req.query['opco_id'] as string | undefined,
      function_group_id: req.query['function_group_id'] as string | undefined,
      industry_sector_id: req.query['industry_sector_id'] as string | undefined,
      service_offering_id: req.query['service_offering_id'] as string | undefined,
      page: req.query['page'] !== undefined ? Number(req.query['page']) : undefined,
      pageSize: req.query['pageSize'] !== undefined ? Number(req.query['pageSize']) : undefined,
      sort: req.query['sort'] as AssetListQuery['sort'],
      order: req.query['order'] as AssetListQuery['order'],
    };
    const result = await assetService.list(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/catalog/assets/:id  →  { asset, sourceRef }
assetsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await assetService.getById(req.params['id'] ?? '');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/catalog/assets/:id/versions
assetsRouter.get(
  '/:id/versions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const versions = await assetService.getVersions(req.params['id'] ?? '');
      res.json({ data: versions });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/source-refs
assetsRouter.get(
  '/:id/source-refs',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refs = await assetService.getSourceRefs(req.params['id'] ?? '');
      res.json({ data: refs });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/classifications
assetsRouter.get(
  '/:id/classifications',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classifications = await assetService.getClassifications(req.params['id'] ?? '');
      res.json({ data: classifications });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/tags
assetsRouter.get(
  '/:id/tags',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await assetService.getAssetTags(req.params['id'] ?? '');
      res.json({ data: tags });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/similar
// Returns up to `limit` (default 5, max 20) similar discoverable assets,
// ranked by shared taxonomy/tag/org signals.
// TODO (Phase 2): replace heuristic ranking with pgvector cosine similarity.
assetsRouter.get(
  '/:id/similar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : 5;
      const result = await discoveryService.getSimilar(req.params['id'] ?? '', limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/summary
assetsRouter.get(
  '/:id/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await aiService.getSummary(req.params['id'] ?? ''));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/recommendations
assetsRouter.get(
  '/:id/recommendations',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : 5;
      res.json(await aiService.getRecommendations(req.params['id'] ?? '', limit));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/catalog/assets/:id/enrichment-suggestions
assetsRouter.get(
  '/:id/enrichment-suggestions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await aiService.getEnrichmentSuggestions(req.params['id'] ?? ''));
    } catch (err) {
      next(err);
    }
  },
);
