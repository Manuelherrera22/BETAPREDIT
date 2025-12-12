/**
 * Bets Query Validators
 * Validation schemas for bet query endpoints
 */

import { z } from 'zod';

export const getMyBetsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'WON', 'LOST', 'VOID', 'CANCELLED']).optional(),
    eventId: z.string().uuid('Event ID inválido').optional(),
    limit: z.string().regex(/^\d+$/, 'Límite debe ser un número').transform((val) => parseInt(val, 10)).optional(),
    offset: z.string().regex(/^\d+$/, 'Offset debe ser un número').transform((val) => parseInt(val, 10)).optional(),
    startDate: z.string().datetime('Fecha de inicio inválida').optional(),
    endDate: z.string().datetime('Fecha de fin inválida').optional(),
  }),
});

export const getBetDetailsSchema = z.object({
  params: z.object({
    betId: z.string().uuid('Bet ID inválido'),
  }),
});

export const getBetHistorySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'WON', 'LOST', 'VOID', 'CANCELLED']).optional(),
    eventId: z.string().uuid('Event ID inválido').optional(),
    startDate: z.string().datetime('Fecha de inicio inválida').optional(),
    endDate: z.string().datetime('Fecha de fin inválida').optional(),
    limit: z.string().regex(/^\d+$/, 'Límite debe ser un número').transform((val) => parseInt(val, 10)).optional(),
  }),
});

export const cancelBetSchema = z.object({
  params: z.object({
    betId: z.string().uuid('Bet ID inválido'),
  }),
});

