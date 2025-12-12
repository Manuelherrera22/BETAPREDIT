/**
 * User Profile Validators
 * Zod schemas for user profile endpoints
 */

import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido').optional(),
    dateOfBirth: z.string().datetime('Fecha de nacimiento inválida').optional(),
    timezone: z.string().optional(),
    preferredCurrency: z.string().length(3, 'Código de moneda inválido').optional(),
    preferredMode: z.enum(['casual', 'pro']).optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];

