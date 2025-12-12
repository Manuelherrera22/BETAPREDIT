/**
 * ROI Tracking Routes
 */

import { Router } from 'express';
import { roiTrackingController } from '../controllers/roi-tracking.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/roi-tracking
 * @desc    Get ROI tracking for current user
 * @access  Private
 */
router.get('/', roiTrackingController.getROITracking);

/**
 * @route   GET /api/roi-tracking/history
 * @desc    Get ROI history for charts
 * @access  Private
 */
router.get('/history', roiTrackingController.getROIHistory);

/**
 * @route   GET /api/roi-tracking/top-value-bets
 * @desc    Get top value bets by ROI
 * @access  Private
 */
router.get('/top-value-bets', roiTrackingController.getTopValueBets);

export default router;




