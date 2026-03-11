// ---------------------------------------------------------------------------
// /api/submissions — submission records (file-based Phase 1).
//
// Supports two source types:
//   - prototype-lab: exported prototypes with pages + brand config
//   - solutions-studio: SDLC pipeline run deliverables
//
// GET  /        — returns all records, newest first
// GET  /:id     — returns a single record by id
// POST /        — validates and appends a new record (source-aware)
// ---------------------------------------------------------------------------

import { Router } from 'express';
import {
  getSubmissions,
  getSubmission,
  addSubmission,
  type PrototypeSubmission,
  type StudioSubmission,
} from '../services/submission-store.js';

export const prototypeSubmissionsRouter = Router();

// ── GET / ────────────────────────────────────────────────────────────────────

prototypeSubmissionsRouter.get('/', async (_req, res) => {
  try {
    const records = await getSubmissions();
    res.json({ data: records, total: records.length });
  } catch (err) {
    console.error('[submissions] Read failed:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to read submissions.' });
  }
});

// ── GET /:id ─────────────────────────────────────────────────────────────────

prototypeSubmissionsRouter.get('/:id', async (req, res) => {
  try {
    const record = await getSubmission(req.params['id'] ?? '');
    if (!record) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Submission not found.' });
      return;
    }
    res.json({ data: record });
  } catch (err) {
    console.error('[submissions] Read failed:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to read submission.' });
  }
});

// ── POST / ───────────────────────────────────────────────────────────────────

prototypeSubmissionsRouter.post('/', async (req, res) => {
  const body = req.body as Record<string, unknown> | undefined;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Request body must be a JSON object.' });
    return;
  }

  const source = (body.source as string) ?? 'prototype-lab';

  // ── Solutions Studio submission ──
  if (source === 'solutions-studio') {
    const { id, runId, projectName, artifactCount, stageSummary, provider, readmeSummary } = body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: '"id" is required.' });
      return;
    }
    if (!runId || typeof runId !== 'string') {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: '"runId" is required for solutions-studio submissions.' });
      return;
    }
    if (!projectName || typeof projectName !== 'string') {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: '"projectName" is required for solutions-studio submissions.' });
      return;
    }
    if (typeof artifactCount !== 'number') {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: '"artifactCount" must be a number.' });
      return;
    }
    if (!Array.isArray(stageSummary)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: '"stageSummary" must be an array.' });
      return;
    }

    const record: StudioSubmission = {
      id: id as string,
      source: 'solutions-studio',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      readmeSummary: typeof readmeSummary === 'string' ? readmeSummary : '',
      runId: runId as string,
      projectName: projectName as string,
      artifactCount: artifactCount as number,
      stageSummary: stageSummary as StudioSubmission['stageSummary'],
      provider: (provider && typeof provider === 'object')
        ? provider as StudioSubmission['provider']
        : null,
    };

    try {
      await addSubmission(record);
      console.log(`[submissions] Saved studio handoff: ${id} (project: ${record.projectName}, ${record.artifactCount} artifacts)`);
      res.status(201).json({ data: record });
    } catch (err) {
      console.error('[submissions] Write failed:', err);
      res.status(500).json({ error: 'INTERNAL', message: 'Failed to save submission.' });
    }
    return;
  }

  // ── Prototype Lab submission (original flow) ──
  const { id, timestamp, pageCount, brandName, readmeSummary, routeList } = body;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: '"id" is required.' });
    return;
  }
  if (!timestamp || typeof timestamp !== 'string') {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: '"timestamp" is required.' });
    return;
  }
  if (typeof pageCount !== 'number' || pageCount < 1) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: '"pageCount" must be a positive number.' });
    return;
  }
  if (!brandName || typeof brandName !== 'string') {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: '"brandName" is required.' });
    return;
  }
  if (!Array.isArray(routeList)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: '"routeList" must be an array.' });
    return;
  }

  const record: PrototypeSubmission = {
    id: id as string,
    source: 'prototype-lab',
    timestamp: timestamp as string,
    pageCount: pageCount as number,
    brandName: brandName as string,
    readmeSummary: typeof readmeSummary === 'string' ? readmeSummary : '',
    routeList: routeList as string[],
    createdAt: new Date().toISOString(),
    pages: Array.isArray(body.pages) ? (body.pages as PrototypeSubmission['pages']) : undefined,
    brandConfig: (body.brandConfig && typeof body.brandConfig === 'object')
      ? (body.brandConfig as PrototypeSubmission['brandConfig'])
      : undefined,
  };

  try {
    await addSubmission(record);
    console.log(`[submissions] Saved: ${id} (${record.pageCount} pages, brand: ${brandName})`);
    res.status(201).json({ data: record });
  } catch (err) {
    console.error('[submissions] Write failed:', err);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to save submission.' });
  }
});
