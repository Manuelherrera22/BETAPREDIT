/**
 * User Preferences Validators
 * Zod schemas for user preferences endpoints
 */

import { z } from 'zod';

export const updateUserPreferencesSchema = z.object({
  body: z.object({
    timezone: z.string().optional(),
    preferredCurrency: z.string().length(3, 'Código de moneda inválido').optional(),
    preferredMode: z.enum(['casual', 'pro']).optional(),
    alertPreferences: z.object({
      valueBetMin: z.number().min(0).max(100).optional(),
      sports: z.array(z.string()).optional(),
      platforms: z.array(z.string()).optional(),
    }).optional(),
  }),
});

export const updateValueBetPreferencesSchema = z.object({
  body: z.object({
    minValue: z.number().min(0).max(1, 'Valor mínimo debe estar entre 0 y 1').optional(),
    sports: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional(),
    notifications: z.boolean().optional(),
    emailAlerts: z.boolean().optional(),
    pushAlerts: z.boolean().optional(),
  }),
});

export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>['body'];
export type UpdateValueBetPreferencesInput = z.infer<typeof updateValueBetPreferencesSchema>['body'];

