/**
 * Notifications Service
 * Frontend service for managing notifications
 */

import api from './api';

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
  }): Promise<Notification[]> => {
    const { data } = await api.get('/notifications/my-notifications', {
      params: filters,
    });
    return data.data as Notification[];
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },

  /**
   * Mark notification as clicked
   */
  markAsClicked: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/click`);
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};

