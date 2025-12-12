/**
 * Notifications Service
 * Frontend service for managing notifications
 * Uses Supabase Edge Functions in production, backend API in development
 */

import api from './api';
import { isSupabaseConfigured } from '../config/supabase';

// Get Supabase Functions URL
const getSupabaseFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
};

// Helper to get Supabase auth token
const getSupabaseAuthToken = async (): Promise<string | null> => {
  try {
    const { supabase } = await import('../config/supabase');
    if (!supabase) return null;
    
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      console.warn('No Supabase session found:', error?.message);
      return null;
    }
    return session.access_token;
  } catch (error) {
    console.error('Error getting Supabase auth token:', error);
    return null;
  }
};

export interface Notification {
  id: string;
  userId: string;
  type: 'VALUE_BET_DETECTED' | 'ODDS_CHANGED' | 'PREDICTION_READY' | 'BET_SETTLED' | 'STATS_UPDATE' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  clicked: boolean;
  clickedAt?: string;
  sentVia: string[];
  sentAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export const notificationsService = {
  /**
   * Get all notifications for the current user
   */
  getMyNotifications: async (filters?: {
    read?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> => {
    try {
      // Use Supabase Edge Function in production
      if (isSupabaseConfigured() && import.meta.env.PROD) {
        const supabaseUrl = getSupabaseFunctionsUrl();
        if (!supabaseUrl) {
          throw new Error('Supabase not configured');
        }

        const token = await getSupabaseAuthToken();
        if (!token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const params = new URLSearchParams();
        if (filters?.read !== undefined) params.set('read', filters.read.toString());
        if (filters?.type) params.set('type', filters.type);
        if (filters?.limit) params.set('limit', filters.limit.toString());
        if (filters?.offset) params.set('offset', filters.offset.toString());

        const response = await fetch(`${supabaseUrl}/notifications?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch notifications');
        }

        const result = await response.json();
        return Array.isArray(result?.data) ? result.data : [];
      }

      // Fallback to backend API in development
      const { data } = await api.get('/notifications/my-notifications', {
        params: filters,
      });
      return Array.isArray(data?.data) ? data.data : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      // Use Supabase Edge Function in production
      if (isSupabaseConfigured() && import.meta.env.PROD) {
        const supabaseUrl = getSupabaseFunctionsUrl();
        if (!supabaseUrl) {
          throw new Error('Supabase not configured');
        }

        const token = await getSupabaseAuthToken();
        if (!token) {
          throw new Error('No authentication token available. Please log in.');
        }

        const response = await fetch(`${supabaseUrl}/notifications/unread-count`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch unread count');
        }

        const result = await response.json();
        return result.data?.count || 0;
      }

      // Fallback to backend API in development
      const { data } = await api.get('/notifications/unread-count');
      return data.data?.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    // Use Supabase Edge Function in production
    if (isSupabaseConfigured() && import.meta.env.PROD) {
      const supabaseUrl = getSupabaseFunctionsUrl();
      if (!supabaseUrl) {
        throw new Error('Supabase not configured');
      }

      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const response = await fetch(`${supabaseUrl}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to mark notification as read');
      }

      return;
    }

    // Fallback to backend API in development
    await api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    // Use Supabase Edge Function in production
    if (isSupabaseConfigured() && import.meta.env.PROD) {
      const supabaseUrl = getSupabaseFunctionsUrl();
      if (!supabaseUrl) {
        throw new Error('Supabase not configured');
      }

      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const response = await fetch(`${supabaseUrl}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to mark all notifications as read');
      }

      return;
    }

    // Fallback to backend API in development
    await api.patch('/notifications/read-all');
  },

  /**
   * Mark notification as clicked
   */
  markAsClicked: async (notificationId: string): Promise<void> => {
    // Use Supabase Edge Function in production
    if (isSupabaseConfigured() && import.meta.env.PROD) {
      const supabaseUrl = getSupabaseFunctionsUrl();
      if (!supabaseUrl) {
        throw new Error('Supabase not configured');
      }

      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const response = await fetch(`${supabaseUrl}/notifications/${notificationId}/click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to mark notification as clicked');
      }

      return;
    }

    // Fallback to backend API in development
    await api.patch(`/notifications/${notificationId}/click`);
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    // Use Supabase Edge Function in production
    if (isSupabaseConfigured() && import.meta.env.PROD) {
      const supabaseUrl = getSupabaseFunctionsUrl();
      if (!supabaseUrl) {
        throw new Error('Supabase not configured');
      }

      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const response = await fetch(`${supabaseUrl}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete notification');
      }

      return;
    }

    // Fallback to backend API in development
    await api.delete(`/notifications/${notificationId}`);
  },
};

