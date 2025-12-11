/**
 * Notifications Service Tests
 * Tests for notification management service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { notificationsService } from '../services/notifications.service';
import { prisma } from '../config/database';
import { webSocketService } from '../services/websocket.service';
import { emailService } from '../services/email.service';
import { AppError } from '../middleware/errorHandler';

// Mock dependencies
jest.mock('../config/database', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../services/websocket.service', () => ({
  webSocketService: {
    emitNotification: jest.fn(),
  },
}));

jest.mock('../services/email.service', () => ({
  emailService: {
    sendEmail: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'VALUE_BET_DETECTED',
        title: 'Value Bet Detected',
        message: 'A value bet has been detected',
        data: { eventId: 'event-1' },
        read: false,
        createdAt: new Date(),
        sentVia: ['in_app'],
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      };

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (emailService.sendEmail as jest.Mock).mockResolvedValue(true);

      const result = await notificationsService.createNotification({
        userId: 'user-1',
        type: 'VALUE_BET_DETECTED',
        title: 'Value Bet Detected',
        message: 'A value bet has been detected',
        data: { eventId: 'event-1' },
      });

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(webSocketService.emitNotification).toHaveBeenCalledWith('user-1', expect.any(Object));
      expect(result).toEqual(mockNotification);
    });

    it('should send email for email-required notification types', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'SYSTEM_ALERT',
        title: 'System Alert',
        message: 'Important system update',
        read: false,
        createdAt: new Date(),
        sentVia: ['in_app'],
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      };

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        sentVia: ['in_app', 'email'],
        sentAt: new Date(),
      });
      (emailService.sendEmail as jest.Mock).mockResolvedValue(true);

      await notificationsService.createNotification({
        userId: 'user-1',
        type: 'SYSTEM_ALERT',
        title: 'System Alert',
        message: 'Important system update',
      });

      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1' },
          data: expect.objectContaining({
            sentVia: ['in_app', 'email'],
          }),
        })
      );
    });

    it('should handle email sending errors gracefully', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'SYSTEM_ALERT',
        title: 'System Alert',
        message: 'Important system update',
        read: false,
        createdAt: new Date(),
        sentVia: ['in_app'],
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      };

      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification);
      (emailService.sendEmail as jest.Mock).mockRejectedValue(new Error('Email service unavailable'));

      const result = await notificationsService.createNotification({
        userId: 'user-1',
        type: 'SYSTEM_ALERT',
        title: 'System Alert',
        message: 'Important system update',
      });

      // Should still create notification even if email fails
      expect(result).toBeDefined();
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should throw error if notification creation fails', async () => {
      (prisma.notification.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        notificationsService.createNotification({
          userId: 'user-1',
          type: 'VALUE_BET_DETECTED',
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with default options', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'VALUE_BET_DETECTED',
          title: 'Value Bet',
          message: 'A value bet was detected',
          read: false,
          createdAt: new Date(),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await notificationsService.getUserNotifications('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should filter by read status', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          read: false,
          createdAt: new Date(),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      await notificationsService.getUserNotifications('user-1', { read: false });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter by notification type', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await notificationsService.getUserNotifications('user-1', { type: 'VALUE_BET_DETECTED' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'VALUE_BET_DETECTED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should respect limit and offset', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await notificationsService.getUserNotifications('user-1', { limit: 10, offset: 20 });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        read: false,
        readAt: null,
      };

      (prisma.notification.update as jest.Mock).mockResolvedValue({
        ...mockNotification,
        read: true,
        readAt: new Date(),
      });

      const result = await notificationsService.markAsRead('notif-1', 'user-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
      expect(result.read).toBe(true);
    });

    it('should throw error if notification not found', async () => {
      (prisma.notification.update as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(notificationsService.markAsRead('notif-1', 'user-1')).rejects.toThrow();
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const count = await notificationsService.getUnreadCount('user-1');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          read: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } },
          ],
        },
      });
      expect(count).toBe(5);
    });
  });
});

