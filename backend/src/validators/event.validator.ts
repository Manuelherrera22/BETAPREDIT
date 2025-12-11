/**
 * Event Validators
 * Validation schemas for event endpoints
 */

import { z } from 'zod';

// Schema for query parameters when getting events
export const getEventsQuerySchema = z.object({
  sportId: z.string().optional(),
  sportSlug: z.string().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'SUSPENDED']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(100)
  ).optional().default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(0)
  ).optional().default('0'),
  useTheOddsAPI: z.string().transform((val) => val === 'true').pipe(z.boolean()).optional(),
});

// Schema for syncing events
export const syncEventsSchema = z.object({
  sportKey: z.string().min(1, 'La clave del deporte es requerida').optional(),
  force: z.boolean().optional().default(false),
});

// Schema for getting event details
export const getEventDetailsParamsSchema = z.object({
  eventId: z.string().uuid('Event ID inválido'),
});

export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;
export type SyncEventsInput = z.infer<typeof syncEventsSchema>;
export type GetEventDetailsParams = z.infer<typeof getEventDetailsParamsSchema>;

