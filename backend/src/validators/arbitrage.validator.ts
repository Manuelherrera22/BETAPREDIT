/**
 * Arbitrage Validators
 * Validation schemas for arbitrage endpoints
 */

import { z } from 'zod';

export const calculateStakesSchema = z.object({
  totalStake: z.number().min(1, 'El stake total debe ser al menos 1')
    .max(10000, 'El stake total no puede exceder 10000'),
  odds: z.array(z.object({
    bookmaker: z.string().min(1),
    odds: z.number().min(1.01).max(1000),
    selection: z.string().min(1),
  })).min(2, 'Se requieren al menos 2 cuotas para arbitraje'),
});

export type CalculateStakesInput = z.infer<typeof calculateStakesSchema>;





