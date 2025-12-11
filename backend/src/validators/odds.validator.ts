/**
 * Odds Validators
 * Validation schemas for odds endpoints
 */

import { z } from 'zod';

// Schema for query parameters when getting odds
export const getOddsQuerySchema = z.object({
  eventId: z.string().uuid('Event ID inválido').optional(),
  marketId: z.string().uuid('Market ID inválido').optional(),
  sportId: z.string().optional(),
  sportSlug: z.string().optional(),
  marketType: z.string().optional(),
  bookmaker: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(100)
  ).optional().default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(0)
  ).optional().default('0'),
});

// Schema for getting odds history
export const getOddsHistoryQuerySchema = z.object({
  eventId: z.string().uuid('Event ID inválido'),
  marketId: z.string().uuid('Market ID inválido').optional(),
  selection: z.string().min(1, 'La selección es requerida').optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(1000)
  ).optional().default('100'),
});

// Schema for comparing odds
export const compareOddsSchema = z.object({
  eventId: z.string().uuid('Event ID inválido'),
  marketType: z.string().min(1, 'El tipo de mercado es requerido'),
  selection: z.string().min(1, 'La selección es requerida').optional(),
});

export type GetOddsQuery = z.infer<typeof getOddsQuerySchema>;
export type GetOddsHistoryQuery = z.infer<typeof getOddsHistoryQuerySchema>;
export type CompareOddsInput = z.infer<typeof compareOddsSchema>;

