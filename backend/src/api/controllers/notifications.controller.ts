import { Request, Response, NextFunction } from 'express';
import { notificationsService } from '../../services/notifications.service';

class NotificationsController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { read, type, limit, offset } = req.query;
      const notifications = await notificationsService.getUserNotifications(userId, {
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        type: type as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { notificationId } = req.params;
      const notification = await notificationsService.markAsRead(notificationId, userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const result = await notificationsService.markAllAsRead(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsClicked(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { notificationId } = req.params;
      const notification = await notificationsService.markAsClicked(notificationId, userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const result = await notificationsService.getUnreadCount(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const { notificationId } = req.params;
      await notificationsService.deleteNotification(notificationId, userId);
      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();

