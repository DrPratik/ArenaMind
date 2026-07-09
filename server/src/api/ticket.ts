import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

/**
 * GET /api/ticket/scan/:qrPayload
 * Fetches ticket details by QR payload (barcode string).
 */
router.get('/scan/:qrPayload', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const qrPayload = req.params.qrPayload as string;

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE qr_payload = ?')
      .get(qrPayload) as any;

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
    console.error('Error scanning ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
