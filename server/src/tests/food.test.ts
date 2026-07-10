/**
 * @module tests/food
 * @description Unit tests for the food stall query and dietary preference filtering rules.
 *
 * Verifies that the food rules engine correctly queries stalls, filters by
 * dietary tags (halal, veg, gluten-free), and returns queue time information.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { getFoodQueue, findFoodByPreference } from '../rules/food.js';

let db: DatabaseSync;

describe('Food Rules Engine', () => {
  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE gates (id INTEGER PRIMARY KEY, name TEXT, current_crowd_level TEXT);
      CREATE TABLE amenities (id INTEGER PRIMARY KEY, type TEXT, name TEXT, gate_id INTEGER, coord_x REAL, coord_y REAL, accessible INTEGER);
      CREATE TABLE food_stalls (id INTEGER PRIMARY KEY, name TEXT, amenity_id INTEGER, cuisine_tags TEXT, current_queue_minutes INTEGER, gate_id INTEGER);
    `);

    db.prepare('INSERT INTO gates VALUES (?, ?, ?)').run(1, 'Gate 1', 'low');
    db.prepare('INSERT INTO amenities VALUES (?, ?, ?, ?, ?, ?, ?)').run(5, 'food', 'North Food Court', 1, 48, 15, 1);
    db.prepare('INSERT INTO food_stalls VALUES (?, ?, ?, ?, ?, ?)').run(1, 'Big Apple Burgers', 5, 'american', 8, 1);
    db.prepare('INSERT INTO food_stalls VALUES (?, ?, ?, ?, ?, ?)').run(2, 'Taco Fiesta', 5, 'mexican,halal', 12, 1);
    db.prepare('INSERT INTO food_stalls VALUES (?, ?, ?, ?, ?, ?)').run(3, 'Falafel King', 5, 'middle_eastern,veg,halal', 4, 1);
  });

  afterEach(() => {
    db.close();
  });

  it('returns all food stalls when no filter is applied', () => {
    const stalls = getFoodQueue(db);
    expect(stalls).toHaveLength(3);
  });

  it('returns a specific stall by ID', () => {
    const stalls = getFoodQueue(db, 1);
    expect(stalls).toHaveLength(1);
    expect(stalls[0].name).toBe('Big Apple Burgers');
  });

  it('filters stalls by halal tag', () => {
    const stalls = findFoodByPreference(db, ['halal']);
    expect(stalls.length).toBeGreaterThanOrEqual(2);
    stalls.forEach((stall) => {
      expect(stall.cuisineTags).toContain('halal');
    });
  });

  it('filters stalls by veg tag', () => {
    const stalls = findFoodByPreference(db, ['veg']);
    expect(stalls.length).toBeGreaterThanOrEqual(1);
    stalls.forEach((stall) => {
      expect(stall.cuisineTags).toContain('veg');
    });
  });

  it('returns empty array for a tag with no matches', () => {
    const stalls = findFoodByPreference(db, ['japanese']);
    expect(stalls).toHaveLength(0);
  });
});
