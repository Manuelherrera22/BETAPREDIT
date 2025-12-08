import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { riskController } from '../controllers/risk.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get risk dashboard (admin only)
router.get('/dashboard', authorize('admin', 'trader'), riskController.getRiskDashboard);

// Get exposure for an event
router.get('/exposure/:eventId', authorize('admin', 'trader'), riskController.getEventExposure);

// Adjust odds manually (admin/trader)
router.post('/adjust-odds', authorize('admin', 'trader'), riskController.adjustOdds);

// Suspend market
router.post('/suspend-market', authorize('admin', 'trader'), riskController.suspendMarket);

// Get fraud alerts
router.get('/fraud-alerts', authorize('admin'), riskController.getFraudAlerts);

export default router;

