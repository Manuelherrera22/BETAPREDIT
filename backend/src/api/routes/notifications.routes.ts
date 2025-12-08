import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', notificationsController.getMyNotifications.bind(notificationsController));
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));
router.post('/:notificationId/read', notificationsController.markAsRead.bind(notificationsController));
router.post('/:notificationId/click', notificationsController.markAsClicked.bind(notificationsController));
router.post('/read-all', notificationsController.markAllAsRead.bind(notificationsController));
router.delete('/:notificationId', notificationsController.deleteNotification.bind(notificationsController));

export default router;

