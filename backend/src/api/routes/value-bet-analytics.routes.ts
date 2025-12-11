/**
 * Value Bet Analytics Routes
 */

import { Router } from 'express';
import { valueBetAnalyticsController } from '../controllers/value-bet-analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/value-bet-analytics
 * @desc    Get analytics
 * @access  Private
 */
router.get('/', valueBetAnalyticsController.getAnalytics);

/**
 * @route   GET /api/value-bet-analytics/top
 * @desc    Get top value bets
 * @access  Private
 */
router.get('/top', valueBetAnalyticsController.getTopValueBets);

/**
 * @route   GET /api/value-bet-analytics/trends
 * @desc    Get trends
 * @access  Private
 */
router.get('/trends', valueBetAnalyticsController.getTrends);

/**
 * @route   POST /api/value-bet-analytics/track/:alertId
 * @desc    Track outcome
 * @access  Private
 */
router.post('/track/:alertId', valueBetAnalyticsController.trackOutcome);

export default router;



