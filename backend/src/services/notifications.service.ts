import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { emailService } from './email.service';
import { webSocketService } from './websocket.service';

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

      // Send via WebSocket if user is connected
      webSocketService.emitNotification(data.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      });

      // Send email if notification type requires it
      if (notification.user?.email && this.shouldSendEmail(notification.type)) {
        try {
          await emailService.sendEmail({
            to: notification.user.email,
            subject: notification.title,
            html: this.getEmailTemplate(notification),
          });
          // Update sentVia
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              sentVia: ['in_app', 'email'],
              sentAt: new Date(),
            },
          });
        } catch (error) {
          logger.error('Error sending notification email:', error);
        }
      }

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

  /**
   * Check if notification type should trigger email
   */
  private shouldSendEmail(type: string): boolean {
    const emailTypes = ['VALUE_BET_DETECTED', 'BET_SETTLED', 'SYSTEM_ALERT'];
    return emailTypes.includes(type);
  }

  /**
   * Get email template for notification
   */
  private getEmailTemplate(notification: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content">
            <p>${notification.message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/notifications" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px;">
              Ver Notificación
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const notificationsService = new NotificationsService();

