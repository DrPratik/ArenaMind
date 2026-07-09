import type { DatabaseSync } from 'node:sqlite';
import type { Route, RouteStep, RouteMode } from '../types.js';

export interface RouteResult {
  from: { type: string; id: number; name: string };
  to: { type: string; id: number; name: string };
  mode: RouteMode;
  steps: RouteStep[];
  estimatedMinutes: number;
  distanceMeters: number;
}

/**
 * Get a route between two locations (gate-to-gate or gate-to-amenity).
 * Falls back to 'standard' mode if the requested mode isn't available.
 */
export function getRoute(
  db: DatabaseSync,
  fromType: string,
  fromId: number,
  toType: string,
  toId: number,
  mode: RouteMode = 'standard',
): RouteResult | null {
  // Try the exact mode first
  let route = db
    .prepare(
      'SELECT * FROM routes WHERE from_type = ? AND from_id = ? AND to_type = ? AND to_id = ? AND mode = ?',
    )
    .get(fromType, fromId, toType, toId, mode) as Route | undefined;

  // Fall back to standard mode
  if (!route && mode !== 'standard') {
    route = db
      .prepare(
        'SELECT * FROM routes WHERE from_type = ? AND from_id = ? AND to_type = ? AND to_id = ? AND mode = ?',
      )
      .get(fromType, fromId, toType, toId, 'standard') as Route | undefined;
  }

  if (!route) return null;

  // Resolve names
  const fromName = resolveName(db, fromType, fromId);
  const toName = resolveName(db, toType, toId);

  const steps: RouteStep[] = JSON.parse(route.steps_json) as RouteStep[];

  return {
    from: { type: fromType, id: fromId, name: fromName },
    to: { type: toType, id: toId, name: toName },
    mode: route.mode as RouteMode,
    steps,
    estimatedMinutes: route.estimated_minutes,
    distanceMeters: route.distance_meters,
  };
}

/**
 * Find the nearest amenity of a given type to a gate.
 */
export function findNearestAmenity(
  db: DatabaseSync,
  gateId: number,
  amenityType: string,
): { amenityId: number; name: string; route: RouteResult | null } | null {
  // Find amenities of the given type
  const amenities = db
    .prepare('SELECT * FROM amenities WHERE type = ?')
    .all(amenityType) as Array<{ id: number; name: string; gate_id: number; coord_x: number; coord_y: number }>;

  if (amenities.length === 0) return null;

  // Get the source gate coordinates
  const sourceGate = db.prepare('SELECT coord_x, coord_y FROM gates WHERE id = ?').get(gateId) as
    | { coord_x: number; coord_y: number }
    | undefined;

  if (!sourceGate) return null;

  // Find nearest by Euclidean distance on the grid
  let nearest = amenities[0];
  let minDist = Infinity;

  for (const amenity of amenities) {
    const dist = Math.sqrt(
      (amenity.coord_x - sourceGate.coord_x) ** 2 + (amenity.coord_y - sourceGate.coord_y) ** 2,
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = amenity;
    }
  }

  const route = getRoute(db, 'gate', gateId, 'amenity', nearest.id);
  return { amenityId: nearest.id, name: nearest.name, route };
}

function resolveName(db: DatabaseSync, type: string, id: number): string {
  if (type === 'gate') {
    const gate = db.prepare('SELECT name FROM gates WHERE id = ?').get(id) as { name: string } | undefined;
    return gate?.name ?? `Gate ${id}`;
  }
  if (type === 'amenity') {
    const amenity = db.prepare('SELECT name FROM amenities WHERE id = ?').get(id) as { name: string } | undefined;
    return amenity?.name ?? `Amenity ${id}`;
  }
  return `${type} ${id}`;
}
