// ---------------------------------------------------------------------------
// POST /api/chat/query — Sigma Chat endpoint
//
// Accepts a ChatQueryRequest, resolves the skill, retrieves grounding
// context, calls the LLM, and returns { answer, references, suggestions }.
// ---------------------------------------------------------------------------

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { handleChatQuery } from '../services/chat/chat.service.js';
import type { ChatQueryRequest } from '../models/chat.types.js';

export const chatRouter = Router();

chatRouter.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as ChatQueryRequest;

    // Basic validation
    if (!body.skillKey || !body.message || !body.context) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Request must include skillKey, message (string), and context.',
      });
      return;
    }

    const result = await handleChatQuery(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/skills — list registered skills (for debugging / admin)
chatRouter.get('/skills', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getAllChatSkills } = await import('../services/chat/skill.registry.js');
    const skills = getAllChatSkills();
    res.json({ data: skills, total: skills.length });
  } catch (err) {
    next(err);
  }
});
