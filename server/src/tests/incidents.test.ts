/**
 * @module tests/incidents
 * @description Unit tests for the incident filing and triage rules engine.
 *
 * Verifies that the incident system correctly classifies severity (P1-P4),
 * auto-assigns suggested departments, and stores incidents with proper
 * timestamps.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { fileIncident } from '../rules/incidents.js';

let db: DatabaseSync;

describe('Incident Rules Engine', () => {
  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE gates (id INTEGER PRIMARY KEY, name TEXT, current_crowd_level TEXT);
      CREATE TABLE incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, location TEXT, gate_id INTEGER, note TEXT, photo_url TEXT,
        priority TEXT, status TEXT DEFAULT 'open', suggested_department TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
      );
    `);

    db.prepare('INSERT INTO gates VALUES (?, ?, ?)').run(1, 'Gate 1', 'low');
    db.prepare('INSERT INTO gates VALUES (?, ?, ?)').run(4, 'Gate 4', 'busy');
  });

  afterEach(() => {
    db.close();
  });

  it('files a medical incident with P1 priority', () => {
    const result = fileIncident(db, {
      type: 'medical',
      location: 'Section 109, Row 12',
      gateId: 1,
      note: 'Fan reporting chest pain.',
    });

    expect(result.incident).toBeDefined();
    expect(result.incident.type).toBe('medical');
    expect(result.incident.priority).toBe('P1');
    expect(result.incident.suggested_department).toBe('Medical Team');
    expect(result.incident.status).toBe('open');
  });

  it('files a security incident with P2 priority', () => {
    const result = fileIncident(db, {
      type: 'security',
      location: 'Gate 4 entrance',
      gateId: 4,
      note: 'Unauthorized vendor attempting entry.',
    });

    expect(result.incident.type).toBe('security');
    expect(result.incident.priority).toBe('P2');
    expect(result.incident.suggested_department).toBe('Security Team');
  });

  it('files a maintenance incident with P3 priority', () => {
    const result = fileIncident(db, {
      type: 'maintenance',
      location: 'North Concourse',
      gateId: 1,
      note: 'Water leak from ceiling.',
    });

    expect(result.incident.type).toBe('maintenance');
    expect(result.incident.priority).toBe('P3');
    expect(result.incident.suggested_department).toBe('Facilities Maintenance');
  });

  it('stores the incident in the database', () => {
    const result = fileIncident(db, {
      type: 'medical',
      location: 'Section 105',
      gateId: 1,
      note: 'Fan feeling dizzy.',
    });

    const stored = db.prepare('SELECT * FROM incidents WHERE id = ?').get(result.incident.id) as Record<string, unknown>;
    expect(stored).toBeDefined();
    expect(stored.note).toBe('Fan feeling dizzy.');
  });
});
