/**
 * External Bets Validators
 * Zod schemas for external bets endpoints
 */

import { z } from 'zod';
import { externalBetSchema } from './bet.validator';

export const registerExternalBetSchema = z.object({
  body: externalBetSchema,
});

export const getExternalBetsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'WON', 'LOST', 'VOID', 'CANCELLED', 'PARTIAL_WIN']).optional(),
    platform: z.string().min(1).optional(),
    limit: z.string().regex(/^\d+$/, 'Límite debe ser un número').transform((val) => parseInt(val, 10)).optional(),
    offset: z.string().regex(/^\d+$/, 'Offset debe ser un número').transform((val) => parseInt(val, 10)).optional(),
    startDate: z.string().datetime('Fecha de inicio inválida').optional(),
    endDate: z.string().datetime('Fecha de fin inválida').optional(),
  }),
});

export const updateBetResultSchema = z.object({
  params: z.object({
    betId: z.string().uuid('Bet ID inválido'),
  }),
  body: z.object({
    result: z.enum(['WON', 'LOST', 'VOID', 'CANCELLED']),
    actualWin: z.number().min(0).optional(),
  }),
});

export const deleteExternalBetSchema = z.object({
  params: z.object({
    betId: z.string().uuid('Bet ID inválido'),
  }),
});

