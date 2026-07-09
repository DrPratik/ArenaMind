import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import askRouter from './api/ask.js';
import incidentRouter from './api/incident.js';
import crowdRouter from './api/crowd.js';
import organizerRouter from './api/organizer.js';
import tournamentRouter from './api/tournament.js';
import ticketRouter from './api/ticket.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow image uploads

// ─── Database Setup ──────────────────────────────────────────────────────────
const db = getDb();
seedDatabase(db);
console.log('✅ Database initialized and seeded');

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/ask', askRouter);
app.use('/api/incident', incidentRouter);
app.use('/api/crowd', crowdRouter);
app.use('/api/organizer', organizerRouter);
app.use('/api/tournament', tournamentRouter);
app.use('/api/ticket', ticketRouter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    aiMode: hasGeminiKey ? 'gemini' : 'mockLlm',
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const aiMode = process.env.GEMINI_API_KEY ? 'Gemini 2.5 Flash' : 'MockLLM (template fallback)';
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║          🏟️  ArenaMind Server Running            ║
  ║──────────────────────────────────────────────────║
  ║  Port:     ${PORT}                                ║
  ║  AI Mode:  ${aiMode.padEnd(35)}║
  ║  Database: SQLite (arenamind.db)                 ║
  ╚══════════════════════════════════════════════════╝
  `);
});

export default app;
