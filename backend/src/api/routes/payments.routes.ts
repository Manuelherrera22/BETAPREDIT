/**
 * Payments Routes
 */

import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
  cancelSubscriptionSchema,
  reactivateSubscriptionSchema,
} from '../../validators/payments.validator';
import express from 'express';

const router = Router();

// Webhook endpoint (no auth required, uses Stripe signature)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Raw body for webhook verification
  paymentsController.handleWebhook.bind(paymentsController)
);

// All other routes require authentication
router.use(authenticate);

// Create checkout session
router.post(
  '/checkout',
  validate(createCheckoutSessionSchema),
  paymentsController.createCheckoutSession.bind(paymentsController)
);

// Create portal session
router.post(
  '/portal',
  validate(createPortalSessionSchema),
  paymentsController.createPortalSession.bind(paymentsController)
);

// Get subscription
router.get(
  '/subscription',
  paymentsController.getSubscription.bind(paymentsController)
);

// Cancel subscription
router.post(
  '/subscription/cancel',
  validate(cancelSubscriptionSchema),
  paymentsController.cancelSubscription.bind(paymentsController)
);

// Reactivate subscription
router.post(
  '/subscription/reactivate',
  validate(reactivateSubscriptionSchema),
  paymentsController.reactivateSubscription.bind(paymentsController)
);

export default router;




