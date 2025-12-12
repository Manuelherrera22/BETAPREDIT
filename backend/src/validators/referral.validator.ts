/**
 * Referral Validators
 * Validation schemas for referral endpoints
 */

import { z } from 'zod';

export const processReferralSchema = z.object({
  referralCode: z.string().min(1, 'El código de referido es requerido')
    .max(20, 'El código de referido es muy largo')
    .regex(/^[A-Z0-9]+$/, 'El código solo puede contener letras mayúsculas y números'),
});

export type ProcessReferralInput = z.infer<typeof processReferralSchema>;





