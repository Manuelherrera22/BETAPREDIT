/**
 * Bet Validators
 * Validation schemas for betting endpoints
 */

import { z } from 'zod';

export const placeBetSchema = z.object({
  eventId: z.string().uuid('Event ID inválido'),
  marketId: z.string().uuid('Market ID inválido'),
  oddsId: z.string().uuid('Odds ID inválido'),
  type: z.enum(['SINGLE', 'MULTIPLE', 'SYSTEM'], {
    errorMap: () => ({ message: 'Tipo de apuesta inválido' }),
  }),
  selection: z.string().min(1, 'La selección es requerida'),
  stake: z.number().min(0.01, 'El stake debe ser al menos 0.01')
    .max(10000, 'El stake no puede exceder 10000'),
});

export const externalBetSchema = z.object({
  eventId: z.string().uuid('Event ID inválido').optional(),
  externalEventId: z.string().optional(),
  platform: z.string().min(1, 'La plataforma es requerida'),
  platformBetId: z.string().optional(),
  platformUrl: z.string().url('URL inválida').optional(),
  marketType: z.string().min(1, 'El tipo de mercado es requerido'),
  selection: z.string().min(1, 'La selección es requerida'),
  odds: z.number().min(1.01, 'Las cuotas deben ser al menos 1.01')
    .max(1000, 'Las cuotas no pueden exceder 1000'),
  stake: z.number().min(0.01, 'El stake debe ser al menos 0.01')
    .max(10000, 'El stake no puede exceder 10000'),
  currency: z.string().length(3, 'Código de moneda inválido').default('USD'),
  betPlacedAt: z.string().datetime('Fecha inválida').optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

export type PlaceBetInput = z.infer<typeof placeBetSchema>;
export type ExternalBetInput = z.infer<typeof externalBetSchema>;



