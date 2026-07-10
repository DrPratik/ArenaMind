/**
 * @module rules/gates
 * @description Deterministic gate status and alternative routing rules engine.
 */

import type { DatabaseSync } from 'node:sqlite';
import type { Gate, CrowdLevel } from '../types.js';

export interface GateStatusResult {
  gate: Gate;
  alternativeGate: Gate | null;
  alternativeReason: string | null;
}

/**
 * Get the status of a specific gate including crowd level.
 * If the gate is busy or critical, also returns the least crowded alternative.
 */
export function getGateStatus(db: DatabaseSync, gateId: number): GateStatusResult | null {
  const gate = db.prepare('SELECT * FROM gates WHERE id = ?').get(gateId) as Gate | undefined;
  if (!gate) return null;

  // Normalize boolean
  gate.accessible = Boolean(gate.accessible);

  let alternativeGate: Gate | null = null;
  let alternativeReason: string | null = null;

  if (gate.current_crowd_level === 'busy' || gate.current_crowd_level === 'critical') {
    alternativeGate = findLeastCrowdedGate(db, gateId);
    if (alternativeGate) {
      alternativeReason = `${gate.name} is currently ${gate.current_crowd_level}. ${alternativeGate.name} has lower crowd levels and may be faster.`;
    }
  }

  return { gate, alternativeGate, alternativeReason };
}

/**
 * Get all gates with their current crowd levels.
 */
export function getAllGateStatuses(db: DatabaseSync): Gate[] {
  const gates = db.prepare('SELECT * FROM gates ORDER BY id').all() as unknown as Gate[];
  return gates.map((g) => ({ ...g, accessible: Boolean(g.accessible) }));
}

/**
 * Find the least crowded gate, optionally excluding a specific gate.
 * Prefers accessible gates when multiple candidates tie.
 */
export function findLeastCrowdedGate(db: DatabaseSync, excludeGateId?: number): Gate | null {
  const crowdOrder: Record<CrowdLevel, number> = { low: 0, moderate: 1, busy: 2, critical: 3 };

  let gates = db.prepare('SELECT * FROM gates').all() as unknown as Gate[];
  if (excludeGateId !== undefined) {
    gates = gates.filter((g) => g.id !== excludeGateId);
  }

  if (gates.length === 0) return null;

  gates.sort((a, b) => {
    const diff = crowdOrder[a.current_crowd_level] - crowdOrder[b.current_crowd_level];
    if (diff !== 0) return diff;
    // Prefer accessible gates as tiebreaker
    return Number(b.accessible) - Number(a.accessible);
  });

  const best = gates[0];
  return { ...best, accessible: Boolean(best.accessible) };
}

/**
 * Update a gate's crowd level (for demo control panel).
 */
export function updateGateCrowdLevel(
  db: DatabaseSync,
  gateId: number,
  crowdLevel: CrowdLevel,
): boolean {
  const result = db.prepare('UPDATE gates SET current_crowd_level = ? WHERE id = ?').run(crowdLevel, gateId);
  if (result.changes > 0) {
    db.prepare('INSERT INTO crowd_log (gate_id, crowd_level, timestamp) VALUES (?, ?, ?)').run(
      gateId,
      crowdLevel,
      new Date().toISOString(),
    );
    return true;
  }
  return false;
}
