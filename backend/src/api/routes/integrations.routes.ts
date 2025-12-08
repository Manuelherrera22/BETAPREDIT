import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { integrationsController } from '../controllers/integrations.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Sportradar endpoints
router.get('/sportradar/odds/:eventId', integrationsController.getSportradarOdds);
router.get('/sportradar/events/live', integrationsController.getSportradarLiveEvents);
router.post('/sportradar/integrity/check', authorize('admin', 'trader'), integrationsController.checkIntegrity);

// Player data endpoints
router.get('/player-data/:eventId', integrationsController.getPlayerTrackingData);
router.get('/player-data/:eventId/metrics', integrationsController.getMatchMetrics);
router.get('/player-data/:eventId/player/:playerId', integrationsController.getPlayerMetrics);

// Predictive algorithms
router.post('/predictions/:provider', integrationsController.getPredictions);
router.post('/bet-sizing/:provider', integrationsController.getBetSizing);
router.post('/value-bets/:provider', integrationsController.getValueBets);

export default router;

