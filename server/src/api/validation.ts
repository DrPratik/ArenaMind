import { z } from 'zod';

export const askRequestSchema = z.object({
  role: z.enum(['fan', 'volunteer', 'organizer']),
  message: z.string().min(1).max(2000),
  language: z.enum(['en', 'es', 'pt', 'fr', 'hi', 'ar']).default('en'),
  imageBase64: z.string().optional(),
  sessionId: z.string().min(1).max(100),
});

export const incidentRequestSchema = z.object({
  note: z.string().min(1).max(2000),
  location: z.string().min(1).max(500),
  gate_id: z.number().int().min(1).max(8),
  photo_url: z.string().url().optional(),
  sessionId: z.string().min(1).max(100),
  type: z.enum(['medical', 'security', 'maintenance', 'crowd', 'lost_child', 'other']).optional(),
});

export const adminCrowdUpdateSchema = z.object({
  gate_id: z.number().int().min(1).max(8),
  crowd_level: z.enum(['low', 'moderate', 'busy', 'critical']),
});

export const incidentStatusUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
});
