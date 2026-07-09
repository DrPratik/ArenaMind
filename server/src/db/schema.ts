import type { DatabaseSync } from 'node:sqlite';

export function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gates (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      section_range TEXT NOT NULL,
      current_crowd_level TEXT NOT NULL CHECK(current_crowd_level IN ('low','moderate','busy','critical')),
      accessible INTEGER NOT NULL DEFAULT 0,
      coord_x REAL NOT NULL,
      coord_y REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY,
      gate_id INTEGER NOT NULL REFERENCES gates(id),
      name TEXT NOT NULL,
      seat_range TEXT NOT NULL,
      accessible INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS amenities (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('restroom','food','medical','prayer_room','nursing_room','info_desk')),
      name TEXT NOT NULL,
      gate_id INTEGER NOT NULL REFERENCES gates(id),
      coord_x REAL NOT NULL,
      coord_y REAL NOT NULL,
      accessible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS food_stalls (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      amenity_id INTEGER NOT NULL REFERENCES amenities(id),
      cuisine_tags TEXT NOT NULL DEFAULT '',
      current_queue_minutes INTEGER NOT NULL DEFAULT 5,
      gate_id INTEGER NOT NULL REFERENCES gates(id)
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY,
      from_type TEXT NOT NULL,
      from_id INTEGER NOT NULL,
      to_type TEXT NOT NULL,
      to_id INTEGER NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('standard','wheelchair','fastest','less_crowded')),
      steps_json TEXT NOT NULL DEFAULT '[]',
      estimated_minutes INTEGER NOT NULL,
      distance_meters INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crowd_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gate_id INTEGER NOT NULL REFERENCES gates(id),
      crowd_level TEXT NOT NULL CHECK(crowd_level IN ('low','moderate','busy','critical')),
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('medical','security','maintenance','crowd','lost_child','other')),
      location TEXT NOT NULL,
      gate_id INTEGER NOT NULL REFERENCES gates(id),
      note TEXT NOT NULL DEFAULT '',
      photo_url TEXT,
      priority TEXT NOT NULL CHECK(priority IN ('P1','P2','P3','P4')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved')),
      suggested_department TEXT NOT NULL DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lost_found (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      location_found TEXT NOT NULL,
      gate_id INTEGER NOT NULL REFERENCES gates(id),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      matched INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      accessibility_needs TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tournament_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL DEFAULT '',
      team1 TEXT NOT NULL,
      team2 TEXT NOT NULL,
      score1 INTEGER,
      score2 INTEGER,
      venue TEXT NOT NULL,
      group_name TEXT
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      persona_id INTEGER NOT NULL REFERENCES personas(id),
      qr_payload TEXT NOT NULL UNIQUE,
      gate_id INTEGER NOT NULL REFERENCES gates(id),
      section TEXT NOT NULL,
      seat TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid','used','invalid'))
    )
  `);

  // Create indexes separately (node:sqlite requires separate exec calls for some DDL)
  db.exec('CREATE INDEX IF NOT EXISTS idx_crowd_log_gate ON crowd_log(gate_id, timestamp)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, priority)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_food_stalls_gate ON food_stalls(gate_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_routes_from_to ON routes(from_type, from_id, to_type, to_id, mode)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_payload)');
}
