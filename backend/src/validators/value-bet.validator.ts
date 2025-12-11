/**
 * Value Bet Validators
 * Validation schemas for value bet detection endpoints
 */

import { z } from 'zod';

// Schema for scanning value bets
export const scanValueBetsSchema = z.object({
  sport: z.string().min(1, 'El deporte es requerido').optional(),
  regions: z.array(z.string()).optional(),
  markets: z.array(z.string()).optional(),
  minValue: z.number()
    .min(0, 'El valor mínimo debe ser al menos 0')
    .max(1, 'El valor mínimo no puede exceder 1')
    .optional()
    .default(0.05),
  limit: z.number()
    .min(1, 'El límite debe ser al menos 1')
    .max(100, 'El límite no puede exceder 100')
    .optional()
    .default(50),
});

// Schema for getting value bet alerts
export const getValueBetAlertsQuerySchema = z.object({
  userId: z.string().uuid('User ID inválido').optional(),
  status: z.enum(['ACTIVE', 'TRIGGERED', 'EXPIRED', 'CANCELLED']).optional(),
  sport: z.string().optional(),
  minValue: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).pipe(
    z.number().min(0).max(1)
  ).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(100)
  ).optional().default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(0)
  ).optional().default('0'),
});

// Schema for creating a value bet alert
export const createValueBetAlertSchema = z.object({
  eventId: z.string().uuid('Event ID inválido').optional(),
  marketId: z.string().uuid('Market ID inválido').optional(),
  selection: z.string().min(1, 'La selección es requerida'),
  minValue: z.number()
    .min(0.01, 'El valor mínimo debe ser al menos 0.01')
    .max(1, 'El valor mínimo no puede exceder 1'),
  sport: z.string().min(1, 'El deporte es requerido').optional(),
  maxOdds: z.number()
    .min(1.01, 'Las cuotas máximas deben ser al menos 1.01')
    .max(1000, 'Las cuotas máximas no pueden exceder 1000')
    .optional(),
  minOdds: z.number()
    .min(1.01, 'Las cuotas mínimas deben ser al menos 1.01')
    .max(1000, 'Las cuotas mínimas no pueden exceder 1000')
    .optional(),
  expiresAt: z.string().datetime('Fecha de expiración inválida').optional(),
});

// Schema for updating a value bet alert
export const updateValueBetAlertSchema = z.object({
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
  minValue: z.number()
    .min(0.01, 'El valor mínimo debe ser al menos 0.01')
    .max(1, 'El valor mínimo no puede exceder 1')
    .optional(),
  maxOdds: z.number()
    .min(1.01, 'Las cuotas máximas deben ser al menos 1.01')
    .max(1000, 'Las cuotas máximas no pueden exceder 1000')
    .optional(),
  minOdds: z.number()
    .min(1.01, 'Las cuotas mínimas deben ser al menos 1.01')
    .max(1000, 'Las cuotas mínimas no pueden exceder 1000')
    .optional(),
  expiresAt: z.string().datetime('Fecha de expiración inválida').optional(),
});

export type ScanValueBetsInput = z.infer<typeof scanValueBetsSchema>;
export type GetValueBetAlertsQuery = z.infer<typeof getValueBetAlertsQuerySchema>;
export type CreateValueBetAlertInput = z.infer<typeof createValueBetAlertSchema>;
export type UpdateValueBetAlertInput = z.infer<typeof updateValueBetAlertSchema>;

