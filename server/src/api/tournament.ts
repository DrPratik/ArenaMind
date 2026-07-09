import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { TournamentService } from '../services/tournament.service.js';

const router = Router();

/**
 * GET /api/tournament
 * Clean controller: delegates all business logic to the TournamentService.
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
    console.error('Error in GET /api/tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
