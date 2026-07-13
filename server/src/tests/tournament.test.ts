import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDb } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';
import { TournamentService } from '../services/tournament.service.js';

describe('Tournament Service Suite', () => {
  beforeAll(() => {
    process.env.DB_PATH = ':memory:';
    const db = getDb();
    seedDatabase(db);
  });

  afterAll(() => {
    closeDb();
  });

  it('should return seeded World Cup matches and next match info', async () => {
    const db = getDb();
    const service = new TournamentService(db);
    const { matches, nextMatch } = await service.getMatches();

    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
    expect(nextMatch).toBeDefined();
    expect(nextMatch?.team1).toBeDefined();
    expect(nextMatch?.team2).toBeDefined();
  });
});
