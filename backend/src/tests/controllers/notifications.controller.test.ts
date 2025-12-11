/**
 * Notifications Controller Tests
 * Tests for notifications API controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { notificationsController } from '../../api/controllers/notifications.controller';
import { notificationsService } from '../../services/notifications.service';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../services/notifications.service', () => ({
  notificationsService: {
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsClicked: jest.fn(),
    getUnreadCount: jest.fn(),
    deleteNotification: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('NotificationsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
    } as Partial<Request>;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  describe('getMyNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'VALUE_BET_DETECTED',
          title: 'Value Bet Detectado',
          read: false,
        },
      ];

      (notificationsService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);
      mockReq.query = {};

      await notificationsController.getMyNotifications(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(notificationsService.getUserNotifications).toHaveBeenCalledWith('user-1', {});
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockNotifications,
        })
      );
    });

    it('should apply filters from query parameters', async () => {
      (notificationsService.getUserNotifications as jest.Mock).mockResolvedValue([]);
      mockReq.query = {
        read: 'false',
        type: 'VALUE_BET_DETECTED',
        limit: '10',
        offset: '0',
      };

      await notificationsController.getMyNotifications(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(notificationsService.getUserNotifications).toHaveBeenCalledWith('user-1', {
        read: false,
        type: 'VALUE_BET_DETECTED',
        limit: 10,
        offset: 0,
      });
    });

    it('should return 401 when user not authenticated', async () => {
      mockReq.user = undefined;

      await notificationsController.getMyNotifications(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { message: 'Unauthorized' },
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        read: true,
      };

      (notificationsService.markAsRead as jest.Mock).mockResolvedValue(mockNotification);
      mockReq.params = { notificationId: 'notif-1' };

      await notificationsController.markAsRead(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(notificationsService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockNotification,
        })
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (notificationsService.markAllAsRead as jest.Mock).mockResolvedValue({
        updated: 5,
      });

      await notificationsController.markAllAsRead(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(notificationsService.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      (notificationsService.getUnreadCount as jest.Mock).mockResolvedValue({ count: 5 });

      await notificationsController.getUnreadCount(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(notificationsService.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { count: 5 },
        })
      );
    });
  });
});

