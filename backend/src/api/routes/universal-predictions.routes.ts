/**
 * Universal Predictions Routes
 * Endpoints for universal prediction model (multi-domain)
 */

import { Router } from 'express';
import { universalPredictionsController } from '../controllers/universal-predictions.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Get universal prediction
router.post('/predict', authenticate, universalPredictionsController.predict);

// Adapt model to new domain
router.post('/adapt/:domain', authenticate, universalPredictionsController.adaptDomain);

// Get supported domains
router.get('/domains', authenticate, universalPredictionsController.getDomains);

// Get model info
router.get('/model-info', authenticate, universalPredictionsController.getModelInfo);

export default router;

