/**
 * @module tests/api
 * @description API contract and integration unit tests.
 *
 * Verifies HTTP contract responses for health checks, input schema validation,
 * and deterministic offline AI responses.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('API Contract Tests', () => {
  it('GET /api/health returns status ok with aiMode and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('aiMode');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/crowd returns gates array and overloadRisk', async () => {
    const res = await request(app).get('/api/crowd');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.gates)).toBe(true);
    expect(res.body.gates.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('overloadRisk');
  });

  it('POST /api/ask rejects malformed payloads with 400', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({ role: 'fan' }); // missing message, language, and sessionId

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid request');
  });

  it('POST /api/ask returns offline fallback response for valid query when no API key', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        role: 'fan',
        message: 'Where is the nearest restroom?',
        language: 'en',
        sessionId: 'test-session-123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(Array.isArray(res.body.toolsUsed)).toBe(true);
  });
});
