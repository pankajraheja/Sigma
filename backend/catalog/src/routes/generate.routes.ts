// ---------------------------------------------------------------------------
// POST /api/generate — model-agnostic HTML generation endpoint.
//
// Accepts prompt + brandConfig, returns raw HTML. The route knows nothing
// about which LLM provider is active — that is handled by generate.service.
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { generateHtml, type GenerateRequest } from '../services/generate.service.js';

export const generateRouter = Router();

// ── Validation helper ────────────────────────────────────────────────────────

function validateBody(body: unknown): { ok: true; data: GenerateRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const b = body as Record<string, unknown>;

  if (!b.prompt || typeof b.prompt !== 'string' || b.prompt.trim().length === 0) {
    return { ok: false, error: '"prompt" is required and must be a non-empty string.' };
  }

  if (!b.brandConfig || typeof b.brandConfig !== 'object') {
    return { ok: false, error: '"brandConfig" is required and must be an object.' };
  }

  const bc = b.brandConfig as Record<string, unknown>;

  // Validate essential nested shapes exist
  for (const key of ['colors', 'typography', 'borderRadius', 'spacing'] as const) {
    if (!bc[key] || typeof bc[key] !== 'object') {
      return { ok: false, error: `"brandConfig.${key}" is required and must be an object.` };
    }
  }

  if (typeof bc.companyName !== 'string') {
    return { ok: false, error: '"brandConfig.companyName" is required.' };
  }

  if (typeof bc.buttonStyle !== 'string' || !['pill', 'rounded', 'square'].includes(bc.buttonStyle)) {
    return { ok: false, error: '"brandConfig.buttonStyle" must be "pill", "rounded", or "square".' };
  }

  // Optional fields
  if (b.conversationHistory !== undefined && !Array.isArray(b.conversationHistory)) {
    return { ok: false, error: '"conversationHistory" must be an array if provided.' };
  }

  if (b.currentPageCode !== undefined && typeof b.currentPageCode !== 'string') {
    return { ok: false, error: '"currentPageCode" must be a string if provided.' };
  }

  if (b.allowedBlockIds !== undefined && b.allowedBlockIds !== null && !Array.isArray(b.allowedBlockIds)) {
    return { ok: false, error: '"allowedBlockIds" must be an array of strings or null if provided.' };
  }

  return { ok: true, data: b as unknown as GenerateRequest };
}

// ── POST / ───────────────────────────────────────────────────────────────────

generateRouter.post('/', async (req, res) => {
  const validation = validateBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: validation.error });
    return;
  }

  try {
    const result = await generateHtml(validation.data);
    const body: Record<string, unknown> = {
      html: result.html,
      brandValidation: result.brandValidation,
    };
    if (result.pages) {
      body.pages = result.pages;
    }
    res.status(200).json(body);
  } catch (err) {
    console.error('[generate] Generation failed:', err);
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: 'HTML generation failed. Please try again.',
    });
  }
});
