/**
 * User Statistics Validators
 * Zod schemas for user statistics endpoints
 */

import { z } from 'zod';

export const getUserStatisticsSchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'year', 'all_time']).optional(),
  }),
});

export const getStatisticsByPeriodSchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'year']).default('month'),
    limit: z.string().regex(/^\d+$/, 'Límite debe ser un número').transform((val) => parseInt(val, 10)).optional(),
  }),
});

export const getStatisticsBySportSchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'year', 'all_time']).default('month'),
  }),
});

export const getStatisticsByPlatformSchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'year', 'all_time']).default('month'),
  }),
});


