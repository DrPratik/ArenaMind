/**
 * @module api/organizer
 * @description Organizer operations center endpoints.
 *
 * Provides analytical AI query execution (`GET /api/organizer/query`) and
 * automated briefing generation (`GET /api/organizer/briefing`) for stadium
 * operations managers.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { handleAskRequest } from '../ai/gemini.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * `GET /query` — Execute a natural-language operational query.
 */
router.get('/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q;
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Missing or invalid query parameter "q"' });
      return;
    }

    if (query.length > 500) {
      res.status(400).json({ error: 'Query too long. Maximum 500 characters.' });
      return;
    }

    const db = getDb();
    const response = await handleAskRequest(db, 'organizer', query, 'en');

    res.json({
      text: response.text,
      recommendation: response.text,
      reasoning: response.structuredCard?.data?.reasoning ?? '',
      data: response.structuredCard?.data ?? {},
      toolsUsed: response.toolsUsed,
    });
  } catch (error) {
    logger.error('Error in GET /api/organizer/query', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * `GET /briefing` — Generate an automated operational briefing.
 */
router.get('/briefing', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const response = await handleAskRequest(
      db,
      'organizer',
      'Give me a brief operational summary of the current stadium state. Include crowd levels, any active incidents, and key recommendations.',
      'en',
    );

    res.json({
      briefing: response.text,
      toolsUsed: response.toolsUsed,
    });
  } catch (error) {
    logger.error('Error in GET /api/organizer/briefing', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
