import type { DatabaseSync } from 'node:sqlite';
import type { Incident, IncidentType, IncidentPriority, IncidentStatus } from '../types.js';

export interface FileIncidentInput {
  type: IncidentType;
  location: string;
  gateId: number;
  note: string;
  photoUrl?: string;
  suggestedDepartment?: string;
}

export interface FileIncidentResult {
  incident: Incident;
  wasCreated: boolean;
}

/**
 * Priority assignment rules — deterministic, no LLM involved.
 */
function assignPriority(type: IncidentType): IncidentPriority {
  switch (type) {
    case 'medical':
    case 'lost_child':
      return 'P1';
    case 'security':
    case 'crowd':
      return 'P2';
    case 'maintenance':
      return 'P3';
    case 'other':
    default:
      return 'P4';
  }
}

/**
 * Department assignment rules — deterministic.
 */
function assignDepartment(type: IncidentType): string {
  switch (type) {
    case 'medical':
      return 'Medical Team';
    case 'lost_child':
      return 'Security & Guest Services';
    case 'security':
      return 'Security Team';
    case 'crowd':
      return 'Crowd Management';
    case 'maintenance':
      return 'Facilities Maintenance';
    case 'other':
    default:
      return 'Guest Services';
  }
}

/**
 * File a new incident. Priority and department are assigned by rules.
 */
export function fileIncident(
  db: DatabaseSync,
  input: FileIncidentInput,
): FileIncidentResult {
  const priority = assignPriority(input.type);
  const department = input.suggestedDepartment ?? assignDepartment(input.type);
  const timestamp = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO incidents (type, location, gate_id, note, photo_url, priority, status, suggested_department, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
    )
    .run(input.type, input.location, input.gateId, input.note, input.photoUrl ?? null, priority, department, timestamp);

  const incident: Incident = {
    id: Number(result.lastInsertRowid),
    type: input.type,
    location: input.location,
    gate_id: input.gateId,
    note: input.note,
    photo_url: input.photoUrl ?? null,
    priority,
    status: 'open',
    suggested_department: department,
    timestamp,
  };

  return { incident, wasCreated: true };
}

/**
 * Get incidents with optional filters.
 */
export function getIncidents(
  db: DatabaseSync,
  filters?: {
    status?: IncidentStatus;
    priority?: IncidentPriority;
    gateId?: number;
  },
): Incident[] {
  let query = 'SELECT * FROM incidents WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters?.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }
  if (filters?.gateId) {
    query += ' AND gate_id = ?';
    params.push(filters.gateId);
  }

  query += ' ORDER BY timestamp DESC';

  return db.prepare(query).all(...params) as Incident[];
}

/**
 * Update an incident's status.
 */
export function updateIncidentStatus(
  db: DatabaseSync,
  incidentId: number,
  status: IncidentStatus,
): boolean {
  const result = db.prepare('UPDATE incidents SET status = ? WHERE id = ?').run(status, incidentId);
  return result.changes > 0;
}
