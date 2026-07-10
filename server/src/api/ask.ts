/**
 * @module api/ask
 * @description Fan/Volunteer AI chat endpoint.
 *
 * `POST /api/ask` accepts a user message with role and language context,
 * validates the input with Zod, and delegates to the AI orchestration
 * layer ({@link handleAskRequest}). Rate-limited to prevent abuse.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { handleAskRequest } from '../ai/gemini.js';
import { askRequestSchema } from './validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * `POST /` — Process a user chat message through the AI pipeline.
 *
 * Validates the request body against {@link askRequestSchema}, then
 * forwards the sanitized message to the Gemini/MockLLM handler.
 * Returns a JSON response with AI-generated text, structured UI card,
 * and a list of deterministic tools that were invoked.
 */
router.post('/', rateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = askRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const { role, message, language, imageBase64, sessionId: _sessionId } = parsed.data;
    const db = getDb();

    const response = await handleAskRequest(db, role, message, language, imageBase64);

    res.json(response);
  } catch (error) {
    logger.error('Error in /api/ask', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
