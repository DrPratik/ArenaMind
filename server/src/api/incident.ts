import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { fileIncident, getIncidents, updateIncidentStatus } from '../rules/incidents.js';
import { incidentRequestSchema, incidentStatusUpdateSchema } from './validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import type { IncidentType } from '../types.js';

const router = Router();

/**
 * POST /api/incident — submit a new incident report.
 * The rules layer assigns priority and department deterministically.
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

    // Default type inference from keywords if not provided
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
    console.error('Error in POST /api/incident:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/incident — get all incidents, optionally filtered.
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
    console.error('Error in GET /api/incident:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/incident/:id/status — update incident status.
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
    console.error('Error in PATCH /api/incident/:id/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Simple keyword-based incident type inference.
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
