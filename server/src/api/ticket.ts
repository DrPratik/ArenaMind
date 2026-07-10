/**
 * @module api/ticket
 * @description QR Ticket validation and scan endpoint.
 *
 * `GET /api/ticket/scan/:qrPayload` validates a fan's ticket barcode/payload
 * against the SQLite database and returns gate assignment, section, seat,
 * and status.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { logger } from '../utils/logger.js';

const router = Router();

interface TicketRow {
  id: number;
  persona_id: number;
  qr_payload: string;
  gate_id: number;
  section: string;
  seat: string;
  status: string;
}

/**
 * `GET /scan/:qrPayload` — Look up ticket details by barcode QR payload.
 */
router.get('/scan/:qrPayload', (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const qrPayload = req.params.qrPayload as string;

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE qr_payload = ?')
      .get(qrPayload) as TicketRow | undefined;

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json({
      ticket: {
        id: ticket.id,
        personaId: ticket.persona_id,
        qrPayload: ticket.qr_payload,
        gateId: ticket.gate_id,
        section: ticket.section,
        seat: ticket.seat,
        status: ticket.status,
      },
    });
  } catch (error) {
    logger.error('Error scanning ticket', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
