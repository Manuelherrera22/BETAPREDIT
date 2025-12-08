import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rgController } from '../controllers/responsible-gaming.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's RG status
router.get('/status', rgController.getRGStatus);

// Set deposit limit
router.post('/deposit-limit', rgController.setDepositLimit);

// Set loss limit
router.post('/loss-limit', rgController.setLossLimit);

// Set session time limit
router.post('/session-limit', rgController.setSessionLimit);

// Request self-exclusion
router.post('/self-exclude', rgController.requestSelfExclusion);

// Get RG alerts (if any)
router.get('/alerts', rgController.getRGAlerts);

export default router;

