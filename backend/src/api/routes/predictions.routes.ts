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
  getEventPredictionsSchema,
  getPredictionFactorsSchema,
} from '../../validators/predictions.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/predictions/accuracy:
 *   get:
 *     summary: Obtener estadísticas de precisión de predicciones
 *     description: Retorna métricas detalladas de precisión de las predicciones, incluyendo win rate, ROI, y tendencias
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modelVersion
 *         schema:
 *           type: string
 *         description: Versión del modelo a filtrar
 *       - in: query
 *         name: sportId
 *         schema:
 *           type: string
 *         description: ID del deporte a filtrar
 *       - in: query
 *         name: marketType
 *         schema:
 *           type: string
 *         description: Tipo de mercado a filtrar
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del rango
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del rango
 *     responses:
 *       200:
 *         description: Estadísticas de precisión obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overallAccuracy:
 *                       type: number
 *                       example: 0.65
 *                     winRate:
 *                       type: number
 *                       example: 0.68
 *                     totalPredictions:
 *                       type: number
 *                       example: 150
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/accuracy', validateQuery(getPredictionsQuerySchema), predictionsController.getAccuracyStats.bind(predictionsController));

/**
 * @swagger
 * /api/predictions/event/{eventId}:
 *   get:
 *     summary: Obtener predicciones para un evento específico
 *     description: Retorna todas las predicciones disponibles para un evento, con validación de calidad de datos
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Predicciones obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       selection:
 *                         type: string
 *                       predictedProbability:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 1
 *                       confidence:
 *                         type: number
 *                         minimum: 0.45
 *                         maximum: 0.95
 *                       dataQuality:
 *                         type: object
 *                         properties:
 *                           isValid:
 *                             type: boolean
 *                           completeness:
 *                             type: number
 *                           canDisplay:
 *                             type: boolean
 *                           message:
 *                             type: string
 *       404:
 *         description: Evento no encontrado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/event/:eventId', validateParams(getEventPredictionsSchema), predictionsController.getEventPredictions.bind(predictionsController));

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
 * @swagger
 * /api/predictions/{predictionId}/feedback:
 *   post:
 *     summary: Enviar feedback sobre una predicción
 *     description: Permite a los usuarios enviar feedback sobre la precisión de una predicción
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la predicción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wasCorrect
 *             properties:
 *               wasCorrect:
 *                 type: boolean
 *                 description: Si la predicción fue correcta
 *                 example: true
 *               userConfidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Confianza del usuario en la predicción (0-1)
 *                 example: 0.8
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notas adicionales del usuario
 *     responses:
 *       200:
 *         description: Feedback enviado exitosamente
 *       400:
 *         description: Datos de validación inválidos
 *       404:
 *         description: Predicción no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:predictionId/feedback', validate(submitFeedbackSchema), predictionsController.submitFeedback.bind(predictionsController));

/**
 * @route   GET /api/predictions/:predictionId/factors
 * @desc    Get prediction with detailed factors explanation
 * @access  Private
 */
router.get('/:predictionId/factors', validateParams(getPredictionFactorsSchema), predictionsController.getPredictionFactors.bind(predictionsController));

export default router;

