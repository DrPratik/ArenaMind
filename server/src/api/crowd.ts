/**
 * @module api/crowd
 * @description Real-time crowd heatmap and overload risk endpoints.
 *
 * Exposes real-time crowd levels per gate (`GET /api/crowd`) along with
 * predictive overload risk assessments. Also provides an admin mutation
 * endpoint (`POST /api/crowd/admin`) for simulating crowd surges.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { getAllGateStatuses, updateGateCrowdLevel } from '../rules/gates.js';
import { getOverloadRisk } from '../rules/crowd.js';
import { adminCrowdUpdateSchema } from './validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * `GET /` — Fetch current crowd levels and overload risk.
 * Polled by both the fan PWA (for crowd banners) and the organizer dashboard (heatmap).
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    const db = getDb();
    const gates = getAllGateStatuses(db);
    const overloadRisk = getOverloadRisk(db);
    res.json({
      gates: gates.map((g) => ({
        id: g.id,
        name: g.name,
        crowd_level: g.current_crowd_level,
        coord_x: g.coord_x,
        coord_y: g.coord_y,
        accessible: g.accessible,
      })),
      overloadRisk,
    });
  } catch (error) {
    logger.error('Error in GET /api/crowd', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * `POST /admin` — Admin mutation endpoint to update a gate's crowd level.
 */
router.post('/admin', (req: Request, res: Response): void => {
  try {
    const parsed = adminCrowdUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const db = getDb();
    const updated = updateGateCrowdLevel(db, parsed.data.gate_id, parsed.data.crowd_level);

    if (updated) {
      res.json({ success: true, gate_id: parsed.data.gate_id, crowd_level: parsed.data.crowd_level });
    } else {
      res.status(404).json({ error: 'Gate not found' });
    }
  } catch (error) {
    logger.error('Error in POST /api/admin/crowd', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
