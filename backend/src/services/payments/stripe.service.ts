/**
 * Stripe Payment Service
 * Handles all Stripe integration for subscriptions and payments
 */

import Stripe from 'stripe';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
  apiVersion?: '2024-11-20.acacia' | '2024-10-28.acacia';
}

class StripeService {
  private stripe: Stripe;
  private webhookSecret?: string;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: (config.apiVersion || '2024-11-20.acacia') as any,
    });
    this.webhookSecret = config.webhookSecret;
    logger.info('Stripe service initialized');
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      logger.info(`Checkout session created for user ${userId}: ${session.id}`);
      return session;
    } catch (error: any) {
      logger.error('Error creating checkout session:', error);
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  /**
   * Create a customer portal session for subscription management
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error: any) {
      logger.error('Error creating portal session:', error);
      throw new AppError('Failed to create portal session', 500);
    }
  }

  /**
   * Get or create Stripe customer for user
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if user already has a customer ID stored
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      // For now, we'll create a new customer each time
      // In production, you'd store the customer ID in the database
      const customer = await this.stripe.customers.create({
        email,
        name: name || email,
        metadata: {
          userId,
        },
      });

      logger.info(`Stripe customer created/retrieved for user ${userId}: ${customer.id}`);
      return customer.id;
    } catch (error: any) {
      logger.error('Error getting/creating customer:', error);
      throw new AppError('Failed to get or create customer', 500);
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<void> {
    if (!this.webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (error: any) {
      logger.error('Webhook signature verification failed:', error);
      throw new AppError('Invalid webhook signature', 400);
    }

    logger.info(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) {
      logger.warn('Checkout session completed but no userId in metadata');
      return;
    }

    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      logger.warn('Checkout session completed but no subscription ID');
      return;
    }

    // Get subscription details
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const customerId = subscription.customer as string;

    // Map price ID to subscription tier
    const tier = this.mapPriceIdToTier(priceId);

    // Update or create subscription in database
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        tier,
        status: 'ACTIVE',
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Update user subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000),
      },
    });

    logger.info(`Subscription activated for user ${userId}: ${tier}`);
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      // Try to find by subscription ID
      const existing = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!existing) {
        logger.warn('Subscription updated but no userId found');
        return;
      }
      // Use existing userId
      const priceId = subscription.items.data[0]?.price.id;
      const tier = this.mapPriceIdToTier(priceId);
      const customerId = subscription.customer as string;

      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          tier,
          status: this.mapStripeStatusToOurStatus(subscription.status),
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          subscriptionTier: tier,
          subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000),
        },
      });

      logger.info(`Subscription updated for user ${existing.userId}: ${tier}`);
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const tier = this.mapPriceIdToTier(priceId);
    const customerId = subscription.customer as string;

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        tier,
        status: this.mapStripeStatusToOurStatus(subscription.status),
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        tier,
        status: this.mapStripeStatusToOurStatus(subscription.status),
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000),
      },
    });

    logger.info(`Subscription updated for user ${userId}: ${tier}`);
  }

  /**
   * Handle subscription deleted (cancelled)
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    let actualUserId = userId;

    if (!actualUserId) {
      // Try to find by subscription ID
      const existing = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!existing) {
        logger.warn('Subscription deleted but no userId found');
        return;
      }
      actualUserId = existing.userId;
    }

    await prisma.subscription.updateMany({
      where: { userId: actualUserId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: actualUserId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000),
      },
    });

    logger.info(`Subscription cancelled for user ${actualUserId}`);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    let actualUserId = userId;
    let existingSubscription = null;
    if (!actualUserId) {
      existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (!existingSubscription) return;
      actualUserId = existingSubscription.userId;
    } else {
      existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: actualUserId,
        subscriptionId: existingSubscription?.id,
        stripePaymentId: (invoice as any).payment_intent as string,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'COMPLETED',
        description: invoice.description || 'Subscription payment',
      },
    });

    logger.info(`Payment succeeded for user ${actualUserId}: ${invoice.amount_paid / 100} ${invoice.currency}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    let actualUserId = userId;
    if (!actualUserId) {
      const existing = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (!existing) return;
      actualUserId = existing.userId;
    }

    // Find subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    // Create payment record with failed status
    await prisma.payment.create({
      data: {
        userId: actualUserId,
        subscriptionId: existingSub?.id,
        stripePaymentId: (invoice as any).payment_intent as string,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'FAILED',
        description: invoice.description || 'Subscription payment failed',
      },
    });

    // Update subscription status
    await prisma.subscription.updateMany({
      where: { userId: actualUserId },
      data: {
        status: 'PAST_DUE',
      },
    });

    logger.warn(`Payment failed for user ${actualUserId}: ${invoice.amount_due / 100} ${invoice.currency}`);

    // You might want to send an email notification here
  }

  /**
   * Map Stripe price ID to subscription tier
   */
  private mapPriceIdToTier(priceId: string): 'FREE' | 'BASIC' | 'PREMIUM' | 'PRO' {
    // This should match your Stripe price IDs
    // You'll configure these in your Stripe dashboard
    // For now, we'll use environment variables
    const priceIdMap: Record<string, 'BASIC' | 'PREMIUM' | 'PRO'> = {
      [process.env.STRIPE_PRICE_ID_BASIC || '']: 'BASIC',
      [process.env.STRIPE_PRICE_ID_PREMIUM || '']: 'PREMIUM',
      [process.env.STRIPE_PRICE_ID_PRO || '']: 'PRO',
    };

    return priceIdMap[priceId] || 'FREE';
  }

  /**
   * Map Stripe subscription status to our status
   */
  private mapStripeStatusToOurStatus(
    stripeStatus: string
  ): 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' {
    const statusMap: Record<string, 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING'> = {
      active: 'ACTIVE',
      cancelled: 'CANCELLED',
      past_due: 'PAST_DUE',
      unpaid: 'UNPAID',
      trialing: 'TRIALING',
    };

    return statusMap[stripeStatus.toLowerCase()] || 'ACTIVE';
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      logger.info(`Subscription ${subscriptionId} scheduled for cancellation`);
      return subscription;
    } catch (error: any) {
      logger.error('Error cancelling subscription:', error);
      throw new AppError('Failed to cancel subscription', 500);
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      logger.info(`Subscription ${subscriptionId} reactivated`);
      return subscription;
    } catch (error: any) {
      logger.error('Error reactivating subscription:', error);
      throw new AppError('Failed to reactivate subscription', 500);
    }
  }
}

// Singleton instance
let stripeServiceInstance: StripeService | null = null;

export function createStripeService(config: StripeConfig): StripeService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService(config);
  }
  return stripeServiceInstance;
}

export function getStripeService(): StripeService | null {
  return stripeServiceInstance;
}

export function initializeStripeService() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secretKey) {
    createStripeService({
      secretKey,
      webhookSecret,
      apiVersion: '2024-11-20.acacia',
    });
    logger.info('Stripe service initialized');
  } else {
    logger.warn('Stripe secret key not found. Payment features will not be available.');
  }
}

