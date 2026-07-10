/**
 * @module tests/gates
 * @description Unit tests for the gate status query rules engine.
 *
 * Verifies that gate status queries return correct crowd levels,
 * accessibility information, and coordinate data.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { getGateStatus } from '../rules/gates.js';

let db: DatabaseSync;

describe('Gate Status Rules Engine', () => {
  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE gates (id INTEGER PRIMARY KEY, name TEXT, section_range TEXT, current_crowd_level TEXT, accessible INTEGER, coord_x REAL, coord_y REAL);
    `);

    db.prepare('INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?, ?)').run(1, 'Gate 1 — North', '101-104', 'low', 1, 50, 5);
    db.prepare('INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?, ?)').run(4, 'Gate 4 — Southeast', '113-116', 'busy', 0, 82, 80);
  });

  afterEach(() => {
    db.close();
  });

  it('returns correct gate status for an existing gate', () => {
    const status = getGateStatus(db, 1);
    expect(status).toBeDefined();
    expect(status?.gate.name).toBe('Gate 1 — North');
    expect(status?.gate.current_crowd_level).toBe('low');
    expect(status?.gate.accessible).toBe(true);
  });

  it('returns busy crowd level for Gate 4', () => {
    const status = getGateStatus(db, 4);
    expect(status).toBeDefined();
    expect(status?.gate.current_crowd_level).toBe('busy');
    expect(status?.gate.accessible).toBe(false);
  });

  it('returns null for a non-existent gate', () => {
    const status = getGateStatus(db, 99);
    expect(status).toBeNull();
  });

  it('includes coordinate data for heatmap rendering', () => {
    const status = getGateStatus(db, 1);
    expect(status?.gate.coord_x).toBe(50);
    expect(status?.gate.coord_y).toBe(5);
  });
});
