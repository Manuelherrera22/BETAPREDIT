/**
 * Value Bet Detection Routes
 */

import { Router } from 'express';
import { valueBetDetectionController } from '../controllers/value-bet-detection.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/value-bet-detection/sport/:sport
 * @desc    Detect value bets for a specific sport
 * @access  Private
 * @query   minValue - Minimum value percentage (default: 0.05)
 * @query   maxEvents - Maximum events to check (default: 20)
 * @query   autoCreateAlerts - Auto-create alerts (default: false)
 */
router.get('/sport/:sport', valueBetDetectionController.detectForSport);

/**
 * @route   GET /api/value-bet-detection/scan-all
 * @desc    Scan all sports for value bets
 * @access  Private
 * @query   minValue - Minimum value percentage (default: 0.05)
 * @query   maxEvents - Maximum events per sport (default: 20)
 * @query   autoCreateAlerts - Auto-create alerts (default: false)
 */
router.get('/scan-all', valueBetDetectionController.scanAll);

export default router;



