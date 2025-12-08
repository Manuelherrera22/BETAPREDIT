import { Router } from 'express';
import { valueBetAlertsController } from '../controllers/value-bet-alerts.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', valueBetAlertsController.getMyAlerts.bind(valueBetAlertsController));
router.get('/stats', valueBetAlertsController.getAlertStats.bind(valueBetAlertsController));
router.post('/:alertId/click', valueBetAlertsController.markAsClicked.bind(valueBetAlertsController));
router.post('/:alertId/taken', valueBetAlertsController.markAsTaken.bind(valueBetAlertsController));

export default router;

