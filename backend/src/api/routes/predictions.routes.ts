/**
 * Predictions Routes
 */

import { Router } from 'express';
import { predictionsController } from '../controllers/predictions.controller';
import { authenticate } from '../../middleware/auth';
import { validate, validateQuery, validateParams } from '../../middleware/validate';
import {
  getPredictionsQuerySchema,
  submitFeedbackSchema,
  regeneratePredictionsSchema,
} from '../../validators/prediction.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/predictions/accuracy
 * @desc    Get prediction accuracy tracking with detailed metrics
 * @access  Private
 */
router.get('/accuracy', validateQuery(getPredictionsQuerySchema), predictionsController.getAccuracyStats.bind(predictionsController));

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

/**
 * @route   GET /api/predictions/history
 * @desc    Get prediction history (resolved predictions)
 * @access  Private
 */
router.get('/history', validateQuery(getPredictionsQuerySchema), predictionsController.getPredictionHistory.bind(predictionsController));

/**
 * @route   POST /api/predictions/train-model
 * @desc    Re-train ML model with all advanced features (50+)
 * @access  Private
 */
router.post('/train-model', predictionsController.trainModel.bind(predictionsController));

/**
 * @route   POST /api/predictions/generate
 * @desc    Manually trigger prediction generation for upcoming events
 * @access  Private
 */
router.post('/generate', validate(regeneratePredictionsSchema), predictionsController.generatePredictions.bind(predictionsController));

/**
 * @route   POST /api/predictions/:predictionId/feedback
 * @desc    Submit user feedback on a prediction
 * @access  Private
 */
router.post('/:predictionId/feedback', validate(submitFeedbackSchema), predictionsController.submitFeedback.bind(predictionsController));

/**
 * @route   GET /api/predictions/:predictionId/factors
 * @desc    Get prediction with detailed factors explanation
 * @access  Private
 */
router.get('/:predictionId/factors', predictionsController.getPredictionFactors.bind(predictionsController));

export default router;

