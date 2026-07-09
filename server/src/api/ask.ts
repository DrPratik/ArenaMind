import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { handleAskRequest } from '../ai/gemini.js';
import { askRequestSchema } from './validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

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
    console.error('Error in /api/ask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
