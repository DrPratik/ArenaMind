import type { DatabaseSync } from 'node:sqlite';
import type { TournamentMatch } from '../types.js';

const FOOTBALL_DATA_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const API_TOKEN = process.env.FOOTBALL_DATA_API_KEY;

let lastFetch = 0;
const FETCH_INTERVAL = 15 * 60 * 1000; // 15 minutes

/**
 * Service to manage tournament data operations.
 * Separating this logic from the Express router adheres to the Single Responsibility Principle.
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
    const upcoming = matches.filter((m) => m.date >= (now ?? ''));
    const nextMatch = upcoming.length > 0 ? upcoming[0] : null;

    return { matches, nextMatch };
  }

  /**
   * Fetches tournament data from the external API and updates the local cache.
   */
  private async refreshTournamentData(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(FOOTBALL_DATA_URL, {
        headers: { 'X-Auth-Token': API_TOKEN || '' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`football-data.org fetch failed: ${response.status}`);
        lastFetch = Date.now(); // Don't retry immediately
        return;
      }

      const data = (await response.json()) as {
        matches?: Array<{
          utcDate?: string;
          stage?: string;
          group?: string;
          homeTeam?: { name?: string };
          awayTeam?: { name?: string };
          score?: { fullTime?: { home?: number; away?: number } };
        }>;
      };

      if (!data.matches) {
        lastFetch = Date.now();
        return;
      }

      const venue = 'New York New Jersey Stadium';

      this.db.prepare('DELETE FROM tournament_cache').run();
      const insert = this.db.prepare(
        'INSERT INTO tournament_cache (round, date, time, team1, team2, score1, score2, venue, group_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      );

      for (const match of data.matches) {
        if (!match.utcDate) continue;
        
        const dateObj = new Date(match.utcDate);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toISOString().split('T')[1]?.substring(0, 5) ?? '00:00';

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
      console.log('✅ Tournament data refreshed from football-data.org (Service Layer)');
    } catch (error) {
      console.warn('⚠️ Failed to fetch tournament data, using fallback:', error);
      lastFetch = Date.now();
    }
  }
}
