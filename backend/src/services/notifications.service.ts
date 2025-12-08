import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  expiresAt?: Date;
}

class NotificationsService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type as any,
          title: data.title,
          message: data.message,
          data: data.data as any,
          expiresAt: data.expiresAt,
          sentVia: ['in_app'],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Notification created: ${notification.id} for user ${data.userId}`);
      return notification;
    } catch (error: any) {
      logger.error('Error creating notification:', error);
      throw new AppError('Failed to create notification', 500);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      read?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { read, type, limit = 50, offset = 0 } = options;

    const where: any = { userId };

    if (read !== undefined) {
      where.read = read;
    }

    if (type) {
      where.type = type;
    }

    // Don't show expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Mark notification as clicked
   */
  async markAsClicked(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        clicked: true,
        clickedAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return { count };
  }

  /**
   * Clean up expired notifications (background job)
   */
  async cleanupExpiredNotifications() {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        read: true, // Only delete read expired notifications
      },
    });

    logger.info(`Cleaned up ${result.count} expired notifications`);
    return result.count;
  }
}

export const notificationsService = new NotificationsService();

