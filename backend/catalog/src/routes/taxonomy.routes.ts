// ---------------------------------------------------------------------------
// Taxonomy and tag routes
//   GET    /api/catalog/taxonomy            — list all terms (optional ?scheme=)
//   GET    /api/catalog/taxonomy/schemes    — list all concept schemes (full)
//   GET    /api/catalog/taxonomy/terms/:id  — get single term
//   POST   /api/catalog/taxonomy/terms      — create a term
//   PATCH  /api/catalog/taxonomy/terms/:id  — update a term
//   DELETE /api/catalog/taxonomy/terms/:id  — delete a term
//   GET    /api/catalog/taxonomy/concept-schemes        — list concept scheme registry
//   POST   /api/catalog/taxonomy/concept-schemes        — create concept scheme
//   PATCH  /api/catalog/taxonomy/concept-schemes/:code  — update concept scheme
//   GET    /api/catalog/tags                — list tags with ?q= search
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { taxonomyService } from '../services/taxonomy.service.js';
import type { TaxonomyQuery, TagListQuery } from '../models/api.types.js';

export const taxonomyRouter = Router();
export const tagsRouter = Router();

// ── Concept Schemes ──────────────────────────────────────────────────────────

// GET /api/catalog/taxonomy/schemes  (legacy — string[])
taxonomyRouter.get('/schemes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await taxonomyService.listSchemes();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/catalog/taxonomy/concept-schemes  (full registry)
taxonomyRouter.get('/concept-schemes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await taxonomyService.listConceptSchemes();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/catalog/taxonomy/concept-schemes
taxonomyRouter.post('/concept-schemes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, label, description, is_hierarchical, is_locked, sort_order } = req.body;
    if (!code || !label) {
      res.status(400).json({ error: 'VALIDATION', message: 'code and label are required.' });
      return;
    }
    const scheme = await taxonomyService.createConceptScheme({
      code, label, description, is_hierarchical, is_locked, sort_order,
    });
    res.status(201).json({ data: scheme });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/catalog/taxonomy/concept-schemes/:code
taxonomyRouter.patch('/concept-schemes/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await taxonomyService.updateConceptScheme(req.params['code'], req.body);
    if (!updated) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Concept scheme not found.' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ── Taxonomy Terms ───────────────────────────────────────────────────────────

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

// GET /api/catalog/taxonomy/terms/:id
taxonomyRouter.get('/terms/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const term = await taxonomyService.getTerm(req.params['id']);
    if (!term) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Taxonomy term not found.' });
      return;
    }
    res.json({ data: term });
  } catch (err) {
    next(err);
  }
});

// POST /api/catalog/taxonomy/terms
taxonomyRouter.post('/terms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scheme_code, code, label, description, parent_term_id, sort_order } = req.body;
    if (!scheme_code || !code || !label) {
      res.status(400).json({ error: 'VALIDATION', message: 'scheme_code, code, and label are required.' });
      return;
    }
    const term = await taxonomyService.createTerm({
      scheme_code, code, label, description, parent_term_id, sort_order,
    });
    res.status(201).json({ data: term });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/catalog/taxonomy/terms/:id
taxonomyRouter.patch('/terms/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await taxonomyService.updateTerm(req.params['id'], req.body);
    if (!updated) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Taxonomy term not found.' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/catalog/taxonomy/terms/:id
taxonomyRouter.delete('/terms/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await taxonomyService.deleteTerm(req.params['id']);
    if (!deleted) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Taxonomy term not found.' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── Tags ─────────────────────────────────────────────────────────────────────

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
