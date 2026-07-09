import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
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

// ─── Static Frontend Serving (For Production) ────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');

// Serve static files from the React app
app.use(express.static(clientBuildPath));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    aiMode: hasGeminiKey ? 'gemini' : 'mockLlm',
    timestamp: new Date().toISOString(),
  });
});

// ─── Catch-All Route for React Router ────────────────────────────────────────
app.use((req, res, next) => {
  // Only serve index.html if the request isn't for an API route and is a GET request
  if (req.path.startsWith('/api/') || req.method !== 'GET') return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'));
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
