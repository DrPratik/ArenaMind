import type { DatabaseSync } from 'node:sqlite';
import type { FoodStall } from '../types.js';

export interface FoodStallResult {
  id: number;
  name: string;
  cuisineTags: string[];
  currentQueueMinutes: number;
  gateId: number;
  gateName: string;
}

/**
 * Get queue info for a specific stall or all stalls.
 */
export function getFoodQueue(
  db: DatabaseSync,
  stallId?: number,
): FoodStallResult[] {
  let stalls: FoodStall[];

  if (stallId !== undefined) {
    const stall = db.prepare('SELECT * FROM food_stalls WHERE id = ?').get(stallId) as FoodStall | undefined;
    stalls = stall ? [stall] : [];
  } else {
    stalls = db.prepare('SELECT * FROM food_stalls ORDER BY current_queue_minutes ASC').all() as FoodStall[];
  }

  return stalls.map((s) => {
    const gate = db.prepare('SELECT name FROM gates WHERE id = ?').get(s.gate_id) as { name: string } | undefined;
    return {
      id: s.id,
      name: s.name,
      cuisineTags: s.cuisine_tags.split(',').filter(Boolean),
      currentQueueMinutes: s.current_queue_minutes,
      gateId: s.gate_id,
      gateName: gate?.name ?? `Gate ${s.gate_id}`,
    };
  });
}

/**
 * Find food stalls matching dietary preferences.
 * Returns stalls sorted by shortest queue first.
 */
export function findFoodByPreference(
  db: DatabaseSync,
  tags: string[],
  nearGateId?: number,
): FoodStallResult[] {
  const allStalls = getFoodQueue(db);

  let matching = allStalls;

  if (tags.length > 0) {
    matching = allStalls.filter((s) =>
      tags.some((tag) => s.cuisineTags.includes(tag.toLowerCase())),
    );
  }

  if (nearGateId !== undefined) {
    // Prefer stalls at the same gate, then adjacent gates
    matching.sort((a, b) => {
      const aDist = Math.abs(a.gateId - nearGateId);
      const bDist = Math.abs(b.gateId - nearGateId);
      if (aDist !== bDist) return aDist - bDist;
      return a.currentQueueMinutes - b.currentQueueMinutes;
    });
  } else {
    matching.sort((a, b) => a.currentQueueMinutes - b.currentQueueMinutes);
  }

  return matching;
}

/**
 * Get the stall with the shortest queue overall.
 */
export function getShortestQueue(db: DatabaseSync): FoodStallResult | null {
  const stalls = getFoodQueue(db);
  return stalls.length > 0 ? stalls[0] : null;
}
