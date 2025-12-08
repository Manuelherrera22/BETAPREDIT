/**
 * Payments Controller
 * Handles payment and subscription endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { getStripeService } from '../../services/payments/stripe.service';
import { AppError } from '../../middleware/errorHandler';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

class PaymentsController {
  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { priceId } = req.body;
      if (!priceId) {
        throw new AppError('Price ID is required', 400);
      }

      const stripeService = getStripeService();
      if (!stripeService) {
        throw new AppError('Payment service not configured', 503);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const successUrl = `${frontendUrl}/dashboard?payment=success`;
      const cancelUrl = `${frontendUrl}/pricing?payment=cancelled`;

      const session = await stripeService.createCheckoutSession(
        userId,
        priceId,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create portal session for subscription management
   */
  async createPortalSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const stripeService = getStripeService();
      if (!stripeService) {
        throw new AppError('Payment service not configured', 503);
      }

      // Get user's subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || !subscription.stripeCustomerId) {
        throw new AppError('No active subscription found', 404);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const returnUrl = `${frontendUrl}/profile?tab=subscription`;

      const portalSession = await stripeService.createPortalSession(
        subscription.stripeCustomerId,
        returnUrl
      );

      res.json({
        success: true,
        data: {
          url: portalSession.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's subscription details
   */
  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionTier: true,
          subscriptionExpiresAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          subscription,
          userTier: user?.subscriptionTier,
          expiresAt: user?.subscriptionExpiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const stripeService = getStripeService();
      if (!stripeService) {
        throw new AppError('Payment service not configured', 503);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      await stripeService.cancelSubscription(subscription.stripeSubscriptionId);

      res.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the billing period',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const stripeService = getStripeService();
      if (!stripeService) {
        throw new AppError('Payment service not configured', 503);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new AppError('No active subscription found', 404);
      }

      await stripeService.reactivateSubscription(subscription.stripeSubscriptionId);

      res.json({
        success: true,
        message: 'Subscription reactivated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const stripeService = getStripeService();
      if (!stripeService) {
        throw new AppError('Payment service not configured', 503);
      }

      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        throw new AppError('Missing stripe-signature header', 400);
      }

      // Get raw body for webhook verification
      const payload = req.body;

      await stripeService.handleWebhook(payload, signature);

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();

