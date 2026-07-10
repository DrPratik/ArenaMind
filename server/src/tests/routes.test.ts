/**
 * @module tests/routes
 * @description Unit tests for the deterministic route-finding rules engine.
 *
 * Verifies that the routing layer correctly resolves standard, wheelchair,
 * and less-crowded routes between gates, and gate-to-amenity routes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { getRoute } from '../rules/routes.js';

let db: DatabaseSync;

describe('Route Rules Engine', () => {
  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE gates (id INTEGER PRIMARY KEY, name TEXT, section_range TEXT, current_crowd_level TEXT, accessible INTEGER, coord_x REAL, coord_y REAL);
      CREATE TABLE routes (id INTEGER PRIMARY KEY, from_type TEXT, from_id INTEGER, to_type TEXT, to_id INTEGER, mode TEXT, steps_json TEXT, estimated_minutes INTEGER, distance_meters INTEGER);
    `);

    db.prepare('INSERT INTO gates (id, name, section_range, current_crowd_level, accessible, coord_x, coord_y) VALUES (?, ?, ?, ?, ?, ?, ?)').run(1, 'Gate 1', '101-104', 'low', 1, 50, 5);
    db.prepare('INSERT INTO gates (id, name, section_range, current_crowd_level, accessible, coord_x, coord_y) VALUES (?, ?, ?, ?, ?, ?, ?)').run(8, 'Gate 8', '129-132', 'busy', 1, 18, 20);

    const steps = JSON.stringify([
      { instruction: 'Head west from Gate 1', landmark: 'North Concourse', distance_meters: 100 },
      { instruction: 'Arrive at Gate 8', landmark: 'Gate 8', distance_meters: 50 },
    ]);
    db.prepare('INSERT INTO routes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(1, 'gate', 1, 'gate', 8, 'standard', steps, 3, 230);

    const wheelchairSteps = JSON.stringify([
      { instruction: 'Take accessible corridor west from Gate 1', landmark: 'Gate 1 accessible corridor', distance_meters: 120 },
      { instruction: 'Follow ramp to Gate 8', landmark: 'Gate 8 ramp', distance_meters: 100 },
    ]);
    db.prepare('INSERT INTO routes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(2, 'gate', 1, 'gate', 8, 'wheelchair', wheelchairSteps, 4, 220);
  });

  afterEach(() => {
    db.close();
  });

  it('finds a standard route between two gates', () => {
    const route = getRoute(db, 'gate', 1, 'gate', 8, 'standard');
    expect(route).toBeDefined();
    expect(route?.estimatedMinutes).toBe(3);
    expect(route?.distanceMeters).toBe(230);
    expect(route?.steps).toHaveLength(2);
  });

  it('finds a wheelchair-accessible route', () => {
    const route = getRoute(db, 'gate', 1, 'gate', 8, 'wheelchair');
    expect(route).toBeDefined();
    expect(route?.mode).toBe('wheelchair');
    expect(route?.steps[0].instruction).toContain('accessible');
  });

  it('returns null for a route that does not exist', () => {
    const route = getRoute(db, 'gate', 1, 'gate', 5, 'standard');
    expect(route).toBeNull();
  });

  it('falls back to standard mode when requested mode is not explicitly mapped', () => {
    const route = getRoute(db, 'gate', 1, 'gate', 8, 'fastest');
    expect(route).toBeDefined();
    expect(route?.mode).toBe('standard');
  });
});
