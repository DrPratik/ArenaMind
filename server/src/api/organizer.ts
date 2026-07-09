import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { handleAskRequest } from '../ai/gemini.js';

const router = Router();

/**
 * GET /api/organizer/query — natural-language query endpoint for organizers.
 * Routes through the same AI handler with role='organizer' for analytical responses.
 */
router.get('/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q;
    if (typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Missing or invalid query parameter "q"' });
      return;
    }
    
    // Defensive programming: prevent overly long queries (Denial of Service mitigation)
    if (query.length > 500) {
      res.status(400).json({ error: 'Query too long. Maximum 500 characters.' });
      return;
    }

    const db = getDb();
    const response = await handleAskRequest(db, 'organizer', query, 'en');

    res.json({
      text: response.text,
      recommendation: response.text, // The organizer prompt forces recommendations
      reasoning: response.structuredCard?.data?.reasoning ?? '',
      data: response.structuredCard?.data ?? {},
      toolsUsed: response.toolsUsed,
    });
  } catch (error) {
    console.error('Error in GET /api/organizer/query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/organizer/briefing — AI-generated ops briefing card.
 * Summarizes current stadium state in plain English.
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
    console.error('Error in GET /api/organizer/briefing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
