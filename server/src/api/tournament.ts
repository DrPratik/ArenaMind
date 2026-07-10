/**
 * @module api/tournament
 * @description Tournament match schedule and real-time score endpoints.
 *
 * `GET /api/tournament` retrieves the FIFA World Cup 2026 match schedule
 * and live scores via {@link TournamentService}.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { TournamentService } from '../services/tournament.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * `GET /` — Fetch tournament match fixtures and active live scores.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const tournamentService = new TournamentService(db);

    const { matches, nextMatch } = await tournamentService.getMatches();

    res.json({
      matches,
      nextMatch,
      venue: 'New York New Jersey Stadium',
      totalMatches: matches.length,
    });
  } catch (error) {
    logger.error('Error in GET /api/tournament', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
