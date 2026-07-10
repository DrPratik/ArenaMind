import type { DatabaseSync } from 'node:sqlite';
import { createSchema } from './schema.js';
import { logger } from '../utils/logger.js';

/**
 * Seeds the database with realistic data for the New York New Jersey Stadium
 * (modeled after MetLife Stadium, ~80,000 capacity).
 */
export function seedDatabase(db: DatabaseSync): void {
  createSchema(db);

  const hasData = db.prepare('SELECT COUNT(*) as count FROM gates').get() as { count: number } | undefined;
  if (hasData && hasData.count > 0) return;

  seedGates(db);
  seedSections(db);
  seedAmenities(db);
  seedFoodStalls(db);
  seedRoutes(db);
  seedCrowdLog(db);
  seedIncidents(db);
  seedLostFound(db);
  seedPersonas(db);
  seedTournamentFallback(db);
}

function seedGates(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO gates (id, name, section_range, current_crowd_level, accessible, coord_x, coord_y) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const gates: Array<[number, string, string, string, number, number, number]> = [
    [1, 'Gate 1 — North',      '101-104', 'low',      1, 50, 5],
    [2, 'Gate 2 — Northeast',   '105-108', 'moderate', 1, 82, 20],
    [3, 'Gate 3 — East',        '109-112', 'low',      1, 95, 50],
    [4, 'Gate 4 — Southeast',   '113-116', 'busy',     0, 82, 80],
    [5, 'Gate 5 — South',       '117-120', 'low',      1, 50, 95],
    [6, 'Gate 6 — Southwest',   '121-124', 'low',      1, 18, 80],
    [7, 'Gate 7 — West',        '125-128', 'moderate', 1, 5,  50],
    [8, 'Gate 8 — Northwest',   '129-132', 'busy',     1, 18, 20],
  ];
  for (const g of gates) insert.run(...g);
}

function seedSections(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO sections (id, gate_id, name, seat_range, accessible) VALUES (?, ?, ?, ?, ?)',
  );
  let sectionId = 1;
  for (let gateId = 1; gateId <= 8; gateId++) {
    const baseSection = 100 + (gateId - 1) * 4 + 1;
    for (let s = 0; s < 4; s++) {
      const sectionNum = baseSection + s;
      const seatStart = s * 250 + 1;
      const seatEnd = seatStart + 249;
      insert.run(sectionId, gateId, `Section ${sectionNum}`, `${seatStart}-${seatEnd}`, gateId !== 4 ? 1 : 0);
      sectionId++;
    }
  }
}

function seedAmenities(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO amenities (id, type, name, gate_id, coord_x, coord_y, accessible) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const amenities: Array<[number, string, string, number, number, number, number]> = [
    [1,  'restroom', 'Restroom A — North Concourse',       1, 45, 10,  1],
    [2,  'restroom', 'Restroom B — East Concourse',        3, 90, 45,  1],
    [3,  'restroom', 'Restroom C — South Concourse',       5, 55, 90,  1],
    [4,  'restroom', 'Restroom D — West Concourse',        7, 10, 55,  1],
    [5,  'food', 'North Food Court',                       1, 48, 15,  1],
    [6,  'food', 'East Food Court',                        3, 88, 55,  1],
    [7,  'food', 'South Food Court',                       5, 52, 88,  1],
    [8,  'food', 'West Food Court',                        7, 12, 45,  1],
    [9,  'food', 'Gate 2 Food Plaza',                      2, 78, 25,  1],
    [10, 'food', 'Gate 6 Food Plaza',                      6, 22, 75,  1],
    [11, 'medical', 'First Aid Station — North',           1, 52, 8,   1],
    [12, 'medical', 'First Aid Station — South',           5, 48, 92,  1],
    [13, 'medical', 'Emergency Medical Center',            3, 92, 50,  1],
    [14, 'prayer_room', 'Prayer Room — East Wing',         3, 85, 48,  1],
    [15, 'prayer_room', 'Prayer Room — West Wing',         7, 15, 52,  1],
    [16, 'nursing_room', 'Family Nursing Room — North',    1, 42, 12,  1],
    [17, 'nursing_room', 'Family Nursing Room — South',    5, 58, 88,  1],
    [18, 'info_desk', 'Information Desk — Gate 1',         1, 50, 7,   1],
    [19, 'info_desk', 'Information Desk — Gate 5',         5, 50, 93,  1],
    [20, 'info_desk', 'Information Desk — Gate 8',         8, 20, 22,  1],
  ];
  for (const a of amenities) insert.run(...a);
}

function seedFoodStalls(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO food_stalls (id, name, amenity_id, cuisine_tags, current_queue_minutes, gate_id) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const stalls: Array<[number, string, number, string, number, number]> = [
    [1,  'Big Apple Burgers',        5,  'american',                     8,  1],
    [2,  'Taco Fiesta',              5,  'mexican,halal',                12, 1],
    [3,  'Sakura Sushi',             6,  'japanese,pescatarian',         5,  3],
    [4,  'Curry House',              6,  'indian,veg,halal',            15, 3],
    [5,  'Mediterranean Bites',      7,  'mediterranean,veg,halal',     7,  5],
    [6,  'BBQ Smokehouse',           7,  'american,gluten_free',        10, 5],
    [7,  'Pizza Napoli',             8,  'italian,veg',                  6,  7],
    [8,  'Falafel King',             8,  'middle_eastern,veg,halal',     4,  7],
    [9,  'Churros & Chocolate',      9,  'dessert,veg',                  3,  2],
    [10, 'Noodle Bowl',              9,  'asian,veg',                    9,  2],
    [11, 'Açaí Paradise',            10, 'brazilian,veg,gluten_free',    5,  6],
    [12, 'Pretzel Palace',           10, 'snacks,veg',                   2,  6],
  ];
  for (const s of stalls) insert.run(...s);
}

function seedRoutes(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO routes (id, from_type, from_id, to_type, to_id, mode, steps_json, estimated_minutes, distance_meters) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  let routeId = 1;

  const gateRoutes = [
    {
      from: 8, to: 6, mode: 'standard',
      steps: [
        { instruction: 'Exit Gate 8 and head south along the West Concourse', landmark: 'West Concourse entrance', distance_meters: 120 },
        { instruction: 'Continue past Gate 7 — follow signs for Gate 6', landmark: 'Gate 7 junction', distance_meters: 150 },
        { instruction: 'Arrive at Gate 6 — Southwest entrance', landmark: 'Gate 6', distance_meters: 80 },
      ],
      minutes: 4, meters: 350,
    },
    {
      from: 8, to: 6, mode: 'wheelchair',
      steps: [
        { instruction: 'Take the accessible ramp at Gate 8 down to the West Concourse', landmark: 'Gate 8 accessible ramp', distance_meters: 80 },
        { instruction: 'Follow the accessible path past Gate 7 (elevator available)', landmark: 'Gate 7 elevator', distance_meters: 200 },
        { instruction: 'Continue to Gate 6 accessible entrance on the right', landmark: 'Gate 6 accessible entrance', distance_meters: 100 },
      ],
      minutes: 6, meters: 380,
    },
    {
      from: 8, to: 6, mode: 'less_crowded',
      steps: [
        { instruction: 'Exit Gate 8 and take the outer perimeter walkway heading south', landmark: 'Outer perimeter path', distance_meters: 200 },
        { instruction: 'Pass the West parking plaza — less foot traffic this way', landmark: 'West parking plaza', distance_meters: 180 },
        { instruction: 'Enter Gate 6 via the secondary southwest entrance', landmark: 'Gate 6 secondary entrance', distance_meters: 60 },
      ],
      minutes: 5, meters: 440,
    },
    {
      from: 1, to: 8, mode: 'standard',
      steps: [
        { instruction: 'Head west from Gate 1 along the North Concourse', landmark: 'North Concourse', distance_meters: 100 },
        { instruction: 'Turn left at the Northwest corner', landmark: 'Northwest junction', distance_meters: 80 },
        { instruction: 'Arrive at Gate 8', landmark: 'Gate 8', distance_meters: 50 },
      ],
      minutes: 3, meters: 230,
    },
    {
      from: 1, to: 8, mode: 'wheelchair',
      steps: [
        { instruction: 'Take the accessible corridor west from Gate 1', landmark: 'Gate 1 accessible corridor', distance_meters: 120 },
        { instruction: 'Follow ramp down to Gate 8 accessible entrance', landmark: 'Gate 8 ramp', distance_meters: 100 },
      ],
      minutes: 4, meters: 220,
    },
    {
      from: 1, to: 5, mode: 'standard',
      steps: [
        { instruction: 'Head east along the North Concourse to Gate 3', landmark: 'East Concourse', distance_meters: 200 },
        { instruction: 'Continue south past Gate 4 along East Concourse', landmark: 'Gate 4 junction', distance_meters: 250 },
        { instruction: 'Arrive at Gate 5 — South entrance', landmark: 'Gate 5', distance_meters: 100 },
      ],
      minutes: 8, meters: 550,
    },
    {
      from: 4, to: 5, mode: 'standard',
      steps: [
        { instruction: 'Head south from Gate 4 along the Southeast Concourse', landmark: 'Southeast path', distance_meters: 100 },
        { instruction: 'Continue to Gate 5 — South entrance', landmark: 'Gate 5', distance_meters: 80 },
      ],
      minutes: 2, meters: 180,
    },
    {
      from: 2, to: 3, mode: 'standard',
      steps: [
        { instruction: 'Head east from Gate 2 along the Northeast Concourse', landmark: 'Northeast Concourse', distance_meters: 120 },
        { instruction: 'Arrive at Gate 3 — East entrance', landmark: 'Gate 3', distance_meters: 60 },
      ],
      minutes: 2, meters: 180,
    },
  ];

  for (const r of gateRoutes) {
    insert.run(routeId++, 'gate', r.from, 'gate', r.to, r.mode, JSON.stringify(r.steps), r.minutes, r.meters);
    const reverseSteps = [...r.steps].reverse().map((s) => ({
      ...s,
      instruction: s.instruction.replace('head south', 'head north').replace('head east', 'head west').replace('head west', 'head east').replace('Exit', 'Head to'),
    }));
    insert.run(routeId++, 'gate', r.to, 'gate', r.from, r.mode, JSON.stringify(reverseSteps), r.minutes, r.meters);
  }

  const amenityRoutes = [
    {
      from_gate: 8, to_amenity: 4, mode: 'standard',
      steps: [
        { instruction: 'Head south along the West Concourse from Gate 8', landmark: 'West Concourse', distance_meters: 100 },
        { instruction: 'Restroom D is on your left', landmark: 'Restroom D sign', distance_meters: 30 },
      ],
      minutes: 2, meters: 130,
    },
    {
      from_gate: 1, to_amenity: 1, mode: 'standard',
      steps: [
        { instruction: 'Walk east along the North Concourse', landmark: 'North Concourse', distance_meters: 40 },
        { instruction: 'Restroom A is on your right', landmark: 'Restroom A sign', distance_meters: 10 },
      ],
      minutes: 1, meters: 50,
    },
    {
      from_gate: 1, to_amenity: 11, mode: 'standard',
      steps: [
        { instruction: 'First Aid Station is directly next to Gate 1', landmark: 'First Aid sign', distance_meters: 20 },
      ],
      minutes: 1, meters: 20,
    },
    {
      from_gate: 5, to_amenity: 12, mode: 'standard',
      steps: [
        { instruction: 'First Aid Station is just past Gate 5 entrance', landmark: 'First Aid sign', distance_meters: 25 },
      ],
      minutes: 1, meters: 25,
    },
    {
      from_gate: 3, to_amenity: 14, mode: 'standard',
      steps: [
        { instruction: 'Head south from Gate 3 along the East Concourse', landmark: 'East Concourse', distance_meters: 60 },
        { instruction: 'Prayer Room is on your left past the food court', landmark: 'Prayer Room sign', distance_meters: 30 },
      ],
      minutes: 1, meters: 90,
    },
    {
      from_gate: 1, to_amenity: 5, mode: 'standard',
      steps: [
        { instruction: 'Walk west along the North Concourse', landmark: 'North Concourse', distance_meters: 30 },
        { instruction: 'North Food Court is on your left', landmark: 'Food Court sign', distance_meters: 20 },
      ],
      minutes: 1, meters: 50,
    },
  ];

  for (const r of amenityRoutes) {
    insert.run(routeId++, 'gate', r.from_gate, 'amenity', r.to_amenity, r.mode, JSON.stringify(r.steps), r.minutes, r.meters);
  }
}

function seedCrowdLog(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO crowd_log (gate_id, crowd_level, timestamp) VALUES (?, ?, ?)',
  );
  const now = new Date();
  for (let minutesAgo = 60; minutesAgo >= 0; minutesAgo -= 10) {
    const ts = new Date(now.getTime() - minutesAgo * 60000).toISOString();
    const gate8Levels: Record<number, string> = { 60: 'low', 50: 'low', 40: 'moderate', 30: 'moderate', 20: 'busy', 10: 'busy', 0: 'busy' };
    insert.run(8, gate8Levels[minutesAgo] ?? 'moderate', ts);
    const gate4Levels: Record<number, string> = { 60: 'low', 50: 'moderate', 40: 'moderate', 30: 'busy', 20: 'busy', 10: 'busy', 0: 'busy' };
    insert.run(4, gate4Levels[minutesAgo] ?? 'moderate', ts);
    insert.run(1, 'low', ts);
    insert.run(6, 'low', ts);
    insert.run(2, minutesAgo > 30 ? 'low' : 'moderate', ts);
    insert.run(3, 'low', ts);
    insert.run(5, 'low', ts);
    insert.run(7, minutesAgo > 20 ? 'low' : 'moderate', ts);
  }
}

function seedIncidents(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO incidents (type, location, gate_id, note, photo_url, priority, status, suggested_department, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const now = new Date();
  insert.run('medical', 'Section 109, Row 12', 3, 'Fan reporting dizziness and nausea. Needs medical attention.', null, 'P2', 'in_progress', 'Medical Team', new Date(now.getTime() - 25 * 60000).toISOString());
  insert.run('maintenance', 'North Concourse near Gate 1', 1, 'Water leak from ceiling causing slippery floor.', null, 'P3', 'open', 'Facilities Maintenance', new Date(now.getTime() - 15 * 60000).toISOString());
  insert.run('security', 'Gate 4 — Southeast entrance', 4, 'Unauthorized vendor attempting entry. Security requested.', null, 'P3', 'resolved', 'Security Team', new Date(now.getTime() - 45 * 60000).toISOString());
}

function seedLostFound(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO lost_found (description, location_found, gate_id, timestamp, matched) VALUES (?, ?, ?, ?, ?)',
  );
  const now = new Date();
  insert.run('Blue backpack with FIFA logo', 'Section 105, Row 8, Seat 14', 2, new Date(now.getTime() - 30 * 60000).toISOString(), 0);
  insert.run('Black iPhone 16 in a clear case', 'Restroom A — North Concourse', 1, new Date(now.getTime() - 20 * 60000).toISOString(), 0);
  insert.run("Child's red cap with team USA emblem", 'North Food Court', 1, new Date(now.getTime() - 10 * 60000).toISOString(), 0);
  insert.run('Prescription sunglasses in brown case', 'Gate 5 entrance area', 5, new Date(now.getTime() - 50 * 60000).toISOString(), 1);
}

function seedPersonas(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO personas (id, name, role, language, accessibility_needs, description) VALUES (?, ?, ?, ?, ?, ?)',
  );
  insert.run(1, 'Maria', 'fan', 'es', '', 'Spanish-speaking fan attending her first World Cup match. Seated in Section 129 near Gate 8.');
  insert.run(2, 'Alex', 'fan', 'en', 'wheelchair', 'Wheelchair user who needs accessible routes and facilities. Seated in the accessible section near Gate 1.');
  insert.run(3, 'Priya', 'volunteer', 'en', '', 'Volunteer staff member assigned to the West Concourse area near Gates 7 and 8.');

  // ─── Tickets ──────────────────────────────────────────────────────────────
  db.exec('DELETE FROM tickets');
  const insertTicket = db.prepare(
    'INSERT INTO tickets (persona_id, qr_payload, gate_id, section, seat, status) VALUES (?, ?, ?, ?, ?, ?)',
  );
  // Give the fan persona a ticket to Gate 4
  insertTicket.run(1, 'ARENAMIND-TCK-8892-G4', 4, '120', '12A', 'valid');
}

function seedTournamentFallback(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT INTO tournament_cache (round, date, time, team1, team2, score1, score2, venue, group_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const venue = 'New York New Jersey Stadium';

  // Anchor matches around today's date so there is always a thrilling upcoming match
  const today = new Date();
  const formatDate = (daysOffset: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0] ?? '2026-07-10';
  };

  const fixtures: Array<[string, string, string, string, string, number | null, number | null, string, string | null]> = [
    ['Group Stage — Matchday 1', formatDate(-10), '18:00', 'Mexico',    'Indonesia',  2, 1, venue, 'Group A'],
    ['Group Stage — Matchday 2', formatDate(-6),  '21:00', 'Brazil',    'Nigeria',    3, 0, venue, 'Group E'],
    ['Round of 16',              formatDate(-3),  '20:00', 'USA',       'Italy',      1, 2, venue, null],
    ['Quarter-Final',            formatDate(0),   '20:00', 'France',    'Morocco',    null, null, venue, null],
    ['Quarter-Final',            formatDate(1),   '21:00', 'Brazil',    'England',    null, null, venue, null],
    ['Semi-Final',               formatDate(4),   '20:00', 'Argentina', 'Spain',      null, null, venue, null],
    ['Final',                    formatDate(9),   '16:00', 'France',    'Argentina',  null, null, venue, null],
  ];
  for (const f of fixtures) insert.run(...f);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const { getDb, closeDb } = await import('./connection.js');
  const db = getDb();
  seedDatabase(db);
  logger.info('Database seeded successfully');
  closeDb();
}
