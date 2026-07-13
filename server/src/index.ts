/**
 * @module index
 * @description ArenaMind backend entry point.
 *
 * Bootstraps the Express application with security middleware (Helmet, CORS),
 * initializes the SQLite database, mounts all API route handlers, and serves
 * the production React build as static assets. In development the Vite dev
 * server proxies API calls here; in production Express serves everything.
 *
 * @see {@link config} for environment variable documentation.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { getDb } from './db/connection.js';
import { seedDatabase } from './db/seed.js';
import askRouter from './api/ask.js';
import incidentRouter from './api/incident.js';
import crowdRouter from './api/crowd.js';
import organizerRouter from './api/organizer.js';
import tournamentRouter from './api/tournament.js';
import ticketRouter from './api/ticket.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: config.maxBodySize }));
app.use('/api', rateLimiter);

// ─── Database Setup ──────────────────────────────────────────────────────────
const db = getDb();
seedDatabase(db);
logger.info('Database initialized and seeded');

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

app.use(express.static(clientBuildPath));

// ─── Health Check ────────────────────────────────────────────────────────────

/**
 * `GET /api/health` — Returns server status, AI mode, and current timestamp.
 * Used by uptime monitors and deployment health checks.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiMode: config.geminiApiKey ? 'gemini' : 'deterministic',
    model: config.geminiModel,
    timestamp: new Date().toISOString(),
  });
});

// ─── Catch-All Route for React Router ────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.method !== 'GET') return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  const aiMode = config.geminiApiKey ? 'Gemini (Live)' : 'DeterministicLLM (template fallback)';
  logger.info('ArenaMind server started', {
    port: config.port,
    aiMode,
    environment: config.nodeEnv,
  });
});

export default app;
