/**
 * @module services/tournament
 * @description Tournament match schedule and live score synchronization service.
 *
 * Implements a write-through database cache backed by SQLite (`tournament_cache`).
 * When an API key is present (`FOOTBALL_DATA_API_KEY`), live match scores are
 * polled at most once every 15 minutes. Otherwise, the offline seed fixtures
 * are served seamlessly.
 */

import type { DatabaseSync } from 'node:sqlite';
import type { TournamentMatch } from '../types.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const FOOTBALL_DATA_URL = 'https://api.football-data.org/v4/competitions/WC/matches';

let lastFetch = 0;
const FETCH_INTERVAL = 15 * 60 * 1000; // 15 minutes

interface ExternalTeam {
  name?: string;
}

interface ExternalScore {
  fullTime?: {
    home?: number | null;
    away?: number | null;
  };
}

interface ExternalMatch {
  stage?: string;
  utcDate?: string;
  homeTeam?: ExternalTeam;
  awayTeam?: ExternalTeam;
  score?: ExternalScore;
  group?: string | null;
}

interface ExternalApiResponse {
  matches?: ExternalMatch[];
}

/**
 * Service class managing tournament data operations.
 * Separating domain logic from the Express router adheres to the Single Responsibility Principle.
 */
export class TournamentService {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Retrieves tournament matches from the database cache.
   * Refreshes the cache from the external API if it is stale.
   */
  public async getMatches(): Promise<{ matches: TournamentMatch[]; nextMatch: TournamentMatch | null }> {
    if (Date.now() - lastFetch > FETCH_INTERVAL) {
      await this.refreshTournamentData();
    }

    const matches = this.db
      .prepare('SELECT * FROM tournament_cache ORDER BY date ASC, time ASC')
      .all() as unknown as TournamentMatch[];

    const now = new Date().toISOString().split('T')[0];
    const nonTbdMatches = matches.filter((m) => m.team1 !== 'TBD' && m.team2 !== 'TBD');
    const upcoming = nonTbdMatches.filter((m) => m.date >= (now ?? ''));

    // Fallback order: upcoming non-TBD -> any non-TBD match -> first match
    const nextMatch =
      upcoming.length > 0
        ? (upcoming[0] ?? null)
        : nonTbdMatches.length > 0
          ? (nonTbdMatches[nonTbdMatches.length - 1] ?? null)
          : (matches[0] ?? null);

    return { matches, nextMatch };
  }

  /**
   * Refreshes match data from the external football-data.org API.
   * Gracefully falls back to cached SQLite data on network or API failure.
   */
  private async refreshTournamentData(): Promise<void> {
    if (!config.footballDataApiKey) {
      lastFetch = Date.now();
      return;
    }

    try {
      const response = await fetch(FOOTBALL_DATA_URL, {
        headers: { 'X-Auth-Token': config.footballDataApiKey },
      });

      if (!response.ok) {
        lastFetch = Date.now();
        return;
      }

      const data = (await response.json()) as ExternalApiResponse;
      if (!data.matches || data.matches.length === 0) {
        lastFetch = Date.now();
        return;
      }

      this.db.prepare('DELETE FROM tournament_cache').run();

      const insert = this.db.prepare(`
        INSERT INTO tournament_cache (round, date, time, team1, team2, score1, score2, venue, group_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const match of data.matches) {
        const dateObj = match.utcDate ? new Date(match.utcDate) : new Date();
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toTimeString().split(' ')[0]?.slice(0, 5);
        const venue = 'New York New Jersey Stadium';

        insert.run(
          match.stage?.replace(/_/g, ' ') ?? 'Match',
          dateStr ?? '',
          timeStr ?? '',
          match.homeTeam?.name ?? 'TBD',
          match.awayTeam?.name ?? 'TBD',
          match.score?.fullTime?.home ?? null,
          match.score?.fullTime?.away ?? null,
          venue,
          match.group ?? null,
        );
      }

      lastFetch = Date.now();
      logger.info('Tournament data refreshed from football-data.org');
    } catch (error) {
      logger.warn('Failed to fetch tournament data, using fallback cache', {
        error: error instanceof Error ? error.message : String(error),
      });
      lastFetch = Date.now();
    }
  }
}
