/**
 * @module api/incident
 * @description Incident report filing and triage endpoints.
 *
 * Provides endpoints to file new incident reports (`POST /api/incident`),
 * list filtered incidents (`GET /api/incident`), and update status
 * (`PATCH /api/incident/:id/status`). Priority (P1-P4) and target department
 * are assigned deterministically by the rules engine.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { fileIncident, getIncidents, updateIncidentStatus } from '../rules/incidents.js';
import { incidentRequestSchema, incidentStatusUpdateSchema } from './validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import type { IncidentType } from '../types.js';

const router = Router();

/**
 * `POST /` — File a new incident report.
 * The rules layer assigns priority (P1-P4) and department deterministically.
 */
router.post('/', rateLimiter, (req: Request, res: Response): void => {
  try {
    const parsed = incidentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const { note, location, gate_id, photo_url, type } = parsed.data;
    const db = getDb();

    const incidentType: IncidentType = type ?? inferIncidentType(note);

    const result = fileIncident(db, {
      type: incidentType,
      location,
      gateId: gate_id,
      note,
      photoUrl: photo_url,
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /api/incident', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * `GET /` — Retrieve all incidents, optionally filtered by status, priority, or gate.
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const incidents = getIncidents(db, {
      status: req.query.status as 'open' | 'in_progress' | 'resolved' | undefined,
      priority: req.query.priority as 'P1' | 'P2' | 'P3' | 'P4' | undefined,
      gateId: req.query.gate_id ? parseInt(req.query.gate_id as string, 10) : undefined,
    });
    res.json({ incidents });
  } catch (error) {
    logger.error('Error in GET /api/incident', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * `PATCH /:id/status` — Update the lifecycle status of an incident.
 */
router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const parsed = incidentStatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const db = getDb();
    const id = parseInt(req.params.id as string, 10);
    const updated = updateIncidentStatus(db, id, parsed.data.status);

    if (updated) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  } catch (error) {
    logger.error('Error in PATCH /api/incident/:id/status', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Keyword-based incident type inference when not explicitly supplied.
 */
function inferIncidentType(note: string): IncidentType {
  const lower = note.toLowerCase();
  if (/medic|hurt|injur|faint|dizz|ill|sick|ambulance/i.test(lower)) return 'medical';
  if (/fight|weapon|threat|suspicious|unauthorized|security/i.test(lower)) return 'security';
  if (/spill|leak|broken|clean|maintenance|repair/i.test(lower)) return 'maintenance';
  if (/crowd|crush|stampede|overcrowd|capacity/i.test(lower)) return 'crowd';
  if (/child|kid|lost.*child|missing.*child/i.test(lower)) return 'lost_child';
  return 'other';
}

export default router;
