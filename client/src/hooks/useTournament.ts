import { useState, useEffect } from 'react';
import { getTournamentData } from '../api/client';
import type { TournamentMatch } from '../types';

export function useTournament() {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [nextMatch, setNextMatch] = useState<TournamentMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTournamentData();
        setMatches(data.matches);
        setNextMatch(data.nextMatch);
      } catch {
        console.warn('Failed to fetch tournament data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { matches, nextMatch, loading };
}
