/**
 * Payments Validators
 * Zod schemas for payments endpoints
 */

import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    priceId: z.string().min(1, 'Price ID es requerido'),
    successUrl: z.string().url('URL de éxito inválida').optional(),
    cancelUrl: z.string().url('URL de cancelación inválida').optional(),
  }),
});

export const createPortalSessionSchema = z.object({
  body: z.object({
    returnUrl: z.string().url('URL de retorno inválida'),
  }),
});

export const cancelSubscriptionSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export const reactivateSubscriptionSchema = z.object({
  body: z.object({
    priceId: z.string().min(1, 'Price ID es requerido').optional(),
  }),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>['body'];
export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>['body'];
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>['body'];
export type ReactivateSubscriptionInput = z.infer<typeof reactivateSubscriptionSchema>['body'];


