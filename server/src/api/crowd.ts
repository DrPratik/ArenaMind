import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { getAllGateStatuses, updateGateCrowdLevel } from '../rules/gates.js';
import { getOverloadRisk } from '../rules/crowd.js';
import { adminCrowdUpdateSchema } from './validation.js';

const router = Router();

/**
 * GET /api/crowd — current crowd levels per gate.
 * Polled by both the fan PWA (for crowd banners) and the dashboard (for the heatmap).
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
    console.error('Error in GET /api/crowd:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/crowd — demo control panel endpoint.
 * Mutates a gate's crowd level and logs the change.
 * This is the key "trigger" for the live demo causality loop.
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
    console.error('Error in POST /api/admin/crowd:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
