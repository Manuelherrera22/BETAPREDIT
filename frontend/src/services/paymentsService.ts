/**
 * Payments Service
 * Frontend service for handling payments and subscriptions
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'PRO';
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description?: string;
  createdAt: string;
}

class PaymentsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(priceId: string): Promise<CheckoutSession> {
    const response = await fetch(`${API_URL}/payments/checkout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create portal session for subscription management
   */
  async createPortalSession(): Promise<{ url: string }> {
    const response = await fetch(`${API_URL}/payments/portal`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create portal session');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get user's subscription
   */
  async getSubscription(): Promise<{
    subscription: Subscription | null;
    userTier: 'FREE' | 'BASIC' | 'PREMIUM' | 'PRO';
    expiresAt?: string;
  }> {
    const response = await fetch(`${API_URL}/payments/subscription`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get subscription');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    const response = await fetch(`${API_URL}/payments/subscription/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(): Promise<void> {
    const response = await fetch(`${API_URL}/payments/subscription/reactivate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to reactivate subscription');
    }
  }
}

export const paymentsService = new PaymentsService();

