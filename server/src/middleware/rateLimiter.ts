import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

const MAX_REQUESTS = 30; // per window
const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Simple in-memory rate limiter per sessionId.
 * Good enough for a hackathon demo — not production-grade.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const sessionId =
    (req.body as Record<string, unknown>)?.sessionId as string ??
    (req.query.sessionId as string) ??
    req.ip ??
    'anonymous';

  const now = Date.now();
  const entry = limits.get(sessionId);

  if (!entry || now > entry.resetAt) {
    limits.set(sessionId, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Rate limit exceeded. Please wait before making more requests.' });
    return;
  }

  entry.count++;
  next();
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limits) {
    if (now > entry.resetAt) {
      limits.delete(key);
    }
  }
}, 5 * 60 * 1000);
