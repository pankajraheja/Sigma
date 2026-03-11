// ---------------------------------------------------------------------------
// /api/submissions — prototype submission records (file-based Phase 1).
//
// GET  / — returns all records, newest first
// POST / — validates and appends a new record
// ---------------------------------------------------------------------------

import { Router } from 'express';
import {
  getSubmissions,
  getSubmission,
  addSubmission,
  type SubmissionRecord,
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

  const record: SubmissionRecord = {
    id,
    timestamp,
    pageCount: pageCount as number,
    brandName,
    readmeSummary: typeof readmeSummary === 'string' ? readmeSummary : '',
    routeList: routeList as string[],
    createdAt: new Date().toISOString(),
    pages: Array.isArray(body.pages) ? (body.pages as SubmissionRecord['pages']) : undefined,
    brandConfig: (body.brandConfig && typeof body.brandConfig === 'object')
      ? (body.brandConfig as SubmissionRecord['brandConfig'])
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
