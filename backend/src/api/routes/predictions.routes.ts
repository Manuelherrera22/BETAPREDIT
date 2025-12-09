/**
 * Predictions Routes
 */

import { Router } from 'express';
import { predictionsController } from '../controllers/predictions.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/predictions/accuracy
 * @desc    Get prediction accuracy tracking with detailed metrics
 * @access  Private
 */
router.get('/accuracy', predictionsController.getAccuracyStats.bind(predictionsController));

/**
 * @route   GET /api/predictions/event/:eventId
 * @desc    Get predictions for a specific event
 * @access  Private
 */
router.get('/event/:eventId', predictionsController.getEventPredictions.bind(predictionsController));

/**
 * @route   GET /api/predictions/stats
 * @desc    Get basic prediction statistics
 * @access  Private
 */
router.get('/stats', predictionsController.getPredictionStats.bind(predictionsController));

export default router;

